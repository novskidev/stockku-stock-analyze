import { buildCacheKey, getCachedValue, setCachedValue } from '@/lib/redis-cache';

const API_BASE = "https://api.datasaham.io";

function getApiKey() {
  const apiKey = process.env.DATASAHAM_API_KEY;
  if (!apiKey) {
    throw new Error("DATASAHAM_API_KEY is not set");
  }
  return apiKey;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const method = options?.method ?? "GET";
  const shouldCache = method.toUpperCase() === "GET";
  const cacheKey = shouldCache ? buildCacheKey("datasaham:legacy", url) : null;

  if (cacheKey) {
    const cached = await getCachedValue<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  const data: T = await res.json();
  if (cacheKey) {
    await setCachedValue(cacheKey, data);
  }
  return data;
}

export interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  value: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  marketCap: number;
  sector?: string;
}

export interface TechnicalAnalysis {
  symbol: string;
  timeframe: string;
  lastPrice: number;
  lastUpdate: string;
  indicators: {
    sma: { sma5: number; sma10: number; sma20: number; sma50: number; sma200: number | null };
    ema: { ema5: number; ema10: number; ema20: number; ema50: number; ema200: number | null };
    rsi: { value: number; signal: string; period: number };
    macd: { macdLine: number; signalLine: number; histogram: number; signal: string };
    stochastic: { k: number; d: number; signal: string };
    bollingerBands: { upper: number; middle: number; lower: number; bandwidth: number; percentB: number; signal: string };
    atr: { value: number; percentage: number; volatility: string };
    obv: { value: number; trend: string };
    vwap: { value: number; signal: string };
  };
  trend: {
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
    overallTrend: string;
    trendStrength: number;
  };
  supportResistance: {
    supports: { level: number; strength: string }[];
    resistances: { level: number; strength: string }[];
    pivotPoint: number;
  };
  signal: {
    action: string;
    confidence: number;
    reasons: string[];
  };
  summary: {
    bullishSignals: number;
    bearishSignals: number;
    neutralSignals: number;
    recommendation: string;
  };
}

export interface BandarmologyData {
  symbol: string;
  company_name: string;
  analysis_date: string;
  accumulation_score: number;
  status: string;
  confidence: number;
  indicators: {
    broker_concentration: {
      top_5_brokers: string[];
      concentration_percentage: number;
      is_suspicious: boolean;
      score: number;
      bandar_status: string;
      total_buyer: number;
      total_seller: number;
      net_flow: number;
      total_value: number;
    };
    volume_pattern: {
      avg_volume_increase: number;
      price_stability: string;
      volume_price_divergence: boolean;
      score: number;
    };
    foreign_flow: {
      net_foreign_flow: string;
      buy_days: number;
      sell_days: number;
      consistency_score: number;
      trend: string;
    };
    accumulation_days: number;
    estimated_accumulation_value: string;
  };
  signals: string[];
  recommendation: string;
  entry_zone: {
    ideal_price: number;
    max_price: number;
    current_price: number;
  };
  risk_level: string;
  timeframe_analysis: {
    short_term: string;
    medium_term: string;
    long_term: string;
  };
}

export interface SmartMoneyData {
  symbol: string;
  analysis_date: string;
  smart_money_score: number;
  status: string;
  confidence: number;
  smart_money_flow: {
    direction: string;
    strength: number;
    consistency: number;
  };
  institutional_activity: {
    net_institutional_flow: string;
    major_players: string[];
    activity_level: string;
  };
  signals: string[];
  recommendation: string;
}

export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FundamentalData {
  symbol: string;
  pe_ratio?: number;
  pb_ratio?: number;
  eps?: number;
  roe?: number;
  roa?: number;
  der?: number;
  current_ratio?: number;
  dividend_yield?: number;
  market_cap?: number;
  revenue_growth?: number;
  profit_margin?: number;
}

