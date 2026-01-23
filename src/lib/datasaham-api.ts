const API_BASE = 'https://api.datasaham.io/api';
const API_KEY = process.env.DATASAHAM_API_KEY || 'sbk_8fbb3824f0f13e617109e37c66b8c7c55a3debbb9a5870b0';

type QueryParamValue = string | string[] | undefined;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

type QueryParams = Record<string, QueryParamValue>;

function appendSearchParams(url: URL, params?: QueryParams) {
  if (!params) return;

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(key, v));
    } else {
      url.searchParams.append(key, value);
    }
  });
}

async function fetchApi<T>(endpoint: string, params?: QueryParams, revalidate: number = 30): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  appendSearchParams(url, params);

  const response = await fetch(url.toString(), {
    headers: {
      'x-api-key': API_KEY,
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data as T;
}

async function fetchApiFull<T>(endpoint: string, params?: QueryParams, revalidate: number = 30): Promise<ApiResponse<T>> {
  const url = new URL(`${API_BASE}${endpoint}`);
  appendSearchParams(url, params);

  const response = await fetch(url.toString(), {
    headers: {
      'x-api-key': API_KEY,
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result;
}

export async function fetchApiClient<T>(endpoint: string, params?: QueryParams): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  appendSearchParams(url, params);

  const response = await fetch(url.toString(), {
    headers: {
      'x-api-key': API_KEY,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data as T;
}

export async function fetchApiClientFull<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>> {
  const url = new URL(`${API_BASE}${endpoint}`);
  appendSearchParams(url, params);

  const response = await fetch(url.toString(), {
    headers: {
      'x-api-key': API_KEY,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result;
}

export interface SearchResult {
  company: Array<{
    id: string;
    name: string;
    desc: string;
    exchange: string;
    type: string;
    is_tradeable: boolean;
  }>;
}

export interface StockProfile {
  background: string;
  history: {
    amount: string;
    board: string;
    date: string;
    price: string;
    shares: string;
    free_float: string;
  };
  key_executive: {
    president_director: Array<{ value: string }>;
    director: Array<{ value: string }>;
    commissioner: Array<{ value: string }>;
  };
  shareholder: Array<{
    name: string;
    percentage: string;
    value: string;
  }>;
  address: Array<{
    website: string;
    phone: string;
    email: string[];
    office: string;
  }>;
}

export interface TopMover {
  symbol: string;
  company_name: string;
  last_price: number;
  change: number;
  change_percentage: number;
  volume: number;
  value: number;
  net_foreign_buy: number;
  net_foreign_sell: number;
}

interface MoverApiItem {
  stock_detail: { code: string; name: string };
  price: number;
  change: { value: number; percentage: number };
  value: { raw: number };
  volume: { raw: number };
  net_foreign_buy?: { raw: number };
  net_foreign_sell?: { raw: number };
}

interface MoverApiResponse {
  data: {
    mover_list: MoverApiItem[];
  };
}

export interface ChartCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartApiResponse {
  data: {
    ohlcv: ChartCandle[];
  };
}

export interface RetailSentiment {
  score?: number;
  status?: 'EUPHORIC' | 'BULLISH' | 'NEUTRAL' | 'FEARFUL' | 'PANIC';
  danger_level?: string;
  indicators?: {
    frequency_score?: number;
    small_lot_percentage?: number;
    fomo_score?: number;
    volume_participation?: number;
  };
}

export interface BandarTopBroker {
  code: string;
  type: string;
  net_value: number;
  net_value_formatted?: string;
  net_lot?: number;
  avg_price?: number;
}

export interface BandarSentiment {
  score?: number;
  status?: 'ACCUMULATING' | 'HOLDING' | 'NEUTRAL' | 'DISTRIBUTING' | 'EXITING';
  indicators?: {
    top_broker_net_flow?: number;
    large_lot_percentage?: number;
    accumulation_score?: number;
    foreign_flow?: number;
    institutional_flow?: number;
  };
  top_brokers?: {
    buyers?: BandarTopBroker[];
    sellers?: BandarTopBroker[];
  };
}

export type SentimentDivergence =
  | 'RETAIL_EUPHORIC_BANDAR_EXIT'
  | 'RETAIL_PANIC_BANDAR_ACCUMULATE'
  | 'ALIGNED_BULLISH'
  | 'ALIGNED_BEARISH'
  | 'NEUTRAL';

export interface MarketSentiment {
  symbol: string;
  analysis_date?: string;
  current_price?: number;
  retail_sentiment?: RetailSentiment;
  bandar_sentiment?: BandarSentiment;
  divergence?: {
    detected?: boolean;
    type?: SentimentDivergence;
    warning?: string;
    recommendation?: string;
    historical_outcome?: string;
  };
  summary?: string;
}

export interface KeyStatsItem {
  fitem: {
    id: string;
    name: string;
    value: string;
  };
  hidden_graph_ico: boolean;
  is_new_update: boolean;
}

export interface KeyStatsGroup {
  keystats_name: string;
  fin_name_results: KeyStatsItem[];
}

export interface KeyStats {
  closure_fin_items_results: KeyStatsGroup[];
  financial_year_parent?: unknown;
  stats?: Record<string, string>;
  info?: string;
  dividend_group?: unknown;
  financial_report_currency?: string[];
}

export interface TechnicalIndicatorGroup {
  sma?: {
    sma5?: number | null;
    sma10?: number | null;
    sma20?: number | null;
    sma50?: number | null;
    sma100?: number | null;
    sma200?: number | null;
  };
  ema?: {
    ema5?: number | null;
    ema10?: number | null;
    ema20?: number | null;
    ema50?: number | null;
    ema100?: number | null;
    ema200?: number | null;
  };
  rsi?: {
    value?: number | null;
    signal?: string;
    period?: number;
  };
  macd?: {
    macdLine?: number | null;
    signalLine?: number | null;
    histogram?: number | null;
    signal?: string;
  };
  stochastic?: {
    k?: number | null;
    d?: number | null;
    signal?: string;
  };
  bollingerBands?: {
    upper?: number | null;
    middle?: number | null;
    lower?: number | null;
    bandwidth?: number | null;
    percentB?: number | null;
    signal?: string;
  };
  atr?: {
    value?: number | null;
    percentage?: number | null;
    volatility?: string;
  };
  obv?: {
    value?: number | null;
    trend?: string;
  };
  vwap?: {
    value?: number | null;
    signal?: string;
  };
}

export interface TechnicalAnalysis {
  symbol: string;
  timeframe?: string;
  lastPrice?: number | null;
  lastUpdate?: string;
  dataPoints?: number;
  indicators?: TechnicalIndicatorGroup;
  trend?: {
    shortTerm?: string;
    mediumTerm?: string;
    longTerm?: string;
    overallTrend?: string;
    trendStrength?: number;
  };
  supportResistance?: {
    supports?: Array<{ level: number; strength?: string }>;
    resistances?: Array<{ level: number; strength?: string }>;
    pivotPoint?: number | null;
  };
  signal?: {
    action?: string;
    confidence?: number;
    reasons?: string[];
  };
  summary?: {
    bullishSignals?: number;
    bearishSignals?: number;
    neutralSignals?: number;
    recommendation?: string;
  };
}

export interface StockInfoDetail {
  symbol: string;
  name?: string;
  last?: number;
  change?: number;
  change_percentage?: number;
  high?: number;
  low?: number;
  open?: number;
  prev_close?: number;
  volume?: number;
  value?: number;
  market_cap?: number;
  sector?: string;
  sub_sector?: string;
  industry?: string;
}

export type InsightStatus = 'good' | 'bad' | 'neutral' | 'NA';

export interface InsightItem {
  name: string;
  statement: string;
  shortStatement?: string;
  status: InsightStatus | string;
  value?: number;
  benchmark?: number;
  difference?: number;
  differencePercent?: number;
  criteria?: string;
}

export interface InsightSummary {
  totalInsights: number;
  good: number;
  bad: number;
  neutral: number;
  score: number;
}

export interface InsightsData {
  symbol: string;
  displayName?: string;
  instrumentId?: string;
  securityType?: string;
  lastUpdated?: string;
  summary?: InsightSummary;
  categories?: Record<string, InsightItem[]>;
  peers?: string[];
  rawInsights?: unknown[];
}

export interface OrderbookLevel {
  price: number;
  volume: number;
}

export interface Orderbook {
  symbol: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface HistoricalSummary {
  average?: number;
  period?: string;
  data?: Array<{ date: string; price: number; volume: number }>;
}

export interface BrokerTradeChartPoint {
  date: string;
  foreign_buy?: number;
  foreign_sell?: number;
  domestic_buy?: number;
  domestic_sell?: number;
}

export interface SeasonalityPoint {
  month: string;
  average_return: number;
  median_return?: number;
  positive_months?: number;
  negative_months?: number;
}

export interface SubsidiaryItem {
  company_name: string;
  business_type: string;
  location: string;
  commercial_year: string;
  total_assets: string;
  percentage: string;
  id: number;
  operational_status: string;
  period: string;
  raw: unknown;
}

export interface SubsidiaryData {
  subsidiaries: SubsidiaryItem[];
  currency?: string;
  last_updated_period?: string;
  unit?: string;
}

export interface HoldingComposition {
  holder: string;
  percentage: number;
}

export interface ForeignOwnership {
  date: string;
  ownership: number;
}

export interface InsiderTransaction {
  name: string;
  relation: string;
  date: string;
  type: string;
  volume: number;
  price: number;
}

export interface WhaleBroker {
  broker_code?: string;
  code?: string;
  type?: string;
  broker_type?: string;
  net_value?: number;
  net_value_formatted?: string;
  net_lot?: number;
  avg_price?: number;
  whale_score?: number;
  action?: string;
  transaction_count?: number;
}

export interface WhalePrediction {
  direction?: string;
  short_term_direction?: string;
  confidence?: number;
  reasoning?: string[];
}

export interface WhaleActivitySummary {
  total_whale_buy_value?: number;
  total_whale_sell_value?: number;
  net_whale_flow?: number;
  net_whale_flow_formatted?: string;
  dominant_action?: string;
  whale_intensity?: string;
  whale_buy_count?: number;
  whale_sell_count?: number;
}

export interface WhaleTransactions {
  symbol: string;
  analysis_date?: string;
  current_price?: number;
  min_lot?: number;
  whale_types?: string[];
  summary?: WhaleActivitySummary;
  activity_summary?: WhaleActivitySummary;
  whale_threshold?: {
    lot?: number;
    value?: number;
    description?: string;
  };
  top_brokers?: {
    buyers?: WhaleBroker[];
    sellers?: WhaleBroker[];
  };
  top_whale_brokers?: WhaleBroker[];
  prediction?: WhalePrediction;
  recent_whale_transactions?: Array<{
    time?: string;
    action?: string;
    lot?: number;
    value?: number;
    value_formatted?: string;
    price?: number;
    market_board?: string;
    whale_type?: string;
    impact_estimate?: string;
  }>;
  alerts?: string[];
}

export type WhaleTransactionsApiResponse = ApiResponse<WhaleTransactions>;

export interface IpoMomentumItem {
  symbol: string;
  name: string;
  sector?: string;
  status: 'UPCOMING' | 'OFFERING' | 'LISTED' | 'PAST';
  momentum_score: number;
  underwriter_tier?: 'TIER_1' | 'TIER_2' | 'TIER_3';
  recommendation?: 'STRONG_APPLY' | 'APPLY' | 'CONSIDER' | 'AVOID';
  offering_price?: number;
  offering_period?: string;
  listing_date?: string;
  performance_since_listing?: number;
}

export interface IpoMomentum {
  analysis_date?: string;
  market_sentiment?: string;
  hot_sectors?: string[];
  upcoming_ipos?: IpoMomentumItem[];
  recent_ipos?: IpoMomentumItem[];
}

export type MoverType =
  | 'top-gainer'
  | 'top-loser'
  | 'top-value'
  | 'top-volume'
  | 'top-frequency'
  | 'net-foreign-buy'
  | 'net-foreign-sell'
  | 'iep-current-top-gainer'
  | 'iep-current-top-loser'
  | 'iep-prev-top-gainer'
  | 'iep-prev-top-loser'
  | 'iev-top-gainer'
  | 'iev-top-loser'
  | 'ieval-top-gainer'
  | 'ieval-top-loser';

export type MoverFilter =
  | 'FILTER_STOCKS_TYPE_MAIN_BOARD'
  | 'FILTER_STOCKS_TYPE_DEVELOPMENT_BOARD'
  | 'FILTER_STOCKS_TYPE_ACCELERATION_BOARD'
  | 'FILTER_STOCKS_TYPE_NEW_ECONOMY_BOARD'
  | 'FILTER_STOCKS_TYPE_SPECIAL_MONITORING_BOARD';

export type ChartTimeframe = 'daily' | '15m' | '30m' | '1h' | '2h' | '3h' | '4h';

export const DEFAULT_MOVER_FILTERS: MoverFilter[] = [
  'FILTER_STOCKS_TYPE_MAIN_BOARD',
  'FILTER_STOCKS_TYPE_DEVELOPMENT_BOARD',
  'FILTER_STOCKS_TYPE_ACCELERATION_BOARD',
  'FILTER_STOCKS_TYPE_NEW_ECONOMY_BOARD',
];

export interface BrokerSummaryItem {
  broker_code: string;
  broker_type: string;
  buy_value: number;
  sell_value: number;
  net_value: number;
  buy_lot: number;
  sell_lot: number;
  buy_avg_price: number;
}

interface BrokerSummaryApiResponse {
  message: string;
  data: {
    bandar_detector: {
      average: number;
      broker_accdist: string;
      total_buyer: number;
      total_seller: number;
      value: number;
      volume: number;
    };
    broker_summary: {
      brokers_buy: Array<{
        netbs_broker_code: string;
        type: string;
        bval: string;
        blot: string;
        netbs_buy_avg_price: string;
      }>;
      brokers_sell: Array<{
        netbs_broker_code: string;
        type: string;
        sval: string;
        slot: string;
        netbs_sell_avg_price: string;
      }>;
      symbol: string;
    };
    from: string;
    to: string;
  };
}

export interface BrokerSummary {
  broker_code: string;
  broker_name: string;
  buy_value: number;
  sell_value: number;
  net_value: number;
  buy_volume: number;
  sell_volume: number;
  net_volume: number;
  broker_type: string;
  buy_avg_price?: number;
  sell_avg_price?: number;
}

export interface StockQuote {
  symbol: string;
  company_name: string;
  price: number;
  change: number;
  change_percentage: number;
  volume: number;
  value: number;
  open: number;
  high: number;
  low: number;
  prev_close: number;
  net_foreign_buy: number;
  net_foreign_sell: number;
}

export interface BandarAccumulation {
  symbol: string;
  company_name: string;
  analysis_date: string;
  accumulation_score: number;
  status: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
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

export interface BandarDistribution {
  symbol: string;
  company_name: string;
  analysis_date: string;
  distribution_score: number;
  status: string;
  confidence: number;
  indicators: {
    broker_exit_pattern: {
      top_brokers_selling: string[];
      selling_percentage: number;
      days_selling: number;
      score: number;
      bandar_status: string;
      total_buyer: number;
      total_seller: number;
      net_flow: number;
    };
    price_volume_divergence: {
      price_increase: number;
      volume_decrease: number;
      divergence_detected: boolean;
    };
    foreign_flow: {
      net_foreign_sell: string;
      consecutive_sell_days: number;
    };
  };
  signals: string[];
  recommendation: string;
  risk_level: string;
}

export interface BandarSmartMoney {
  symbol: string;
  company_name: string;
  analysis_date: string;
  smart_money_score: number;
  flow_direction: 'INFLOW' | 'OUTFLOW' | 'NEUTRAL';
  analysis: {
    foreign_investors: {
      net_flow_7d: string;
      net_flow_30d: string;
      trend: string;
      consistency_score: number;
    };
    institutional_brokers: {
      top_institutions: string[];
      net_position: string;
      total_value: string;
      avg_price: number;
    };
    insider_activity: {
      major_holders_buying: number;
      major_holders_selling: number;
      net_insider_flow: string;
      recent_activity: string[];
    };
  };
  momentum: {
    short_term: string;
    medium_term: string;
    long_term: string;
  };
  recommendation: string;
  confidence: number;
}

export interface BandarPumpDump {
  symbol: string;
  company_name: string;
  analysis_date: string;
  risk_score: number;
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'PUMP_DETECTED' | 'DUMP_DETECTED' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | string;
  warnings: string[];
  pump_indicators: {
    price_surge: number;
    volume_surge: number;
    broker_concentration: number;
    retail_fomo_score: number;
    fundamental_support: boolean;
  };
  historical_pattern: {
    similar_pumps: number;
    avg_dump_percentage: number;
    avg_days_to_dump: number;
  };
  recommendation: string;
  safe_entry_price: number | null;
  confidence: number;
}

export interface BandarAnalysis {
  accumulation: BandarAccumulation | null;
  distribution: BandarDistribution | null;
  smartMoney: BandarSmartMoney | null;
  pumpDump: BandarPumpDump | null;
}

export interface MultibaggerCandidate {
  symbol: string;
  name: string;
  multibagger_score: number;
  potential_return: string;
  timeframe: string;
  current_price: number;
  reasons: {
    technical: {
      price_vs_52w_low: number;
      price_vs_52w_high: number;
      trend: string;
      breakout_potential: string;
      score: number;
    };
    volume: {
      volume_surge: number;
      volume_trend: string;
      unusual_volume: boolean;
      score: number;
    };
    foreign_flow: {
      net_foreign_flow: string;
      foreign_accumulation: boolean;
      consecutive_buy_days: number;
      score: number;
    };
    accumulation: {
      accumulation_score: number;
      status: string;
      days: number;
      score: number;
    };
  };
  entry_zone: {
    ideal_price: number;
    max_price: number;
    current_price: number;
  };
  target_prices: Array<{
    target: number;
    probability: number;
    timeframe: string;
    potential_gain: number;
  }>;
  risk_level: string;
  stop_loss: number;
  sector: string;
  market_cap: number;
  market_cap_formatted: string;
}

export interface MultibaggerScan {
  scan_date: string;
  total_candidates: number;
  filters_applied: {
    min_score: number;
    max_results: number;
  };
  candidates: MultibaggerCandidate[];
}

export interface BreakoutAlert {
  symbol: string;
  name: string;
  alert_type: string;
  severity: string;
  price: number;
  change_percentage: number;
  volume: string;
  volume_vs_avg: number;
  indicators: {
    resistance_level: number;
    support_level: number;
    distance_to_resistance: number;
    distance_to_support: number;
    volume_confirmation: boolean;
    price_momentum: string;
  };
  breakout_probability: number;
  action: string;
  entry_trigger: string;
  target: number;
  stop_loss: number;
  timestamp: string;
}

export interface BreakoutAlerts {
  scan_date: string;
  total_alerts: number;
  alerts: BreakoutAlert[];
}

export interface RiskRewardAnalysis {
  symbol: string;
  name: string;
  current_price: number;
  analysis_date: string;
  support_levels: number[];
  resistance_levels: number[];
  stop_loss_recommended: number;
  target_prices: Array<{
    level: number;
    probability: number;
    reward: number;
    risk_reward: number;
  }>;
  risk_amount: number;
  reward_amount: number;
  risk_reward_ratio: number;
  recommendation: string;
  position_sizing: {
    max_position_percent: number;
    suggested_shares: number;
    total_investment: string;
    max_loss: string;
  };
  technical_levels: {
    pivot_point: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
    atr: number;
    atr_percent: number;
  };
}

export interface SectorData {
  sector_id: string;
  sector_name: string;
  momentum_score: number;
  status: string;
  avg_return_today: number;
  total_value: number;
  total_value_formatted: string;
  foreign_flow: string;
  top_stocks: Array<{
    symbol: string;
    name: string;
    price: number;
    change_percent: number;
    value: number;
    value_formatted: string;
  }>;
  recommendation: string;
  companies_count: number;
  gainers_count: number;
  losers_count: number;
}

export interface SectorRotation {
  analysis_date: string;
  market_phase: string;
  hot_sectors: SectorData[];
  cold_sectors: SectorData[];
  all_sectors: SectorData[];
  summary: {
    total_sectors: number;
    bullish_sectors: number;
    bearish_sectors: number;
    neutral_sectors: number;
  };
}

export interface RetailOpportunity {
  multibagger: MultibaggerScan | null;
  breakout: BreakoutAlerts | null;
  sectorRotation: SectorRotation | null;
}

export interface TrendingItem {
  symbol: string;
  name?: string;
  score?: number;
  mentions?: number;
}

export interface TopBrokerItem {
  broker_code: string;
  broker_name?: string;
  total_value?: number;
  net_value?: number;
  total_volume?: number;
}

export interface TopStockItem {
  symbol: string;
  name?: string;
  total_value?: number;
  total_volume?: number;
  total_frequency?: number;
  investor_type?: string;
  market_type?: string;
}

export interface BrokerActivity {
  broker_code: string;
  from?: string;
  to?: string;
  bandar_detector?: unknown;
  broker_summary?: unknown;
}

function transformMovers(response: MoverApiResponse): TopMover[] {
  return response.data.mover_list.map(item => ({
    symbol: item.stock_detail.code,
    company_name: item.stock_detail.name,
    last_price: item.price,
    change: item.change.value,
    change_percentage: item.change.percentage,
    volume: item.volume.raw,
    value: item.value.raw,
    net_foreign_buy: item.net_foreign_buy?.raw || 0,
    net_foreign_sell: item.net_foreign_sell?.raw || 0,
  }));
}

type MoverFetchOptions = { fresh?: boolean };

type MoverOptions = MoverFetchOptions & { filters?: MoverFilter[] };

function fetchMovers(endpoint: string, options?: MoverOptions): Promise<TopMover[]> {
  const params: QueryParams | undefined = options?.filters?.length
    ? { filterStocks: options.filters }
    : undefined;

  if (options?.fresh) {
    return fetchApiClient<MoverApiResponse>(endpoint, params).then(transformMovers);
  }

  return fetchApi<MoverApiResponse>(endpoint, params, 30).then(transformMovers);
}

function transformBrokerSummary(response: BrokerSummaryApiResponse): BrokerSummary[] {
  const brokers: BrokerSummary[] = [];
  
  const buyMap = new Map<string, { value: number; lot: number; type: string; avg?: number }>();
  const sellMap = new Map<string, { value: number; lot: number; type: string; avg?: number }>();
  
  for (const b of response.data.broker_summary.brokers_buy) {
    buyMap.set(b.netbs_broker_code, {
      value: Math.abs(parseFloat(b.bval) || 0),
      lot: Math.abs(parseFloat(b.blot) || 0),
      type: b.type,
      avg: b.netbs_buy_avg_price !== undefined ? Math.abs(parseFloat(b.netbs_buy_avg_price) || 0) : undefined,
    });
  }
  
  for (const s of response.data.broker_summary.brokers_sell) {
    sellMap.set(s.netbs_broker_code, {
      value: Math.abs(parseFloat(s.sval) || 0),
      lot: Math.abs(parseFloat(s.slot) || 0),
      type: s.type,
      avg: s.netbs_sell_avg_price !== undefined ? Math.abs(parseFloat(s.netbs_sell_avg_price) || 0) : undefined,
    });
  }
  
  const allBrokers = new Set([...buyMap.keys(), ...sellMap.keys()]);
  
  for (const code of allBrokers) {
    const buy = buyMap.get(code) || { value: 0, lot: 0, type: 'Lokal', avg: undefined };
    const sell = sellMap.get(code) || { value: 0, lot: 0, type: 'Lokal', avg: undefined };
    
    brokers.push({
      broker_code: code,
      broker_name: code,
      buy_value: buy.value,
      sell_value: sell.value,
      net_value: buy.value - sell.value,
      buy_volume: buy.lot,
      sell_volume: sell.lot,
      net_volume: buy.lot - sell.lot,
      broker_type: buy.type || sell.type,
      buy_avg_price: buy.avg,
      sell_avg_price: sell.avg,
    });
  }
  
  return brokers.sort((a, b) => b.net_value - a.net_value);
}

function getRecentTradingDates(count: number = 5): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  let daysBack = 0;
  while (dates.length < count) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysBack);
    const day = date.getDay();
    
    if (day !== 0 && day !== 6) {
      dates.push(date.toISOString().split('T')[0]);
    }
    daysBack++;
  }
  
  return dates;
}

export const datasahamApi = {
  async search(keyword: string, options?: { page?: number; type?: 'company'; fresh?: boolean }): Promise<SearchResult> {
    const params: QueryParams = {
      keyword,
      type: options?.type ?? 'company',
    };
    if (options?.page !== undefined) params.page = String(options.page);

    if (options?.fresh) {
      return fetchApiClient<{ data: SearchResult; message: string }>('/main/search', params).then(res => res.data);
    }

    return fetchApi<{ data: SearchResult; message: string }>('/main/search', params, 60).then(res => res.data);
  },

  async getStockProfile(symbol: string): Promise<StockProfile> {
    return fetchApi<StockProfile>(`/emiten/${symbol}/profile`, undefined, 3600);
  },

  async getMovers(moverType: MoverType, options?: MoverOptions): Promise<TopMover[]> {
    const filters = options?.filters ?? DEFAULT_MOVER_FILTERS;
    return fetchMovers(`/movers/${moverType}`, { ...options, filters });
  },

  async getTopGainers(options?: MoverOptions): Promise<TopMover[]> {
    return this.getMovers('top-gainer', options);
  },

  async getTopLosers(options?: MoverOptions): Promise<TopMover[]> {
    return this.getMovers('top-loser', options);
  },

  async getMostActive(options?: MoverOptions): Promise<TopMover[]> {
    return this.getMovers('top-volume', options);
  },

  async getNetForeignBuy(options?: MoverOptions): Promise<TopMover[]> {
    return this.getMovers('net-foreign-buy', options);
  },

  async getNetForeignSell(options?: MoverOptions): Promise<TopMover[]> {
    return this.getMovers('net-foreign-sell', options);
  },

  async getChartData(
    symbol: string,
    timeframe: ChartTimeframe,
    options: { from: string; to: string; limit?: number; fresh?: boolean }
  ): Promise<ChartCandle[]> {
    const params: QueryParams = {
      from: options.from,
      to: options.to,
    };

    if (options.limit !== undefined) {
      params.limit = String(options.limit);
    }

    const endpoint = `/chart/${symbol}/${timeframe}`;

    if (options.fresh) {
      return fetchApiClient<ChartApiResponse>(endpoint, params)
        .then(res => res.data?.ohlcv || [])
        .catch(() => []);
    }

    return fetchApi<ChartApiResponse>(endpoint, params, 0)
      .then(res => res.data?.ohlcv || [])
      .catch(() => []);
  },

  async getMarketSentiment(symbol: string, options?: { days?: number; fresh?: boolean }): Promise<MarketSentiment | null> {
    const params: QueryParams = {};
    if (options?.days !== undefined) {
      params.days = String(options.days);
    }

    const endpoint = `/analysis/sentiment/${symbol}`;

    if (options?.fresh) {
      return fetchApiClient<MarketSentiment>(endpoint, params).catch(() => null);
    }
    return fetchApi<MarketSentiment>(endpoint, params, 60).catch(() => null);
  },

  async getTechnicalAnalysis(
    symbol: string,
    options?: { timeframe?: string; period?: number; indicator?: string; fresh?: boolean }
  ): Promise<TechnicalAnalysis | null> {
    const params: QueryParams = {};
    if (options?.timeframe) params.timeframe = options.timeframe;
    if (options?.period !== undefined) params.period = String(options.period);
    if (options?.indicator) params.indicator = options.indicator;

    const endpoint = `/analysis/technical/${symbol}`;
    const fetcher = options?.fresh ? fetchApiClient<TechnicalAnalysis> : fetchApi<TechnicalAnalysis>;
    return fetcher(endpoint, params, 60).catch(() => null);
  },

  async getInsights(symbol: string, options?: { fresh?: boolean }): Promise<InsightsData | null> {
    const endpoint = `/beta/insights/${symbol}`;

    if (options?.fresh) {
      return fetchApiClient<{ message?: string; data: InsightsData }>(endpoint)
        .then(res => res.data)
        .catch(() => null);
    }
    return fetchApi<{ message?: string; data: InsightsData }>(endpoint, undefined, 300)
      .then(res => res.data)
      .catch(() => null);
  },

  async getIpoMomentum(options?: { fresh?: boolean }): Promise<IpoMomentum | null> {
    const endpoint = '/analysis/sentiment/ipo/momentum';
    if (options?.fresh) {
      return fetchApiClient<IpoMomentum>(endpoint).catch(() => null);
    }
    return fetchApi<IpoMomentum>(endpoint, undefined, 300).catch(() => null);
  },

  async getBrokerSummary(symbol: string): Promise<BrokerSummary[]> {
    const dates = getRecentTradingDates(5);
    
    for (const targetDate of dates) {
      try {
        const response = await fetchApi<BrokerSummaryApiResponse>(
          `/market-detector/broker-summary/${symbol}`,
          { from: targetDate, to: targetDate },
          60
        );
        
        const brokers = transformBrokerSummary(response);
        if (brokers.length > 0) {
          return brokers;
        }
      } catch {
        continue;
      }
    }
    
    return [];
  },

  async getStockQuote(symbol: string): Promise<StockQuote | null> {
      try {
        const gainers = await this.getTopGainers();
        const losers = await this.getTopLosers();
        const mostActive = await this.getMostActive();
        
        const allStocks = [...gainers, ...losers, ...mostActive];
        const stock = allStocks.find(s => s.symbol === symbol);
        
        if (stock) {
          return {
            symbol: stock.symbol,
            company_name: stock.company_name,
            price: stock.last_price,
            change: stock.change,
            change_percentage: stock.change_percentage,
            volume: stock.volume,
            value: stock.value,
            open: stock.last_price - stock.change,
            high: stock.last_price,
            low: stock.last_price,
            prev_close: stock.last_price - stock.change,
            net_foreign_buy: stock.net_foreign_buy,
            net_foreign_sell: stock.net_foreign_sell,
          };
        }
        
        return null;
      } catch {
        return null;
      }
    },

  async getBandarAccumulation(symbol: string, options?: { days?: number; fresh?: boolean }): Promise<BandarAccumulation | null> {
    const params: QueryParams = {};
    if (options?.days !== undefined) params.days = String(options.days);

    const endpoint = `/analysis/bandar/accumulation/${symbol}`;
    const fetcher = options?.fresh ? fetchApiClient<BandarAccumulation> : fetchApi<BandarAccumulation>;
    return fetcher(endpoint, params, 60).catch(() => null);
  },

  async getBandarDistribution(symbol: string): Promise<BandarDistribution | null> {
    try {
      return await fetchApi<BandarDistribution>(`/analysis/bandar/distribution/${symbol}`, undefined, 60);
    } catch {
      return null;
    }
  },

  async getBandarSmartMoney(symbol: string): Promise<BandarSmartMoney | null> {
    try {
      return await fetchApi<BandarSmartMoney>(`/analysis/bandar/smart-money/${symbol}`, undefined, 60);
    } catch {
      return null;
    }
  },

  async getBandarPumpDump(symbol: string, options?: { days?: number; fresh?: boolean }): Promise<BandarPumpDump | null> {
    const params: QueryParams = {};
    if (options?.days !== undefined) params.days = String(options.days);

    const endpoint = `/analysis/bandar/pump-dump/${symbol}`;
    const fetcher = options?.fresh ? fetchApiClient<BandarPumpDump> : fetchApi<BandarPumpDump>;
    return fetcher(endpoint, params, 60).catch(() => null);
  },

  async getBandarAnalysis(symbol: string, options?: { accumulationDays?: number; pumpDumpDays?: number }): Promise<BandarAnalysis> {
    const [accumulation, distribution, smartMoney, pumpDump] = await Promise.all([
      this.getBandarAccumulation(symbol, { days: options?.accumulationDays ?? 14 }),
      this.getBandarDistribution(symbol),
      this.getBandarSmartMoney(symbol),
      this.getBandarPumpDump(symbol, { days: options?.pumpDumpDays ?? 7 }),
    ]);
    return { accumulation, distribution, smartMoney, pumpDump };
  },

  async getMultibaggerScan(options?: { min_score?: number; sector?: string; max_results?: number; fresh?: boolean }): Promise<MultibaggerScan | null> {
    const params: QueryParams = {};
    if (options?.min_score !== undefined) params.min_score = String(options.min_score);
    if (options?.sector) params.sector = options.sector;
    if (options?.max_results !== undefined) params.max_results = String(options.max_results);

    const endpoint = '/analysis/retail/multibagger/scan';
    if (options?.fresh) {
      return fetchApiClient<MultibaggerScan>(endpoint, params).catch(() => null);
    }
    return fetchApi<MultibaggerScan>(endpoint, params, 300).catch(() => null);
  },

  async getBreakoutAlerts(options?: { fresh?: boolean }): Promise<BreakoutAlerts | null> {
    const endpoint = '/analysis/retail/breakout/alerts';
    if (options?.fresh) {
      return fetchApiClient<BreakoutAlerts>(endpoint).catch(() => null);
    }
    return fetchApi<BreakoutAlerts>(endpoint, undefined, 60).catch(() => null);
  },

  async getRiskReward(symbol: string, options?: { days?: number; portfolio_size?: number; risk_percent?: number; fresh?: boolean }): Promise<RiskRewardAnalysis | null> {
    const params: QueryParams = {};
    if (options?.days !== undefined) params.days = String(options.days);
    if (options?.portfolio_size !== undefined) params.portfolio_size = String(options.portfolio_size);
    if (options?.risk_percent !== undefined) params.risk_percent = String(options.risk_percent);

    const endpoint = `/analysis/retail/risk-reward/${symbol}`;
    if (options?.fresh) {
      return fetchApiClient<RiskRewardAnalysis>(endpoint, params).catch(() => null);
    }
    return fetchApi<RiskRewardAnalysis>(endpoint, params, 60).catch(() => null);
  },

  async getSectorRotation(options?: { fresh?: boolean }): Promise<SectorRotation | null> {
    const endpoint = '/analysis/retail/sector-rotation';
    if (options?.fresh) {
      return fetchApiClient<SectorRotation>(endpoint).catch(() => null);
    }
    return fetchApi<SectorRotation>(endpoint, undefined, 300).catch(() => null);
  },

  async getRetailOpportunity(options?: { fresh?: boolean; min_score?: number; sector?: string; max_results?: number }): Promise<RetailOpportunity> {
    const [multibagger, breakout, sectorRotation] = await Promise.all([
      this.getMultibaggerScan({ ...options, fresh: options?.fresh }),
      this.getBreakoutAlerts({ fresh: options?.fresh }),
      this.getSectorRotation({ fresh: options?.fresh }),
    ]);
    return { multibagger, breakout, sectorRotation };
  },

  async getTrending(options?: { fresh?: boolean }): Promise<TrendingItem[]> {
    const endpoint = '/main/trending';
    const transform = (payload: unknown): TrendingItem[] => {
      if (!payload) return [];
      const rawArray = Array.isArray((payload as { data?: unknown })?.data)
        ? (payload as { data: unknown[] }).data
        : Array.isArray(payload)
          ? (payload as unknown[])
          : [];

      return rawArray
        .map((item): TrendingItem | null => {
          if (!item || typeof item !== 'object') return null;
          const candidate = item as Record<string, unknown>;
          const symbol = String(candidate.symbol || candidate.code || candidate.ticker || '');
          if (!symbol) return null;
          const nameVal = candidate.name || candidate.company_name || candidate.title;
          const score = typeof candidate.score === 'number' ? candidate.score : undefined;
          const mentions = typeof candidate.mentions === 'number' ? candidate.mentions : undefined;
          return {
            symbol,
            name: nameVal ? String(nameVal) : undefined,
            score,
            mentions,
          };
        })
        .filter((t): t is TrendingItem => Boolean(t));
    };

    if (options?.fresh) {
      return fetchApiClient<unknown>(endpoint).then(transform).catch(() => []);
    }
    return fetchApi<unknown>(endpoint, undefined, 60).then(transform).catch(() => []);
  },

  async getTopBroker(options?: { sort?: string; order?: string; period?: string; marketType?: string; fresh?: boolean }): Promise<TopBrokerItem[]> {
    const params: QueryParams = {
      sort: options?.sort ?? 'TB_SORT_BY_TOTAL_VALUE',
      order: options?.order ?? 'ORDER_BY_DESC',
      period: options?.period ?? 'TB_PERIOD_LAST_1_DAY',
      marketType: options?.marketType ?? 'MARKET_TYPE_ALL',
    };

    const endpoint = '/market-detector/top-broker';
    const transform = (payload: unknown): TopBrokerItem[] => {
      const raw = Array.isArray((payload as { data?: unknown })?.data)
        ? (payload as { data: unknown[] }).data
        : Array.isArray(payload)
          ? (payload as unknown[])
          : [];

      return raw
        .map((item): TopBrokerItem | null => {
          if (!item || typeof item !== 'object') return null;
          const obj = item as Record<string, unknown>;
          const broker_code = String(obj.broker_code || obj.code || '');
          if (!broker_code) return null;
          return {
            broker_code,
            broker_name: obj.broker_name ? String(obj.broker_name) : undefined,
            total_value: Number(obj.total_value || obj.value || 0),
            net_value: obj.net_value !== undefined ? Number(obj.net_value) : undefined,
            total_volume: obj.total_volume !== undefined ? Number(obj.total_volume) : undefined,
          };
        })
        .filter((b): b is TopBrokerItem => Boolean(b));
    };

    if (options?.fresh) {
      return fetchApiClient<unknown>(endpoint, params).then(transform).catch(() => []);
    }
    return fetchApi<unknown>(endpoint, params, 60).then(transform).catch(() => []);
  },

  async getTopStock(options: { start: string; end: string; investorType?: string; marketType?: string; valueType?: string; page?: number; fresh?: boolean }): Promise<TopStockItem[]> {
    const params: QueryParams = {
      start: options.start,
      end: options.end,
      investorType: options.investorType ?? 'INVESTOR_TYPE_ALL',
      marketType: options.marketType ?? 'MARKET_TYPE_ALL',
      valueType: options.valueType ?? 'VALUE_TYPE_TOTAL',
    };
    if (options.page !== undefined) params.page = String(options.page);

    const endpoint = '/market-detector/top-stock';
    const transform = (payload: unknown): TopStockItem[] => {
      const raw = Array.isArray((payload as { data?: unknown })?.data)
        ? (payload as { data: unknown[] }).data
        : Array.isArray(payload)
          ? (payload as unknown[])
          : [];

      return raw
        .map((item): TopStockItem | null => {
          if (!item || typeof item !== 'object') return null;
          const obj = item as Record<string, unknown>;
          const symbol = String(obj.symbol || obj.code || '');
          if (!symbol) return null;
          return {
            symbol,
            name: obj.name ? String(obj.name) : undefined,
            total_value: obj.total_value !== undefined ? Number(obj.total_value) : undefined,
            total_volume: obj.total_volume !== undefined ? Number(obj.total_volume) : undefined,
            total_frequency: obj.total_frequency !== undefined ? Number(obj.total_frequency) : undefined,
            investor_type: obj.investor_type ? String(obj.investor_type) : undefined,
            market_type: obj.market_type ? String(obj.market_type) : undefined,
          };
        })
        .filter((s): s is TopStockItem => Boolean(s));
    };

    if (options.fresh) {
      return fetchApiClient<unknown>(endpoint, params).then(transform).catch(() => []);
    }
    return fetchApi<unknown>(endpoint, params, 60).then(transform).catch(() => []);
  },

  async getBrokerActivity(brokerCode: string, options: { from: string; to: string; page?: number; limit?: number; transactionType?: string; marketBoard?: string; investorType?: string; fresh?: boolean }): Promise<BrokerActivity | null> {
    const params: QueryParams = {
      from: options.from,
      to: options.to,
      transactionType: options.transactionType ?? 'TRANSACTION_TYPE_NET',
      marketBoard: options.marketBoard ?? 'MARKET_BOARD_ALL',
      investorType: options.investorType ?? 'INVESTOR_TYPE_ALL',
    };
    if (options.page !== undefined) params.page = String(options.page);
    if (options.limit !== undefined) params.limit = String(options.limit);

    const endpoint = `/market-detector/broker-activity/${brokerCode}`;
    const fetcher = options.fresh ? fetchApiClient<BrokerActivity> : fetchApi<BrokerActivity>;
    return fetcher(endpoint, params, 60).catch(() => null);
  },

  async getBrokerSummaryRange(symbol: string, options: { from: string; to: string; transactionType?: string; marketBoard?: string; investorType?: string; limit?: number; fresh?: boolean }): Promise<BrokerSummary[]> {
    const params: QueryParams = {
      from: options.from,
      to: options.to,
      transactionType: options.transactionType ?? 'TRANSACTION_TYPE_NET',
      marketBoard: options.marketBoard ?? 'MARKET_BOARD_ALL',
      investorType: options.investorType ?? 'INVESTOR_TYPE_ALL',
    };
    if (options.limit !== undefined) params.limit = String(options.limit);

    const endpoint = `/market-detector/broker-summary/${symbol}`;
    const fetcher = options.fresh ? fetchApiClient<BrokerSummaryApiResponse> : fetchApi<BrokerSummaryApiResponse>;
    return fetcher(endpoint, params, 60)
      .then(transformBrokerSummary)
      .catch(() => []);
  },

  async getStockInfoDetail(symbol: string, options?: { fresh?: boolean }): Promise<StockInfoDetail | null> {
    const endpoint = `/emiten/${symbol}/info`;
    const fetcher = options?.fresh ? fetchApiClient<StockInfoDetail> : fetchApi<StockInfoDetail>;
    return fetcher(endpoint, undefined, 0).catch(() => null);
  },

  async getOrderbook(symbol: string, options?: { fresh?: boolean }): Promise<Orderbook | null> {
    const endpoint = `/emiten/${symbol}/orderbook`;
    const fetcher = options?.fresh ? fetchApiClient<Orderbook> : fetchApi<Orderbook>;
    return fetcher(endpoint, undefined, 0).catch(() => null);
  },

  async getHistoricalSummary(symbol: string, options: { startDate: string; endDate: string; period?: string; fresh?: boolean }): Promise<HistoricalSummary | null> {
    const params: QueryParams = {
      startDate: options.startDate,
      endDate: options.endDate,
      period: options.period ?? 'HS_PERIOD_DAILY',
      limit: '100',
    };
    const endpoint = `/emiten/${symbol}/historical-summary`;
    const fetcher = options.fresh ? fetchApiClient<HistoricalSummary> : fetchApi<HistoricalSummary>;
    return fetcher(endpoint, params, 0).catch(() => null);
  },

  async getBrokerTradeChart(symbol: string, options?: { fresh?: boolean }): Promise<BrokerTradeChartPoint[]> {
    const endpoint = `/emiten/${symbol}/broker-trade-chart`;
    const fetcher = options?.fresh ? fetchApiClient<BrokerTradeChartPoint[]> : fetchApi<BrokerTradeChartPoint[]>;
    return fetcher(endpoint, undefined, 0).catch(() => []);
  },

  async getSeasonality(symbol: string, options?: { fresh?: boolean }): Promise<SeasonalityPoint[]> {
    const endpoint = `/emiten/${symbol}/seasonality`;
    const fetcher = options?.fresh ? fetchApiClient<SeasonalityPoint[]> : fetchApi<SeasonalityPoint[]>;
    return fetcher(endpoint, undefined, 0).catch(() => []);
  },

  async getSubsidiary(symbol: string, options?: { fresh?: boolean }): Promise<SubsidiaryData | null> {
    const endpoint = `/emiten/${symbol}/subsidiary`;
    const fetcher = options?.fresh ? fetchApiClient<SubsidiaryData> : fetchApi<SubsidiaryData>;
    return fetcher(endpoint, undefined, 0).catch(() => null);
  },

  async getKeyStatsDetail(symbol: string, options?: { fresh?: boolean }): Promise<KeyStats | null> {
    const endpoint = `/emiten/${symbol}/keystats`;
    const fetcher = options?.fresh ? fetchApiClient<KeyStats> : fetchApi<KeyStats>;
    return fetcher(endpoint, undefined, 0).catch(() => null);
  },

  async getFinancials(symbol: string, options?: { fresh?: boolean }): Promise<unknown> {
    const endpoint = `/emiten/${symbol}/financials`;
    const fetcher = options?.fresh ? fetchApiClient<unknown> : fetchApi<unknown>;
    return fetcher(endpoint, undefined, 0).catch(() => null);
  },

  async getHoldingComposition(symbol: string, options?: { fresh?: boolean }): Promise<HoldingComposition[]> {
    const endpoint = `/emiten/${symbol}/profile/holding-composition`;
    const fetcher = options?.fresh ? fetchApiClient<HoldingComposition[]> : fetchApi<HoldingComposition[]>;
    return fetcher(endpoint, undefined, 0).catch(() => []);
  },

  async getForeignOwnership(symbol: string, options?: { fresh?: boolean }): Promise<ForeignOwnership[]> {
    const endpoint = `/emiten/${symbol}/foreign-ownership`;
    const fetcher = options?.fresh ? fetchApiClient<ForeignOwnership[]> : fetchApi<ForeignOwnership[]>;
    return fetcher(endpoint, undefined, 0).catch(() => []);
  },

  async getInsider(symbol: string, options?: { fresh?: boolean }): Promise<InsiderTransaction[]> {
    const endpoint = `/emiten/${symbol}/insider`;
    const fetcher = options?.fresh ? fetchApiClient<InsiderTransaction[]> : fetchApi<InsiderTransaction[]>;
    return fetcher(endpoint, undefined, 0).catch(() => []);
  },

  async getWhaleTransactionsFull(
    symbol: string,
    options?: { min_lot?: number; fresh?: boolean },
  ): Promise<WhaleTransactionsApiResponse | null> {
    const params: QueryParams = {};
    if (options?.min_lot !== undefined) params.min_lot = String(options.min_lot);

    const endpoint = `/analysis/whale-transactions/${symbol}`;
    const fetcher = options?.fresh ? fetchApiClientFull<WhaleTransactions> : fetchApiFull<WhaleTransactions>;
    return fetcher(endpoint, params, 0).catch(() => null);
  },

  async getWhaleTransactions(symbol: string, options?: { min_lot?: number; fresh?: boolean }): Promise<WhaleTransactions | null> {
    const params: QueryParams = {};
    if (options?.min_lot !== undefined) params.min_lot = String(options.min_lot);

    const endpoint = `/analysis/whale-transactions/${symbol}`;
    const fetcher = options?.fresh ? fetchApiClient<WhaleTransactions> : fetchApi<WhaleTransactions>;
    return fetcher(endpoint, params, 0).catch(() => null);
  },
};
