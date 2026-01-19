export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  bollingerBands: { upper: number; middle: number; lower: number } | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  atr: number | null;
  stochastic: { k: number; d: number } | null;
  obv: number | null;
  vwap: number | null;
}

export interface TechnicalSignal {
  indicator: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  description: string;
}

export interface TechnicalSummary {
  overallSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  confidence: number;
  signals: TechnicalSignal[];
  indicators: TechnicalIndicators;
}

function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

function calculateEMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

function calculateRSI(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;
  
  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  for (let i = period; i < changes.length; i++) {
    if (changes[i] > 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } | null {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  if (ema12 === null || ema26 === null) return null;
  
  const macdLine = ema12 - ema26;
  
  const macdHistory: number[] = [];
  let tempEma12 = closes.slice(0, 12).reduce((sum, val) => sum + val, 0) / 12;
  let tempEma26 = closes.slice(0, 26).reduce((sum, val) => sum + val, 0) / 26;
  
  for (let i = 26; i < closes.length; i++) {
    tempEma12 = (closes[i] - tempEma12) * (2 / 13) + tempEma12;
    tempEma26 = (closes[i] - tempEma26) * (2 / 27) + tempEma26;
    macdHistory.push(tempEma12 - tempEma26);
  }
  
  const signal = calculateEMA(macdHistory, 9) || macdLine;
  
  return {
    macd: macdLine,
    signal,
    histogram: macdLine - signal,
  };
}

function calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } | null {
  if (closes.length < period) return null;
  
  const slice = closes.slice(-period);
  const sma = slice.reduce((sum, val) => sum + val, 0) / period;
  
  const squaredDiffs = slice.map(val => Math.pow(val - sma, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    upper: sma + stdDev * standardDeviation,
    middle: sma,
    lower: sma - stdDev * standardDeviation,
  };
}

function calculateATR(data: OHLCV[], period: number = 14): number | null {
  if (data.length < period + 1) return null;
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  return calculateSMA(trueRanges, period);
}

function calculateStochastic(data: OHLCV[], kPeriod: number = 14, dPeriod: number = 3): { k: number; d: number } | null {
  if (data.length < kPeriod) return null;
  
  const kValues: number[] = [];
  
  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...slice.map(d => d.high));
    const lowestLow = Math.min(...slice.map(d => d.low));
    const currentClose = data[i].close;
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    kValues.push(k);
  }
  
  const currentK = kValues[kValues.length - 1];
  const d = calculateSMA(kValues, dPeriod) || currentK;
  
  return { k: currentK, d };
}

function calculateOBV(data: OHLCV[]): number | null {
  if (data.length < 2) return null;
  
  let obv = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      obv += data[i].volume;
    } else if (data[i].close < data[i - 1].close) {
      obv -= data[i].volume;
    }
  }
  
  return obv;
}

function calculateVWAP(data: OHLCV[]): number | null {
  if (data.length === 0) return null;
  
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (const bar of data) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    cumulativeTPV += typicalPrice * bar.volume;
    cumulativeVolume += bar.volume;
  }
  
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null;
}

export function calculateIndicators(data: OHLCV[]): TechnicalIndicators {
  const closes = data.map(d => d.close);
  
  return {
    rsi: calculateRSI(closes),
    macd: calculateMACD(closes),
    bollingerBands: calculateBollingerBands(closes),
    sma20: calculateSMA(closes, 20),
    sma50: calculateSMA(closes, 50),
    sma200: calculateSMA(closes, 200),
    ema12: calculateEMA(closes, 12),
    ema26: calculateEMA(closes, 26),
    atr: calculateATR(data),
    stochastic: calculateStochastic(data),
    obv: calculateOBV(data),
    vwap: calculateVWAP(data),
  };
}