export interface KeyStats {
  symbol: string;
  valuation: {
    pe_ratio: number;
    pb_ratio: number;
    ps_ratio: number;
    ev_ebitda: number;
  };
  profitability: {
    roe: number;
    roa: number;
    gross_margin: number;
    net_margin: number;
  };
  growth: {
    revenue_growth: number;
    earnings_growth: number;
    eps_growth: number;
  };
  financial_health: {
    current_ratio: number;
    debt_to_equity: number;
    interest_coverage: number;
  };
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  value: number;
}

export interface BacktestResult {
  symbol: string;
  strategy: string;
  period: { start: string; end: string };
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: {
    date: string;
    type: "BUY" | "SELL";
    price: number;
    quantity: number;
    pnl: number;
  }[];
}

export interface QuantSignal {
  symbol: string;
  timestamp: string;
  technicalScore: number;
  fundamentalScore: number;
  bandarmologyScore: number;
  sentimentScore: number;
  overallScore: number;
  signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskReward: number;
  reasons: string[];
}

export async function searchStocks(query: string) {
  const res = await fetchAPI<{ success: boolean; data: { data: { company: { id: string; name: string; desc: string; type: string }[] } } }>(
    `/api/main/search?query=${encodeURIComponent(query)}`
  );
  return res.data?.data?.company?.filter((c) => c.type === "Saham") || [];
}

