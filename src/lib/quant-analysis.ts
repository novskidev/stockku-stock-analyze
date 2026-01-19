import { OHLCV, TechnicalSummary, calculateTechnicalSummary } from './technical-analysis';
import { FundamentalSummary } from './fundamental-analysis';
import { BandarmologySummary } from './bandarmology-analysis';

export interface TradingSignal {
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  targetPrice: number | null;
  stopLoss: number | null;
  riskRewardRatio: number | null;
  timeframe: 'short' | 'medium' | 'long';
  reasoning: string[];
}

export interface QuantAnalysis {
  signal: TradingSignal;
  technicalScore: number;
  fundamentalScore: number;
  bandarmologyScore: number;
  compositeScore: number;
  momentum: number;
  volatility: number;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  supportLevels: number[];
  resistanceLevels: number[];
}

export interface PredictionResult {
  direction: 'up' | 'down' | 'sideways';
  probability: number;
  expectedReturn: number;
  confidence: number;
  factors: { name: string; weight: number; contribution: number }[];
}

function calculateMomentum(data: OHLCV[], period: number = 10): number {
  if (data.length < period) return 0;
  const currentClose = data[data.length - 1].close;
  const previousClose = data[data.length - period].close;
  return ((currentClose - previousClose) / previousClose) * 100;
}

