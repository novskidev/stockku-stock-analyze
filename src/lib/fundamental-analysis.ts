export interface FundamentalMetrics {
  per: number | null;
  pbv: number | null;
  roe: number | null;
  roa: number | null;
  eps: number | null;
  dps: number | null;
  dividendYield: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  marketCap: number | null;
}

export interface FundamentalSignal {
  metric: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  value: number | string;
  benchmark: string;
  description: string;
}

export interface FundamentalSummary {
  overallRating: 'excellent' | 'good' | 'fair' | 'poor' | 'weak';
  score: number;
  signals: FundamentalSignal[];
  metrics: FundamentalMetrics;
}

export function analyzeFundamentals(
  metrics: Partial<FundamentalMetrics>,
  sectorAvg?: Partial<FundamentalMetrics>
): FundamentalSummary {
  const signals: FundamentalSignal[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  const defaults: FundamentalMetrics = {
    per: null,
    pbv: null,
    roe: null,
    roa: null,
    eps: null,
    dps: null,
    dividendYield: null,
    debtToEquity: null,
    currentRatio: null,
    grossMargin: null,
    netMargin: null,
    revenueGrowth: null,
    earningsGrowth: null,
    marketCap: null,
  };

  const fullMetrics = { ...defaults, ...metrics };

  if (fullMetrics.per !== null) {
    const weight = 1.5;
    totalWeight += weight;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0.5;

    if (fullMetrics.per < 0) {
      signal = 'bearish';
      score = 0.1;
    } else if (fullMetrics.per < 10) {
      signal = 'bullish';
      score = 0.9;
    } else if (fullMetrics.per < 15) {
      signal = 'bullish';
      score = 0.75;
    } else if (fullMetrics.per < 20) {
      signal = 'neutral';
      score = 0.5;
    } else if (fullMetrics.per < 30) {
      signal = 'bearish';
      score = 0.35;
    } else {
      signal = 'bearish';
      score = 0.2;
    }

    totalScore += score * weight;
    signals.push({
      metric: 'P/E Ratio',
      signal,
      value: fullMetrics.per.toFixed(2),
      benchmark: '< 15 is attractive',
      description: getPERDescription(fullMetrics.per),
    });
  }

  if (fullMetrics.pbv !== null) {
    const weight = 1.2;
    totalWeight += weight;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0.5;

    if (fullMetrics.pbv < 0) {
      signal = 'bearish';
      score = 0.1;
    } else if (fullMetrics.pbv < 1) {
      signal = 'bullish';
      score = 0.85;
    } else if (fullMetrics.pbv < 2) {
      signal = 'bullish';
      score = 0.7;
    } else if (fullMetrics.pbv < 3) {
      signal = 'neutral';
      score = 0.5;
    } else if (fullMetrics.pbv < 5) {
      signal = 'bearish';
      score = 0.35;
    } else {
      signal = 'bearish';
      score = 0.2;
    }

    totalScore += score * weight;
    signals.push({
      metric: 'P/B Value',
      signal,
      value: fullMetrics.pbv.toFixed(2),
      benchmark: '< 1.5 is attractive',
      description: getPBVDescription(fullMetrics.pbv),
    });
  }

  if (fullMetrics.roe !== null) {
    const weight = 1.5;
    totalWeight += weight;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0.5;

    if (fullMetrics.roe > 20) {
      signal = 'bullish';
      score = 0.9;
    } else if (fullMetrics.roe > 15) {
      signal = 'bullish';
      score = 0.75;
    } else if (fullMetrics.roe > 10) {
      signal = 'neutral';
      score = 0.55;
    } else if (fullMetrics.roe > 5) {
      signal = 'bearish';
      score = 0.35;
    } else {
      signal = 'bearish';
      score = 0.2;
    }

    totalScore += score * weight;
    signals.push({
      metric: 'ROE',
      signal,
      value: `${fullMetrics.roe.toFixed(2)}%`,
      benchmark: '> 15% is good',
      description: getROEDescription(fullMetrics.roe),
    });
  }

  if (fullMetrics.debtToEquity !== null) {
    const weight = 1.0;
    totalWeight += weight;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0.5;

    if (fullMetrics.debtToEquity < 0.3) {
      signal = 'bullish';
      score = 0.85;
    } else if (fullMetrics.debtToEquity < 0.5) {
      signal = 'bullish';
      score = 0.7;
    } else if (fullMetrics.debtToEquity < 1) {
      signal = 'neutral';
      score = 0.55;
    } else if (fullMetrics.debtToEquity < 1.5) {
      signal = 'bearish';
      score = 0.35;
    } else {
      signal = 'bearish';
      score = 0.2;
    }

    totalScore += score * weight;
    signals.push({
      metric: 'Debt/Equity',
      signal,
      value: fullMetrics.debtToEquity.toFixed(2),
      benchmark: '< 0.5 is healthy',
      description: getDERDescription(fullMetrics.debtToEquity),
    });
  }

  if (fullMetrics.dividendYield !== null) {
    const weight = 0.8;
    totalWeight += weight;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0.5;

    if (fullMetrics.dividendYield > 5) {
      signal = 'bullish';
      score = 0.85;
    } else if (fullMetrics.dividendYield > 3) {
      signal = 'bullish';
      score = 0.7;
    } else if (fullMetrics.dividendYield > 1) {
      signal = 'neutral';
      score = 0.55;
    } else if (fullMetrics.dividendYield > 0) {
      signal = 'neutral';
      score = 0.4;
    } else {
      signal = 'bearish';
      score = 0.3;
    }

    totalScore += score * weight;
    signals.push({
      metric: 'Dividend Yield',
      signal,
      value: `${fullMetrics.dividendYield.toFixed(2)}%`,
      benchmark: '> 3% is attractive',
      description: getDividendDescription(fullMetrics.dividendYield),
    });
  }

  if (fullMetrics.netMargin !== null) {
    const weight = 1.0;
    totalWeight += weight;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0.5;

    if (fullMetrics.netMargin > 20) {
      signal = 'bullish';
      score = 0.9;
    } else if (fullMetrics.netMargin > 10) {
      signal = 'bullish';
      score = 0.7;
    } else if (fullMetrics.netMargin > 5) {
      signal = 'neutral';
      score = 0.55;
    } else if (fullMetrics.netMargin > 0) {
      signal = 'bearish';
      score = 0.35;
    } else {
      signal = 'bearish';
      score = 0.15;
    }

    totalScore += score * weight;
    signals.push({
      metric: 'Net Margin',
      signal,
      value: `${fullMetrics.netMargin.toFixed(2)}%`,
      benchmark: '> 10% is healthy',
      description: getMarginDescription(fullMetrics.netMargin),
    });
  }

  if (fullMetrics.earningsGrowth !== null) {
    const weight = 1.3;
    totalWeight += weight;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0.5;

    if (fullMetrics.earningsGrowth > 25) {
      signal = 'bullish';
      score = 0.9;
    } else if (fullMetrics.earningsGrowth > 10) {
      signal = 'bullish';
      score = 0.75;
    } else if (fullMetrics.earningsGrowth > 0) {
      signal = 'neutral';
      score = 0.55;
    } else if (fullMetrics.earningsGrowth > -10) {
      signal = 'bearish';
      score = 0.35;
    } else {
      signal = 'bearish';
      score = 0.15;
    }

    totalScore += score * weight;
    signals.push({
      metric: 'Earnings Growth',
      signal,
      value: `${fullMetrics.earningsGrowth.toFixed(2)}%`,
      benchmark: '> 10% YoY is strong',
      description: getGrowthDescription(fullMetrics.earningsGrowth),
    });
  }

  const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 50;
  
  let overallRating: FundamentalSummary['overallRating'];
  if (finalScore >= 80) {
    overallRating = 'excellent';
  } else if (finalScore >= 65) {
    overallRating = 'good';
  } else if (finalScore >= 50) {
    overallRating = 'fair';
  } else if (finalScore >= 35) {
    overallRating = 'poor';
  } else {
    overallRating = 'weak';
  }

  return {
    overallRating,
    score: Math.round(finalScore),
    signals,
    metrics: fullMetrics,
  };
}

function getPERDescription(per: number): string {
  if (per < 0) return 'Negative P/E indicates losses - high risk';
  if (per < 10) return 'Very low valuation - potential value opportunity';
  if (per < 15) return 'Reasonably valued - attractive entry point';
  if (per < 20) return 'Fair valuation - average market pricing';
  if (per < 30) return 'Premium valuation - growth expectations priced in';
  return 'Very expensive - requires high growth to justify';
}

function getPBVDescription(pbv: number): string {
  if (pbv < 0) return 'Negative book value - balance sheet concerns';
  if (pbv < 1) return 'Trading below book value - potential undervaluation';
  if (pbv < 2) return 'Fair price to book - reasonable valuation';
  if (pbv < 3) return 'Above average PBV - quality premium';
  return 'High PBV - significant premium over assets';
}

function getROEDescription(roe: number): string {
  if (roe > 20) return 'Excellent profitability - strong competitive advantage';
  if (roe > 15) return 'Good profitability - efficient capital utilization';
  if (roe > 10) return 'Average profitability - meets market expectations';
  if (roe > 5) return 'Below average - improvement needed';
  return 'Poor profitability - significant concerns';
}

function getDERDescription(der: number): string {
  if (der < 0.3) return 'Very low leverage - conservative financing';
  if (der < 0.5) return 'Low leverage - strong balance sheet';
  if (der < 1) return 'Moderate leverage - balanced approach';
  if (der < 1.5) return 'High leverage - elevated risk';
  return 'Very high leverage - significant debt burden';
}

function getDividendDescription(yield_: number): string {
  if (yield_ > 5) return 'High yield - income investor favorite';
  if (yield_ > 3) return 'Attractive yield - good passive income';
  if (yield_ > 1) return 'Moderate yield - some income benefit';
  if (yield_ > 0) return 'Low yield - focused on growth';
  return 'No dividend - growth or turnaround phase';
}

function getMarginDescription(margin: number): string {
  if (margin > 20) return 'Excellent margins - strong pricing power';
  if (margin > 10) return 'Healthy margins - good profitability';
  if (margin > 5) return 'Moderate margins - competitive industry';
  if (margin > 0) return 'Thin margins - cost pressure';
  return 'Negative margins - operational issues';
}

function getGrowthDescription(growth: number): string {
  if (growth > 25) return 'Exceptional growth - high-growth company';
  if (growth > 10) return 'Strong growth - outperforming market';
  if (growth > 0) return 'Positive growth - steady business';
  if (growth > -10) return 'Slight decline - temporary headwinds';
  return 'Significant decline - turnaround needed';
}

export function calculateIntrinsicValue(
  eps: number,
  growthRate: number,
  discountRate: number = 0.1,
  terminalGrowth: number = 0.03,
  years: number = 10
): { intrinsicValue: number; marginOfSafety: number; currentPrice?: number } {
  let futureEPS = eps;
  let totalPV = 0;

  for (let i = 1; i <= years; i++) {
    futureEPS *= (1 + growthRate);
    const pv = futureEPS / Math.pow(1 + discountRate, i);
    totalPV += pv;
  }

  const terminalValue = (futureEPS * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  const terminalPV = terminalValue / Math.pow(1 + discountRate, years);

  const intrinsicValue = totalPV + terminalPV;

  return {
    intrinsicValue,
    marginOfSafety: 0.25,
  };
}