export async function getStockInfo(symbol: string): Promise<StockInfo | null> {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/emiten/${symbol}/info`
    );
    if (!res.success) return null;
    const d = res.data;
    return {
      symbol: String(d.symbol || symbol),
      name: String(d.name || d.company_name || ""),
      price: Number(d.last || d.close || 0),
      change: Number(d.change || 0),
      changePercent: Number(d.change_percentage || d.persen || 0),
      volume: Number(d.volume || 0),
      value: Number(d.value || 0),
      high: Number(d.high || 0),
      low: Number(d.low || 0),
      open: Number(d.open || 0),
      prevClose: Number(d.prev_close || d.prev || 0),
      marketCap: Number(d.market_cap || 0),
      sector: String(d.sector || ""),
    };
  } catch {
    return null;
  }
}

export async function getTechnicalAnalysis(symbol: string): Promise<TechnicalAnalysis | null> {
  try {
    const res = await fetchAPI<{ success: boolean; data: TechnicalAnalysis }>(
      `/api/analysis/technical/${symbol}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getBandarmologyAccumulation(symbol: string): Promise<BandarmologyData | null> {
  try {
    const res = await fetchAPI<{ success: boolean; data: BandarmologyData }>(
      `/api/analysis/bandar/accumulation/${symbol}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getBandarmologyDistribution(symbol: string) {
  try {
    const res = await fetchAPI<{ success: boolean; data: BandarmologyData }>(
      `/api/analysis/bandar/distribution/${symbol}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getSmartMoneyFlow(symbol: string): Promise<SmartMoneyData | null> {
  try {
    const res = await fetchAPI<{ success: boolean; data: SmartMoneyData }>(
      `/api/analysis/bandar/smart-money/${symbol}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getPumpDumpAnalysis(symbol: string) {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/analysis/bandar/pump-dump/${symbol}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getChartData(
  symbol: string,
  timeframe: "daily" | "15m" | "30m" | "1h" | "2h" | "3h" | "4h" = "daily",
  from: string,
  to: string
): Promise<OHLCVData[]> {
  try {
    const res = await fetchAPI<{ success: boolean; data: { ohlcv: { date: string; open: number; high: number; low: number; close: number; volume: number }[] } }>(
      `/api/chart/${symbol}/${timeframe}?from=${from}&to=${to}`
    );
    return res.data?.ohlcv || [];
  } catch {
    return [];
  }
}

export async function getHistoricalSummary(
  symbol: string,
  startDate: string,
  endDate: string,
  period: "HS_PERIOD_DAILY" | "HS_PERIOD_WEEKLY" | "HS_PERIOD_MONTHLY" = "HS_PERIOD_DAILY"
) {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/emiten/${symbol}/historical-summary?startDate=${startDate}&endDate=${endDate}&period=${period}&limit=100`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getKeyStats(symbol: string): Promise<KeyStats | null> {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/emiten/${symbol}/keystats`
    );
    if (!res.success) return null;
    const d = res.data;
    return {
      symbol,
      valuation: {
        pe_ratio: Number((d as Record<string, unknown>).pe_ratio || 0),
        pb_ratio: Number((d as Record<string, unknown>).pb_ratio || 0),
        ps_ratio: Number((d as Record<string, unknown>).ps_ratio || 0),
        ev_ebitda: Number((d as Record<string, unknown>).ev_ebitda || 0),
      },
      profitability: {
        roe: Number((d as Record<string, unknown>).roe || 0),
        roa: Number((d as Record<string, unknown>).roa || 0),
        gross_margin: Number((d as Record<string, unknown>).gross_margin || 0),
        net_margin: Number((d as Record<string, unknown>).net_margin || 0),
      },
      growth: {
        revenue_growth: Number((d as Record<string, unknown>).revenue_growth || 0),
        earnings_growth: Number((d as Record<string, unknown>).earnings_growth || 0),
        eps_growth: Number((d as Record<string, unknown>).eps_growth || 0),
      },
      financial_health: {
        current_ratio: Number((d as Record<string, unknown>).current_ratio || 0),
        debt_to_equity: Number((d as Record<string, unknown>).debt_to_equity || 0),
        interest_coverage: Number((d as Record<string, unknown>).interest_coverage || 0),
      },
    };
  } catch {
    return null;
  }
}

export async function getFinancials(symbol: string, reportType: 1 | 2 | 3, statementType: number) {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/emiten/${symbol}/financials?report_type=${reportType}&statement_type=${statementType}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getMarketMovers(
  type: "top-gainer" | "top-loser" | "top-value" | "top-volume" | "net-foreign-buy" | "net-foreign-sell"
): Promise<MarketMover[]> {
  try {
    const res = await fetchAPI<{ success: boolean; data: { data: Record<string, unknown>[] } }>(
      `/api/movers/${type}`
    );
    return (res.data?.data || []).map((d) => ({
      symbol: String(d.symbol || ""),
      name: String(d.name || d.company_name || ""),
      price: Number(d.last || d.close || 0),
      change: Number(d.change || 0),
      changePercent: Number(d.change_percentage || d.persen || 0),
      volume: Number(d.volume || 0),
      value: Number(d.value || 0),
    }));
  } catch {
    return [];
  }
}

export async function getSentimentAnalysis(symbol: string) {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/analysis/sentiment/${symbol}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getInsiderTrading(symbol: string) {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/emiten/${symbol}/insider?limit=50`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getWhaleTransactions(symbol: string) {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/analysis/whale-transactions/${symbol}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getBreakoutAlerts() {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown>[] }>(
      `/api/analysis/retail/breakout/alerts`
    );
    return res.success ? res.data : [];
  } catch {
    return [];
  }
}

export async function getMultibaggerScan() {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown>[] }>(
      `/api/analysis/retail/multibagger/scan`
    );
    return res.success ? res.data : [];
  } catch {
    return [];
  }
}

export async function getRiskReward(symbol: string) {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/analysis/retail/risk-reward/${symbol}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getSectorRotation() {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/analysis/retail/sector-rotation`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getBrokerSummary(symbol: string) {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/market-detector/broker-summary/${symbol}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getTopBroker() {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown>[] }>(
      `/api/market-detector/top-broker`
    );
    return res.success ? res.data : [];
  } catch {
    return [];
  }
}

export async function getGlobalMarketOverview() {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/global/market-overview`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getMorningBriefing() {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/main/morning-briefing`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getTrendingStocks() {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown>[] }>(
      `/api/main/trending`
    );
    return res.success ? res.data : [];
  } catch {
    return [];
  }
}

export async function getSeasonality(symbol: string, year?: number, backYear?: number) {
  try {
    const params = new URLSearchParams();
    if (year) params.append("year", String(year));
    if (backYear) params.append("backYear", String(backYear));
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/emiten/${symbol}/seasonality?${params.toString()}`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getForeignOwnership(symbol: string) {
  try {
    const res = await fetchAPI<{ success: boolean; data: Record<string, unknown> }>(
      `/api/emiten/${symbol}/foreign-ownership`
    );
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}
