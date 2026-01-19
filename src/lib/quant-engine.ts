import {
  TechnicalAnalysis,
  BandarmologyData,
  OHLCVData,
  QuantSignal,
  BacktestResult,
} from "./api";

export interface QuantStrategy {
  name: string;
  technicalWeight: number;
  fundamentalWeight: number;
  bandarmologyWeight: number;
  sentimentWeight: number;
  rsiOversold: number;
  rsiOverbought: number;
  macdSignalThreshold: number;
  volumeMultiplier: number;
  stopLossPercent: number;
  takeProfitPercent: number;
}

export const DEFAULT_STRATEGY: QuantStrategy = {
  name: "Balanced Quant",
  technicalWeight: 0.35,
  fundamentalWeight: 0.25,
  bandarmologyWeight: 0.25,
  sentimentWeight: 0.15,
  rsiOversold: 30,
  rsiOverbought: 70,
  macdSignalThreshold: 0,
  volumeMultiplier: 1.5,
  stopLossPercent: 5,
  takeProfitPercent: 10,
};

export const AGGRESSIVE_STRATEGY: QuantStrategy = {
  name: "Aggressive Momentum",
  technicalWeight: 0.45,
  fundamentalWeight: 0.15,
  bandarmologyWeight: 0.30,
  sentimentWeight: 0.10,
  rsiOversold: 25,
  rsiOverbought: 75,
  macdSignalThreshold: 0,
  volumeMultiplier: 2.0,
  stopLossPercent: 7,
  takeProfitPercent: 15,
};

export const CONSERVATIVE_STRATEGY: QuantStrategy = {
  name: "Conservative Value",
  technicalWeight: 0.25,
  fundamentalWeight: 0.40,
  bandarmologyWeight: 0.20,
  sentimentWeight: 0.15,
  rsiOversold: 35,
  rsiOverbought: 65,
  macdSignalThreshold: 0,
  volumeMultiplier: 1.2,
  stopLossPercent: 3,
  takeProfitPercent: 8,
};

export function calculateTechnicalScore(
  technical: TechnicalAnalysis,
  strategy: QuantStrategy = DEFAULT_STRATEGY
): number {
  let score = 50;
  const { indicators, trend, signal } = technical;

  if (indicators.rsi.value < strategy.rsiOversold) {
    score += 15;
  } else if (indicators.rsi.value > strategy.rsiOverbought) {
    score -= 15;
  } else if (indicators.rsi.value >= 40 && indicators.rsi.value <= 60) {
    score += 5;
  }

  if (indicators.macd.histogram > strategy.macdSignalThreshold) {
    score += indicators.macd.signal === "BULLISH" ? 12 : 6;
  } else {
    score -= indicators.macd.signal === "BEARISH" ? 12 : 6;
  }

  const price = technical.lastPrice;
  if (price > indicators.sma.sma20) score += 5;
  if (price > indicators.sma.sma50) score += 5;
  if (indicators.sma.sma200 && price > indicators.sma.sma200) score += 5;

  if (price > indicators.ema.ema20) score += 3;
  if (indicators.ema.ema20 > indicators.ema.ema50) score += 5;

  if (indicators.bollingerBands.percentB < 20) {
    score += 10;
  } else if (indicators.bollingerBands.percentB > 80) {
    score -= 10;
  }

  if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) {
    score += 8;
  } else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) {
    score -= 8;
  }

  if (indicators.obv.trend === "BULLISH") score += 8;
  else if (indicators.obv.trend === "BEARISH") score -= 8;

  if (indicators.vwap.signal === "ABOVE") score += 5;
  else if (indicators.vwap.signal === "BELOW") score -= 5;

  if (trend.overallTrend === "BULLISH") {
    score += Math.min(10, trend.trendStrength / 10);
  } else if (trend.overallTrend === "BEARISH") {
    score -= Math.min(10, trend.trendStrength / 10);
  }

  score += signal.confidence * 0.1;

  return Math.max(0, Math.min(100, score));
}

