import { BrokerSummary } from './datasaham-api';

export interface BandarmologySignal {
  type: 'accumulation' | 'distribution' | 'neutral';
  strength: number;
  description: string;
}

export interface BrokerFlow {
  brokerCode: string;
  brokerName: string;
  netValue: number;
  netVolume: number;
  buyValue: number;
  sellValue: number;
  flow: 'buy' | 'sell' | 'neutral';
  intensity: number;
  brokerType?: string;
}

export interface ForeignFlow {
  netBuy: number;
  netSell: number;
  netValue: number;
  trend: 'inflow' | 'outflow' | 'neutral';
  intensity: number;
}

export interface BandarmologySummary {
  overallSignal: 'strong_accumulation' | 'accumulation' | 'neutral' | 'distribution' | 'strong_distribution';
  confidence: number;
  signals: BandarmologySignal[];
  topBuyers: BrokerFlow[];
  topSellers: BrokerFlow[];
  foreignFlow: ForeignFlow | null;
  smartMoneyDirection: 'bullish' | 'bearish' | 'neutral';
}

const BIG_BROKER_CODES = ['ZP', 'AK', 'IF', 'SQ', 'BB', 'CP', 'DX', 'KI', 'EP', 'DH', 'AF', 'BZ', 'FS', 'AI', 'ID', 'AG', 'EB'];

export function analyzeBrokerSummary(brokers: BrokerSummary[]): BandarmologySummary {
  const signals: BandarmologySignal[] = [];
  
  const sortedByNetValue = [...brokers].sort((a, b) => b.net_value - a.net_value);
  const topBuyers = sortedByNetValue.filter(b => b.net_value > 0).slice(0, 10);
  const topSellers = sortedByNetValue.filter(b => b.net_value < 0).slice(-10).reverse();

  const topBuyerFlows: BrokerFlow[] = topBuyers.map(b => ({
    brokerCode: b.broker_code,
    brokerName: b.broker_name,
    netValue: b.net_value,
    netVolume: b.net_volume,
    buyValue: b.buy_value,
    sellValue: b.sell_value,
    flow: 'buy' as const,
    intensity: calculateIntensity(b.net_value, b.buy_value + b.sell_value),
    brokerType: (b as BrokerSummary & { broker_type?: string }).broker_type,
  }));

  const topSellerFlows: BrokerFlow[] = topSellers.map(b => ({
    brokerCode: b.broker_code,
    brokerName: b.broker_name,
    netValue: b.net_value,
    netVolume: b.net_volume,
    buyValue: b.buy_value,
    sellValue: b.sell_value,
    flow: 'sell' as const,
    intensity: calculateIntensity(Math.abs(b.net_value), b.buy_value + b.sell_value),
    brokerType: (b as BrokerSummary & { broker_type?: string }).broker_type,
  }));

  const foreignBrokers = brokers.filter(b => (b as BrokerSummary & { broker_type?: string }).broker_type === 'Asing');
  const foreignNetBuy = foreignBrokers.reduce((sum, b) => sum + (b.net_value > 0 ? b.net_value : 0), 0);
  const foreignNetSell = foreignBrokers.reduce((sum, b) => sum + (b.net_value < 0 ? Math.abs(b.net_value) : 0), 0);
  const foreignNetValue = foreignBrokers.reduce((sum, b) => sum + b.net_value, 0);
  const totalForeignVolume = foreignBrokers.reduce((sum, b) => sum + b.buy_value + b.sell_value, 0);

  let foreignFlow: ForeignFlow | null = null;
  if (foreignBrokers.length > 0) {
    foreignFlow = {
      netBuy: foreignNetBuy,
      netSell: foreignNetSell,
      netValue: foreignNetValue,
      trend: foreignNetValue > 0 ? 'inflow' : foreignNetValue < 0 ? 'outflow' : 'neutral',
      intensity: totalForeignVolume > 0 ? Math.abs(foreignNetValue) / totalForeignVolume : 0,
    };

    if (foreignNetValue > 0) {
      signals.push({
        type: 'accumulation',
        strength: Math.min(0.9, 0.5 + foreignFlow.intensity),
        description: `Foreign net buy: ${formatCurrency(foreignNetValue)}`,
      });
    } else if (foreignNetValue < 0) {
      signals.push({
        type: 'distribution',
        strength: Math.min(0.9, 0.5 + foreignFlow.intensity),
        description: `Foreign net sell: ${formatCurrency(Math.abs(foreignNetValue))}`,
      });
    }
  }

  const bigBrokers = brokers.filter(b => BIG_BROKER_CODES.includes(b.broker_code));
  const bigBrokerNetValue = bigBrokers.reduce((sum, b) => sum + b.net_value, 0);
  
  let smartMoneyDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (bigBrokerNetValue > 0) {
    smartMoneyDirection = 'bullish';
    signals.push({
      type: 'accumulation',
      strength: 0.7,
      description: `Smart money accumulation: ${formatCurrency(bigBrokerNetValue)}`,
    });
  } else if (bigBrokerNetValue < 0) {
    smartMoneyDirection = 'bearish';
    signals.push({
      type: 'distribution',
      strength: 0.7,
      description: `Smart money distribution: ${formatCurrency(Math.abs(bigBrokerNetValue))}`,
    });
  }

  const totalNetValue = brokers.reduce((sum, b) => sum + b.net_value, 0);
  const totalVolume = brokers.reduce((sum, b) => sum + b.buy_value + b.sell_value, 0);
  
  const concentrationRatio = topBuyers.length > 0 
    ? topBuyers.reduce((sum, b) => sum + b.net_value, 0) / (totalVolume || 1)
    : 0;

  if (concentrationRatio > 0.1) {
    signals.push({
      type: 'accumulation',
      strength: Math.min(0.85, concentrationRatio * 5),
      description: `High buyer concentration: ${(concentrationRatio * 100).toFixed(1)}%`,
    });
  }

  const distributionRatio = topSellers.length > 0
    ? Math.abs(topSellers.reduce((sum, b) => sum + b.net_value, 0)) / (totalVolume || 1)
    : 0;

  if (distributionRatio > 0.1) {
    signals.push({
      type: 'distribution',
      strength: Math.min(0.85, distributionRatio * 5),
      description: `High seller concentration: ${(distributionRatio * 100).toFixed(1)}%`,
    });
  }

  let accumulationScore = 0;
  let distributionScore = 0;
  
  for (const signal of signals) {
    if (signal.type === 'accumulation') {
      accumulationScore += signal.strength;
    } else if (signal.type === 'distribution') {
      distributionScore += signal.strength;
    }
  }

  const netScore = accumulationScore - distributionScore;
  const maxScore = Math.max(accumulationScore, distributionScore, 1);
  const confidence = Math.min(95, (Math.abs(netScore) / maxScore) * 100);

  let overallSignal: BandarmologySummary['overallSignal'];
  if (netScore > 1.5) {
    overallSignal = 'strong_accumulation';
  } else if (netScore > 0.5) {
    overallSignal = 'accumulation';
  } else if (netScore < -1.5) {
    overallSignal = 'strong_distribution';
  } else if (netScore < -0.5) {
    overallSignal = 'distribution';
  } else {
    overallSignal = 'neutral';
  }

  return {
    overallSignal,
    confidence,
    signals,
    topBuyers: topBuyerFlows,
    topSellers: topSellerFlows,
    foreignFlow,
    smartMoneyDirection,
  };
}