function calculateVolatility(data: OHLCV[], period: number = 20): number {
  if (data.length < period) return 0;
  const closes = data.slice(-period).map(d => d.close);
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

function detectTrend(data: OHLCV[], period: number = 20): 'uptrend' | 'downtrend' | 'sideways' {
  if (data.length < period) return 'sideways';
  
  const closes = data.slice(-period).map(d => d.close);
  const n = closes.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = closes.reduce((sum, c) => sum + c, 0);
  const sumXY = closes.reduce((sum, c, i) => sum + i * c, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgPrice = sumY / n;
  const normalizedSlope = (slope / avgPrice) * 100;
  
  if (normalizedSlope > 0.1) return 'uptrend';
  if (normalizedSlope < -0.1) return 'downtrend';
  return 'sideways';
}

function findSupportResistance(data: OHLCV[], levels: number = 3): { support: number[]; resistance: number[] } {
  if (data.length < 20) return { support: [], resistance: [] };
  
  const currentPrice = data[data.length - 1].close;
  const pivotPoints: { price: number; strength: number; type: 'support' | 'resistance' }[] = [];
  
  for (let i = 2; i < data.length - 2; i++) {
    const isLocalHigh = data[i].high > data[i - 1].high && 
                        data[i].high > data[i - 2].high &&
                        data[i].high > data[i + 1].high &&
                        data[i].high > data[i + 2].high;
    
    const isLocalLow = data[i].low < data[i - 1].low && 
                       data[i].low < data[i - 2].low &&
                       data[i].low < data[i + 1].low &&
                       data[i].low < data[i + 2].low;
    
    if (isLocalHigh) {
      pivotPoints.push({
        price: data[i].high,
        strength: 1,
        type: data[i].high > currentPrice ? 'resistance' : 'support',
      });
    }
    
    if (isLocalLow) {
      pivotPoints.push({
        price: data[i].low,
        strength: 1,
        type: data[i].low < currentPrice ? 'support' : 'resistance',
      });
    }
  }
  
  const consolidatedPivots: typeof pivotPoints = [];
  const tolerance = currentPrice * 0.02;
  
  for (const pivot of pivotPoints) {
    const existing = consolidatedPivots.find(
      p => Math.abs(p.price - pivot.price) < tolerance && p.type === pivot.type
    );
    if (existing) {
      existing.strength++;
      existing.price = (existing.price + pivot.price) / 2;
    } else {
      consolidatedPivots.push({ ...pivot });
    }
  }
  
  const sortedByStrength = consolidatedPivots.sort((a, b) => b.strength - a.strength);
  
  const support = sortedByStrength
    .filter(p => p.type === 'support')
    .slice(0, levels)
    .map(p => p.price)
    .sort((a, b) => b - a);
  
  const resistance = sortedByStrength
    .filter(p => p.type === 'resistance')
    .slice(0, levels)
    .map(p => p.price)
    .sort((a, b) => a - b);
  
  return { support, resistance };
}

export function generateQuantSignal(
  data: OHLCV[],
  technical: TechnicalSummary | null,
  fundamental: FundamentalSummary | null,
  bandarmology: BandarmologySummary | null
): QuantAnalysis {
  const currentPrice = data[data.length - 1]?.close || 0;
  const momentum = calculateMomentum(data);
  const volatility = calculateVolatility(data);
  const trend = detectTrend(data);
  const { support, resistance } = findSupportResistance(data);
  
  let technicalScore = 50;
  if (technical) {
    switch (technical.overallSignal) {
      case 'strong_buy': technicalScore = 90; break;
      case 'buy': technicalScore = 70; break;
      case 'neutral': technicalScore = 50; break;
      case 'sell': technicalScore = 30; break;
      case 'strong_sell': technicalScore = 10; break;
    }
    technicalScore = (technicalScore + technical.confidence) / 2;
  }
  
  let fundamentalScore = 50;
  if (fundamental) {
    fundamentalScore = fundamental.score;
  }
  
  let bandarmologyScore = 50;
  if (bandarmology) {
    switch (bandarmology.overallSignal) {
      case 'strong_accumulation': bandarmologyScore = 90; break;
      case 'accumulation': bandarmologyScore = 70; break;
      case 'neutral': bandarmologyScore = 50; break;
      case 'distribution': bandarmologyScore = 30; break;
      case 'strong_distribution': bandarmologyScore = 10; break;
    }
    bandarmologyScore = (bandarmologyScore + bandarmology.confidence) / 2;
  }
  
  const weights = {
    technical: 0.4,
    fundamental: 0.3,
    bandarmology: 0.3,
  };
  
  const compositeScore = 
    technicalScore * weights.technical +
    fundamentalScore * weights.fundamental +
    bandarmologyScore * weights.bandarmology;
  
  const reasoning: string[] = [];
  
  if (technical) {
    reasoning.push(`Technical: ${technical.overallSignal.replace('_', ' ')} (${technical.confidence.toFixed(0)}% confidence)`);
  }
  if (fundamental) {
    reasoning.push(`Fundamental: ${fundamental.overallRating} (Score: ${fundamental.score})`);
  }
  if (bandarmology) {
    reasoning.push(`Bandarmology: ${bandarmology.overallSignal.replace('_', ' ')} - ${bandarmology.smartMoneyDirection} smart money`);
  }
  reasoning.push(`Trend: ${trend}, Momentum: ${momentum.toFixed(2)}%, Volatility: ${volatility.toFixed(2)}%`);
  
  let action: TradingSignal['action'];
  if (compositeScore >= 75) {
    action = 'strong_buy';
  } else if (compositeScore >= 60) {
    action = 'buy';
  } else if (compositeScore >= 40) {
    action = 'hold';
  } else if (compositeScore >= 25) {
    action = 'sell';
  } else {
    action = 'strong_sell';
  }
  
  let targetPrice: number | null = null;
  let stopLoss: number | null = null;
  
  if (action === 'buy' || action === 'strong_buy') {
    targetPrice = resistance[0] || currentPrice * 1.1;
    stopLoss = support[0] || currentPrice * 0.95;
  } else if (action === 'sell' || action === 'strong_sell') {
    targetPrice = support[0] || currentPrice * 0.9;
    stopLoss = resistance[0] || currentPrice * 1.05;
  }
  
  const potentialGain = targetPrice ? Math.abs(targetPrice - currentPrice) : 0;
  const potentialLoss = stopLoss ? Math.abs(currentPrice - stopLoss) : 0;
  const riskRewardRatio = potentialLoss > 0 ? potentialGain / potentialLoss : null;
  
  let timeframe: TradingSignal['timeframe'] = 'medium';
  if (volatility > 40) {
    timeframe = 'short';
  } else if (volatility < 20 && trend !== 'sideways') {
    timeframe = 'long';
  }
  
  return {
    signal: {
      action,
      confidence: Math.min(95, Math.max(5, compositeScore)),
      targetPrice,
      stopLoss,
      riskRewardRatio,
      timeframe,
      reasoning,
    },
    technicalScore,
    fundamentalScore,
    bandarmologyScore,
    compositeScore,
    momentum,
    volatility,
    trend,
    supportLevels: support,
    resistanceLevels: resistance,
  };
}

export function predictPriceMovement(
  data: OHLCV[],
  technical: TechnicalSummary | null,
  fundamental: FundamentalSummary | null,
  bandarmology: BandarmologySummary | null
): PredictionResult {
  const factors: { name: string; weight: number; contribution: number }[] = [];
  
  const momentum = calculateMomentum(data);
  const trend = detectTrend(data);
  const volatility = calculateVolatility(data);
  
  let upProbability = 0.5;
  
  if (technical) {
    const technicalContribution = 
      technical.overallSignal === 'strong_buy' ? 0.2 :
      technical.overallSignal === 'buy' ? 0.1 :
      technical.overallSignal === 'sell' ? -0.1 :
      technical.overallSignal === 'strong_sell' ? -0.2 : 0;
    
    upProbability += technicalContribution * (technical.confidence / 100);
    factors.push({
      name: 'Technical Analysis',
      weight: 0.35,
      contribution: technicalContribution * 100,
    });
  }
  
  if (fundamental) {
    const fundamentalContribution = (fundamental.score - 50) / 200;
    upProbability += fundamentalContribution * 0.8;
    factors.push({
      name: 'Fundamental Analysis',
      weight: 0.25,
      contribution: fundamentalContribution * 100,
    });
  }
  
  if (bandarmology) {
    const bandarmologyContribution = 
      bandarmology.overallSignal === 'strong_accumulation' ? 0.15 :
      bandarmology.overallSignal === 'accumulation' ? 0.08 :
      bandarmology.overallSignal === 'distribution' ? -0.08 :
      bandarmology.overallSignal === 'strong_distribution' ? -0.15 : 0;
    
    upProbability += bandarmologyContribution;
    factors.push({
      name: 'Bandarmology',
      weight: 0.25,
      contribution: bandarmologyContribution * 100,
    });
  }
  
  const trendContribution = 
    trend === 'uptrend' ? 0.1 :
    trend === 'downtrend' ? -0.1 : 0;
  
  upProbability += trendContribution;
  factors.push({
    name: 'Trend Analysis',
    weight: 0.15,
    contribution: trendContribution * 100,
  });
  
  upProbability = Math.max(0.05, Math.min(0.95, upProbability));
  
  let direction: 'up' | 'down' | 'sideways';
  if (upProbability > 0.55) {
    direction = 'up';
  } else if (upProbability < 0.45) {
    direction = 'down';
  } else {
    direction = 'sideways';
  }
  
  const avgReturn = data.length > 20 
    ? data.slice(-20).reduce((sum, d, i, arr) => {
        if (i === 0) return 0;
        return sum + (d.close - arr[i - 1].close) / arr[i - 1].close;
      }, 0) / 19 * 100
    : 0;
  
  const expectedReturn = direction === 'up' 
    ? Math.abs(avgReturn) * 1.5 
    : direction === 'down' 
      ? -Math.abs(avgReturn) * 1.5 
      : avgReturn * 0.5;
  
  const confidence = Math.abs(upProbability - 0.5) * 200;
  
  return {
    direction,
    probability: direction === 'up' ? upProbability : direction === 'down' ? 1 - upProbability : 0.5,
    expectedReturn,
    confidence: Math.min(90, Math.max(10, confidence)),
    factors,
  };
}

export function runBacktest(
  data: OHLCV[],
  strategy: (slice: OHLCV[]) => 'buy' | 'sell' | 'hold',
  lookbackPeriod: number = 50,
  startCapital: number = 100000000
): {
  finalCapital: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: { date: string; action: string; price: number; pnl: number }[];
} {
  if (data.length < lookbackPeriod + 10) {
    return {
      finalCapital: startCapital,
      totalReturn: 0,
      winRate: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      trades: [],
    };
  }
  
  let capital = startCapital;
  let position = 0;
  let entryPrice = 0;
  let peakCapital = startCapital;
  let maxDrawdown = 0;
  const trades: { date: string; action: string; price: number; pnl: number }[] = [];
  const dailyReturns: number[] = [];
  let previousCapital = startCapital;
  
  for (let i = lookbackPeriod; i < data.length; i++) {
    const slice = data.slice(i - lookbackPeriod, i + 1);
    const signal = strategy(slice);
    const currentPrice = data[i].close;
    
    if (signal === 'buy' && position === 0) {
      position = Math.floor(capital / currentPrice);
      entryPrice = currentPrice;
      capital -= position * currentPrice;
      trades.push({
        date: data[i].date,
        action: 'BUY',
        price: currentPrice,
        pnl: 0,
      });
    } else if (signal === 'sell' && position > 0) {
      const proceeds = position * currentPrice;
      const pnl = proceeds - (position * entryPrice);
      capital += proceeds;
      trades.push({
        date: data[i].date,
        action: 'SELL',
        price: currentPrice,
        pnl,
      });
      position = 0;
      entryPrice = 0;
    }
    
    const currentTotalValue = capital + position * currentPrice;
    const dailyReturn = (currentTotalValue - previousCapital) / previousCapital;
    dailyReturns.push(dailyReturn);
    previousCapital = currentTotalValue;
    
    if (currentTotalValue > peakCapital) {
      peakCapital = currentTotalValue;
    }
    const drawdown = (peakCapital - currentTotalValue) / peakCapital;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  const finalCapital = capital + position * data[data.length - 1].close;
  const totalReturn = ((finalCapital - startCapital) / startCapital) * 100;
  
  const winningTrades = trades.filter(t => t.action === 'SELL' && t.pnl > 0).length;
  const totalSellTrades = trades.filter(t => t.action === 'SELL').length;
  const winRate = totalSellTrades > 0 ? (winningTrades / totalSellTrades) * 100 : 0;
  
  const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const stdReturn = Math.sqrt(
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length
  );
  const sharpeRatio = stdReturn > 0 ? (avgReturn * 252) / (stdReturn * Math.sqrt(252)) : 0;
  
  return {
    finalCapital,
    totalReturn,
    winRate,
    maxDrawdown: maxDrawdown * 100,
    sharpeRatio,
    trades,
  };
}

export function createSimpleStrategy(
  buyThreshold: number = 60,
  sellThreshold: number = 40
): (slice: OHLCV[]) => 'buy' | 'sell' | 'hold' {
  return (slice: OHLCV[]) => {
    const technical = calculateTechnicalSummary(slice);
    
    let score = 50;
    switch (technical.overallSignal) {
      case 'strong_buy': score = 90; break;
      case 'buy': score = 70; break;
      case 'neutral': score = 50; break;
      case 'sell': score = 30; break;
      case 'strong_sell': score = 10; break;
    }
    
    if (score >= buyThreshold) return 'buy';
    if (score <= sellThreshold) return 'sell';
    return 'hold';
  };
}