export function calculateFundamentalScore(
  keystats: Record<string, unknown> | null
): number {
  if (!keystats) return 50;
  let score = 50;

  const pe = Number(keystats.pe_ratio || keystats.PE || 0);
  if (pe > 0 && pe < 15) score += 15;
  else if (pe >= 15 && pe < 25) score += 8;
  else if (pe >= 25 && pe < 40) score -= 5;
  else if (pe >= 40) score -= 15;

  const pb = Number(keystats.pb_ratio || keystats.PBV || 0);
  if (pb > 0 && pb < 1) score += 12;
  else if (pb >= 1 && pb < 2) score += 6;
  else if (pb >= 3) score -= 8;

  const roe = Number(keystats.roe || keystats.ROE || 0);
  if (roe > 20) score += 15;
  else if (roe >= 15) score += 10;
  else if (roe >= 10) score += 5;
  else if (roe < 5) score -= 10;

  const roa = Number(keystats.roa || keystats.ROA || 0);
  if (roa > 10) score += 10;
  else if (roa >= 5) score += 5;
  else if (roa < 2) score -= 8;

  const der = Number(keystats.debt_to_equity || keystats.DER || 0);
  if (der < 0.5) score += 10;
  else if (der < 1) score += 5;
  else if (der > 2) score -= 10;

  const currentRatio = Number(keystats.current_ratio || 0);
  if (currentRatio > 2) score += 8;
  else if (currentRatio >= 1.5) score += 4;
  else if (currentRatio < 1) score -= 10;

  const netMargin = Number(keystats.net_margin || keystats.npm || 0);
  if (netMargin > 20) score += 10;
  else if (netMargin >= 10) score += 5;
  else if (netMargin < 5) score -= 5;

  const revenueGrowth = Number(keystats.revenue_growth || 0);
  if (revenueGrowth > 20) score += 10;
  else if (revenueGrowth >= 10) score += 5;
  else if (revenueGrowth < 0) score -= 8;

  return Math.max(0, Math.min(100, score));
}