export function generateSignals(data: OHLCV[], indicators: TechnicalIndicators): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  const currentPrice = data[data.length - 1]?.close || 0;
  
  if (indicators.rsi !== null) {
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength = 0.5;
    let description = '';
    
    if (indicators.rsi < 30) {
      signal = 'bullish';
      strength = 0.8;
      description = `RSI oversold (${indicators.rsi.toFixed(1)}) - potential reversal`;
    } else if (indicators.rsi > 70) {
      signal = 'bearish';
      strength = 0.8;
      description = `RSI overbought (${indicators.rsi.toFixed(1)}) - potential pullback`;
    } else if (indicators.rsi < 45) {
      signal = 'bullish';
      strength = 0.6;
      description = `RSI weak but recovering (${indicators.rsi.toFixed(1)})`;
    } else if (indicators.rsi > 55) {
      signal = 'bearish';
      strength = 0.6;
      description = `RSI strong but may weaken (${indicators.rsi.toFixed(1)})`;
    } else {
      description = `RSI neutral (${indicators.rsi.toFixed(1)})`;
    }
    
    signals.push({ indicator: 'RSI', signal, strength, description });
  }
  
  if (indicators.macd) {
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength = 0.5;
    let description = '';
    
    if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
      signal = 'bullish';
      strength = indicators.macd.histogram > 0 ? Math.min(0.9, 0.6 + Math.abs(indicators.macd.histogram) / currentPrice * 1000) : 0.6;
      description = 'MACD bullish crossover - uptrend momentum';
    } else if (indicators.macd.histogram < 0 && indicators.macd.macd < indicators.macd.signal) {
      signal = 'bearish';
      strength = indicators.macd.histogram < 0 ? Math.min(0.9, 0.6 + Math.abs(indicators.macd.histogram) / currentPrice * 1000) : 0.6;
      description = 'MACD bearish crossover - downtrend momentum';
    } else {
      description = 'MACD neutral - no clear momentum';
    }
    
    signals.push({ indicator: 'MACD', signal, strength, description });
  }
  
  if (indicators.bollingerBands) {
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength = 0.5;
    let description = '';
    
    if (currentPrice < indicators.bollingerBands.lower) {
      signal = 'bullish';
      strength = 0.75;
      description = 'Price below lower Bollinger Band - oversold';
    } else if (currentPrice > indicators.bollingerBands.upper) {
      signal = 'bearish';
      strength = 0.75;
      description = 'Price above upper Bollinger Band - overbought';
    } else if (currentPrice < indicators.bollingerBands.middle) {
      signal = 'bullish';
      strength = 0.55;
      description = 'Price below middle band - potential support';
    } else {
      signal = 'bearish';
      strength = 0.55;
      description = 'Price above middle band - potential resistance';
    }
    
    signals.push({ indicator: 'Bollinger Bands', signal, strength, description });
  }
  
  if (indicators.sma20 && indicators.sma50) {
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength = 0.5;
    let description = '';
    
    if (indicators.sma20 > indicators.sma50 && currentPrice > indicators.sma20) {
      signal = 'bullish';
      strength = 0.7;
      description = 'Golden cross pattern - SMA20 above SMA50';
    } else if (indicators.sma20 < indicators.sma50 && currentPrice < indicators.sma20) {
      signal = 'bearish';
      strength = 0.7;
      description = 'Death cross pattern - SMA20 below SMA50';
    } else if (currentPrice > indicators.sma20) {
      signal = 'bullish';
      strength = 0.6;
      description = 'Price above SMA20 - short-term bullish';
    } else {
      signal = 'bearish';
      strength = 0.6;
      description = 'Price below SMA20 - short-term bearish';
    }
    
    signals.push({ indicator: 'Moving Averages', signal, strength, description });
  }
  
  if (indicators.stochastic) {
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength = 0.5;
    let description = '';
    
    if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) {
      signal = 'bullish';
      strength = 0.75;
      description = `Stochastic oversold (K: ${indicators.stochastic.k.toFixed(1)}, D: ${indicators.stochastic.d.toFixed(1)})`;
    } else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) {
      signal = 'bearish';
      strength = 0.75;
      description = `Stochastic overbought (K: ${indicators.stochastic.k.toFixed(1)}, D: ${indicators.stochastic.d.toFixed(1)})`;
    } else if (indicators.stochastic.k > indicators.stochastic.d) {
      signal = 'bullish';
      strength = 0.6;
      description = 'Stochastic %K above %D - bullish momentum';
    } else {
      signal = 'bearish';
      strength = 0.6;
      description = 'Stochastic %K below %D - bearish momentum';
    }
    
    signals.push({ indicator: 'Stochastic', signal, strength, description });
  }
  
  return signals;
}

export function calculateTechnicalSummary(data: OHLCV[]): TechnicalSummary {
  const indicators = calculateIndicators(data);
  const signals = generateSignals(data, indicators);
  
  let bullishScore = 0;
  let bearishScore = 0;
  let totalWeight = 0;
  
  for (const signal of signals) {
    const weight = signal.strength;
    totalWeight += weight;
    
    if (signal.signal === 'bullish') {
      bullishScore += weight;
    } else if (signal.signal === 'bearish') {
      bearishScore += weight;
    } else {
      bullishScore += weight * 0.5;
      bearishScore += weight * 0.5;
    }
  }
  
  const netScore = totalWeight > 0 ? (bullishScore - bearishScore) / totalWeight : 0;
  const confidence = Math.abs(netScore) * 100;
  
  let overallSignal: TechnicalSummary['overallSignal'];
  
  if (netScore > 0.5) {
    overallSignal = 'strong_buy';
  } else if (netScore > 0.2) {
    overallSignal = 'buy';
  } else if (netScore < -0.5) {
    overallSignal = 'strong_sell';
  } else if (netScore < -0.2) {
    overallSignal = 'sell';
  } else {
    overallSignal = 'neutral';
  }
  
  return {
    overallSignal,
    confidence: Math.min(95, Math.max(5, confidence)),
    signals,
    indicators,
  };
}