function calculateIntensity(netValue: number, totalValue: number): number {
  if (totalValue === 0) return 0;
  return Math.min(1, Math.abs(netValue) / totalValue);
}

function formatCurrency(value: number): string {
  if (value >= 1e12) return `Rp ${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `Rp ${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `Rp ${(value / 1e6).toFixed(2)}M`;
  return `Rp ${value.toLocaleString()}`;
}

export function detectAccumulationPattern(
  brokerHistory: BrokerSummary[][],
  days: number = 5
): { isAccumulating: boolean; confidence: number; pattern: string } {
  if (brokerHistory.length < days) {
    return { isAccumulating: false, confidence: 0, pattern: 'Insufficient data' };
  }

  const recentHistory = brokerHistory.slice(-days);
  let consecutiveBuyDays = 0;
  let totalNetBuy = 0;

  for (const dayBrokers of recentHistory) {
    const dayNetValue = dayBrokers.reduce((sum, b) => sum + b.net_value, 0);
    if (dayNetValue > 0) {
      consecutiveBuyDays++;
      totalNetBuy += dayNetValue;
    }
  }

  const isAccumulating = consecutiveBuyDays >= Math.ceil(days * 0.6);
  const confidence = (consecutiveBuyDays / days) * 100;

  let pattern = 'Neutral';
  if (consecutiveBuyDays === days) {
    pattern = 'Strong accumulation - all days positive';
  } else if (consecutiveBuyDays >= days * 0.8) {
    pattern = 'Consistent accumulation pattern';
  } else if (consecutiveBuyDays >= days * 0.6) {
    pattern = 'Moderate accumulation tendency';
  } else if (consecutiveBuyDays <= days * 0.2) {
    pattern = 'Distribution pattern detected';
  }

  return { isAccumulating, confidence, pattern };
}

export function analyzeForeignInstitutionalFlow(
  brokers: BrokerSummary[]
): {
  institutional: { netValue: number; trend: string };
  retail: { netValue: number; trend: string };
  ratio: number;
} {
  const institutionalBrokers = brokers.filter(b => 
    FOREIGN_BROKER_CODES.includes(b.broker_code) || BIG_BROKER_CODES.includes(b.broker_code)
  );
  const retailBrokers = brokers.filter(b => 
    !FOREIGN_BROKER_CODES.includes(b.broker_code) && !BIG_BROKER_CODES.includes(b.broker_code)
  );

  const institutionalNet = institutionalBrokers.reduce((sum, b) => sum + b.net_value, 0);
  const retailNet = retailBrokers.reduce((sum, b) => sum + b.net_value, 0);

  const institutionalTrend = institutionalNet > 0 ? 'Buying' : institutionalNet < 0 ? 'Selling' : 'Neutral';
  const retailTrend = retailNet > 0 ? 'Buying' : retailNet < 0 ? 'Selling' : 'Neutral';

  const totalAbsNet = Math.abs(institutionalNet) + Math.abs(retailNet);
  const ratio = totalAbsNet > 0 ? Math.abs(institutionalNet) / totalAbsNet : 0.5;

  return {
    institutional: { netValue: institutionalNet, trend: institutionalTrend },
    retail: { netValue: retailNet, trend: retailTrend },
    ratio,
  };
}