export function calculateBandarmologyScore(
  bandar: BandarmologyData | null
): number {
  if (!bandar) return 50;
  let score = 50;

  score += (bandar.accumulation_score - 5) * 8;
  score += (bandar.confidence - 50) * 0.3;

  const { indicators } = bandar;

  if (indicators.broker_concentration.bandar_status === "Acc") {
    score += 10;
  } else if (indicators.broker_concentration.bandar_status === "Dist") {
    score -= 15;
  }

  if (indicators.broker_concentration.concentration_percentage > 50) {
    score += 8;
  } else if (indicators.broker_concentration.concentration_percentage < 20) {
    score -= 5;
  }

  if (indicators.foreign_flow.trend === "STRONG_BUY") {
    score += 15;
  } else if (indicators.foreign_flow.trend === "BUY") {
    score += 8;
  } else if (indicators.foreign_flow.trend === "STRONG_SELL") {
    score -= 15;
  } else if (indicators.foreign_flow.trend === "SELL") {
    score -= 8;
  }

  if (indicators.volume_pattern.avg_volume_increase > 50) {
    score += 8;
  } else if (indicators.volume_pattern.avg_volume_increase > 20) {
    score += 4;
  }

  if (bandar.status === "ACCUMULATION") {
    score += 12;
  } else if (bandar.status === "DISTRIBUTION") {
    score -= 15;
  }

  if (bandar.recommendation === "STRONG_BUY" || bandar.recommendation === "BUY") {
    score += 8;
  } else if (bandar.recommendation === "SELL" || bandar.recommendation === "STRONG_SELL") {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

export function calculateSentimentScore(
  sentiment: Record<string, unknown> | null
): number {
  if (!sentiment) return 50;
  let score = 50;

  const retailSentiment = Number(sentiment.retail_sentiment || sentiment.retail_score || 50);
  const bandarSentiment = Number(sentiment.bandar_sentiment || sentiment.bandar_score || 50);

  score += (retailSentiment - 50) * 0.3;
  score += (bandarSentiment - 50) * 0.5;

  const newsScore = Number(sentiment.news_sentiment || 50);
  score += (newsScore - 50) * 0.2;

  return Math.max(0, Math.min(100, score));
}

export function generateQuantSignal(
  symbol: string,
  price: number,
  technicalScore: number,
  fundamentalScore: number,
  bandarmologyScore: number,
  sentimentScore: number,
  technical: TechnicalAnalysis | null,
  strategy: QuantStrategy = DEFAULT_STRATEGY
): QuantSignal {
  const overallScore =
    technicalScore * strategy.technicalWeight +
    fundamentalScore * strategy.fundamentalWeight +
    bandarmologyScore * strategy.bandarmologyWeight +
    sentimentScore * strategy.sentimentWeight;

  let signal: QuantSignal["signal"];
  if (overallScore >= 80) signal = "STRONG_BUY";
  else if (overallScore >= 65) signal = "BUY";
  else if (overallScore >= 45) signal = "HOLD";
  else if (overallScore >= 30) signal = "SELL";
  else signal = "STRONG_SELL";

  const confidence = Math.min(
    95,
    Math.max(
      30,
      50 +
        Math.abs(overallScore - 50) * 0.9 +
        (technicalScore > 60 ? 5 : 0) +
        (bandarmologyScore > 60 ? 5 : 0)
    )
  );

  const stopLoss = price * (1 - strategy.stopLossPercent / 100);
  const targetPrice = price * (1 + strategy.takeProfitPercent / 100);

  let entryPrice = price;
  if (technical?.supportResistance?.supports?.[0]) {
    const nearestSupport = technical.supportResistance.supports[0].level;
    if (nearestSupport < price && nearestSupport > price * 0.95) {
      entryPrice = nearestSupport;
    }
  }

  const riskReward = (targetPrice - entryPrice) / (entryPrice - stopLoss);

  const reasons: string[] = [];
  if (technicalScore >= 70) reasons.push("Strong technical indicators");
  else if (technicalScore <= 30) reasons.push("Weak technical indicators");

  if (fundamentalScore >= 70) reasons.push("Solid fundamentals");
  else if (fundamentalScore <= 30) reasons.push("Weak fundamentals");

  if (bandarmologyScore >= 70) reasons.push("Smart money accumulating");
  else if (bandarmologyScore <= 30) reasons.push("Distribution detected");

  if (sentimentScore >= 70) reasons.push("Positive market sentiment");
  else if (sentimentScore <= 30) reasons.push("Negative sentiment");

  if (technical) {
    if (technical.indicators.rsi.value < 30) reasons.push("RSI oversold");
    if (technical.indicators.rsi.value > 70) reasons.push("RSI overbought");
    if (technical.indicators.macd.signal === "BULLISH") reasons.push("MACD bullish crossover");
    if (technical.trend.overallTrend === "BULLISH") reasons.push(`Trend strength: ${technical.trend.trendStrength}%`);
  }

  return {
    symbol,
    timestamp: new Date().toISOString(),
    technicalScore,
    fundamentalScore,
    bandarmologyScore,
    sentimentScore,
    overallScore,
    signal,
    confidence,
    entryPrice,
    targetPrice,
    stopLoss,
    riskReward,
    reasons,
  };
}

export function runBacktest(
  ohlcv: OHLCVData[],
  symbol: string,
  strategy: QuantStrategy = DEFAULT_STRATEGY,
  initialCapital: number = 100000000
): BacktestResult {
  if (ohlcv.length < 50) {
    return {
      symbol,
      strategy: strategy.name,
      period: { start: "", end: "" },
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalReturn: 0,
      annualizedReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      trades: [],
    };
  }

  const sortedData = [...ohlcv].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const trades: BacktestResult["trades"] = [];
  let capital = initialCapital;
  let position = 0;
  let entryPrice = 0;
  let peakCapital = initialCapital;
  let maxDrawdown = 0;
  const returns: number[] = [];

  function calculateSMA(data: OHLCVData[], period: number, index: number): number {
    if (index < period - 1) return 0;
    let sum = 0;
    for (let i = index - period + 1; i <= index; i++) {
      sum += data[i].close;
    }
    return sum / period;
  }

  function calculateRSI(data: OHLCVData[], period: number, index: number): number {
    if (index < period) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = index - period + 1; i <= index; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  function calculateMACD(data: OHLCVData[], index: number): { macd: number; signal: number; histogram: number } {
    if (index < 26) return { macd: 0, signal: 0, histogram: 0 };
    
    const ema12 = calculateEMA(data, 12, index);
    const ema26 = calculateEMA(data, 26, index);
    const macd = ema12 - ema26;
    
    let signalSum = 0;
    for (let i = index - 8; i <= index; i++) {
      if (i >= 26) {
        const e12 = calculateEMA(data, 12, i);
        const e26 = calculateEMA(data, 26, i);
        signalSum += e12 - e26;
      }
    }
    const signal = signalSum / 9;
    
    return { macd, signal, histogram: macd - signal };
  }

  function calculateEMA(data: OHLCVData[], period: number, index: number): number {
    if (index < period - 1) return data[index].close;
    const multiplier = 2 / (period + 1);
    let ema = calculateSMA(data, period, period - 1);
    for (let i = period; i <= index; i++) {
      ema = (data[i].close - ema) * multiplier + ema;
    }
    return ema;
  }

  function calculateBollingerBands(data: OHLCVData[], period: number, index: number): { upper: number; middle: number; lower: number; percentB: number } {
    const middle = calculateSMA(data, period, index);
    if (middle === 0) return { upper: 0, middle: 0, lower: 0, percentB: 50 };
    
    let sumSquares = 0;
    for (let i = index - period + 1; i <= index; i++) {
      sumSquares += Math.pow(data[i].close - middle, 2);
    }
    const stdDev = Math.sqrt(sumSquares / period);
    const upper = middle + 2 * stdDev;
    const lower = middle - 2 * stdDev;
    const percentB = ((data[index].close - lower) / (upper - lower)) * 100;
    
    return { upper, middle, lower, percentB };
  }

  function calculateVolumeMA(data: OHLCVData[], period: number, index: number): number {
    if (index < period - 1) return data[index].volume;
    let sum = 0;
    for (let i = index - period + 1; i <= index; i++) {
      sum += data[i].volume;
    }
    return sum / period;
  }

  for (let i = 50; i < sortedData.length; i++) {
    const current = sortedData[i];
    const sma20 = calculateSMA(sortedData, 20, i);
    const sma50 = calculateSMA(sortedData, 50, i);
    const rsi = calculateRSI(sortedData, 14, i);
    const macdData = calculateMACD(sortedData, i);
    const bb = calculateBollingerBands(sortedData, 20, i);
    const volumeMA = calculateVolumeMA(sortedData, 20, i);
    const volumeRatio = current.volume / volumeMA;

    let buySignal = false;
    let sellSignal = false;

    if (position === 0) {
      let buyScore = 0;

      if (rsi < strategy.rsiOversold) buyScore += 25;
      else if (rsi < 40) buyScore += 10;

      if (macdData.histogram > 0 && macdData.macd > macdData.signal) buyScore += 20;

      if (current.close > sma20 && sma20 > sma50) buyScore += 15;

      if (bb.percentB < 20) buyScore += 15;

      if (volumeRatio > strategy.volumeMultiplier) buyScore += 15;

      if (current.close > sortedData[i - 1].close) buyScore += 10;

      buySignal = buyScore >= 60;
    }

    if (position > 0) {
      const pnlPercent = ((current.close - entryPrice) / entryPrice) * 100;

      if (pnlPercent <= -strategy.stopLossPercent) {
        sellSignal = true;
      } else if (pnlPercent >= strategy.takeProfitPercent) {
        sellSignal = true;
      } else {
        let sellScore = 0;

        if (rsi > strategy.rsiOverbought) sellScore += 25;
        else if (rsi > 60) sellScore += 10;

        if (macdData.histogram < 0 && macdData.macd < macdData.signal) sellScore += 20;

        if (current.close < sma20) sellScore += 15;

        if (bb.percentB > 80) sellScore += 15;

        if (current.close < sortedData[i - 1].close && sortedData[i - 1].close < sortedData[i - 2].close) {
          sellScore += 15;
        }

        sellSignal = sellScore >= 55;
      }
    }

    if (buySignal && position === 0) {
      const quantity = Math.floor(capital / current.close / 100) * 100;
      if (quantity > 0) {
        position = quantity;
        entryPrice = current.close;
        trades.push({
          date: current.date,
          type: "BUY",
          price: current.close,
          quantity,
          pnl: 0,
        });
      }
    }

    if (sellSignal && position > 0) {
      const pnl = (current.close - entryPrice) * position;
      capital += pnl;
      trades.push({
        date: current.date,
        type: "SELL",
        price: current.close,
        quantity: position,
        pnl,
      });
      
      const dailyReturn = pnl / (entryPrice * position);
      returns.push(dailyReturn);
      
      position = 0;
      entryPrice = 0;
    }

    const currentValue = capital + (position > 0 ? position * current.close : 0);
    if (currentValue > peakCapital) {
      peakCapital = currentValue;
    }
    const drawdown = ((peakCapital - currentValue) / peakCapital) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  if (position > 0) {
    const lastPrice = sortedData[sortedData.length - 1].close;
    const pnl = (lastPrice - entryPrice) * position;
    capital += pnl;
    trades.push({
      date: sortedData[sortedData.length - 1].date,
      type: "SELL",
      price: lastPrice,
      quantity: position,
      pnl,
    });
  }

  const totalReturn = ((capital - initialCapital) / initialCapital) * 100;
  const tradingDays = sortedData.length;
  const annualizedReturn = totalReturn * (252 / tradingDays);

  const winningTrades = trades.filter((t) => t.type === "SELL" && t.pnl > 0).length;
  const losingTrades = trades.filter((t) => t.type === "SELL" && t.pnl <= 0).length;
  const totalTrades = trades.filter((t) => t.type === "SELL").length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  let sharpeRatio = 0;
  if (returns.length > 0) {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev > 0) {
      sharpeRatio = (avgReturn * 252 - 0.05) / (stdDev * Math.sqrt(252));
    }
  }

  return {
    symbol,
    strategy: strategy.name,
    period: {
      start: sortedData[0]?.date || "",
      end: sortedData[sortedData.length - 1]?.date || "",
    },
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalReturn,
    annualizedReturn,
    maxDrawdown,
    sharpeRatio,
    trades,
  };
}

export function getSignalColor(signal: string): string {
  switch (signal) {
    case "STRONG_BUY":
      return "text-emerald-500";
    case "BUY":
      return "text-green-500";
    case "HOLD":
      return "text-yellow-500";
    case "SELL":
      return "text-orange-500";
    case "STRONG_SELL":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export function getSignalBgColor(signal: string): string {
  switch (signal) {
    case "STRONG_BUY":
      return "bg-emerald-500/20 border-emerald-500";
    case "BUY":
      return "bg-green-500/20 border-green-500";
    case "HOLD":
      return "bg-yellow-500/20 border-yellow-500";
    case "SELL":
      return "bg-orange-500/20 border-orange-500";
    case "STRONG_SELL":
      return "bg-red-500/20 border-red-500";
    default:
      return "bg-gray-500/20 border-gray-500";
  }
}

export function formatCurrency(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString("id-ID");
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
