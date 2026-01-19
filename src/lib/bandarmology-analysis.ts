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

const BIG_BROKER_CODES = ['ZP', 'AK', 'YP', 'CC', 'CP', 'DX', 'KI', 'EP', 'DH', 'AF', 'BZ', 'FS', 'AI', 'ID', 'AG', 'EB', 'ML', 'RX', 'DB', 'CS', 'MS'];

export function analyzeBrokerSummary(brokers: BrokerSummary[]): BandarmologySummary {
  const signals: BandarmologySignal[] = [];
  
  const sortedByNetValue = [...brokers].sort((a, b) => b.net_value - a.net_value);
  const topBuyers = sortedByNetValue.filter(b => b.net_value > 0).slice(0, 10);
  const topSellers = sortedByNetValue.filter(b => b.net_value < 0).slice(0, 10);

  const topBuyerFlows: BrokerFlow[] = topBuyers.map(b => ({
    brokerCode: b.broker_code,
    brokerName: b.broker_name,
    netValue: b.net_value,
    netVolume: b.net_volume,
    buyValue: b.buy_value,
    sellValue: b.sell_value,
    flow: 'buy' as const,
    intensity: calculateIntensity(b.net_value, b.buy_value + b.sell_value),
    brokerType: b.broker_type,
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
    brokerType: b.broker_type,
  }));

  const foreignBrokers = brokers.filter(b => b.broker_type === 'Asing');
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

  const bigBrokers = brokers.filter(b => BIG_BROKER_CODES.includes(b.broker_code) || b.broker_type === 'Asing');
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

  const totalVolume = brokers.reduce((sum, b) => sum + b.buy_value + b.sell_value, 0);
  
  const buyerConcentration = topBuyers.length > 0 
    ? topBuyers.reduce((sum, b) => sum + b.net_value, 0) / (totalVolume || 1)
    : 0;

  if (buyerConcentration > 0.05) {
    signals.push({
      type: 'accumulation',
      strength: Math.min(0.85, buyerConcentration * 10),
      description: `High buyer concentration: ${(buyerConcentration * 100).toFixed(1)}%`,
    });
  }

  const sellerConcentration = topSellers.length > 0
    ? Math.abs(topSellers.reduce((sum, b) => sum + b.net_value, 0)) / (totalVolume || 1)
    : 0;

  if (sellerConcentration > 0.05) {
    signals.push({
      type: 'distribution',
      strength: Math.min(0.85, sellerConcentration * 10),
      description: `High seller concentration: ${(sellerConcentration * 100).toFixed(1)}%`,
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
