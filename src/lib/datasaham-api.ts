const API_BASE = 'https://api.datasaham.io/api';
const API_KEY = process.env.DATASAHAM_API_KEY || 'sbk_8fbb3824f0f13e617109e37c66b8c7c55a3debbb9a5870b0';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchApi<T>(endpoint: string, params?: Record<string, string>, revalidate: number = 30): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

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

export async function fetchApiClient<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

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
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'PUMP_DETECTED' | 'DUMP_DETECTED';
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

function transformBrokerSummary(response: BrokerSummaryApiResponse): BrokerSummary[] {
  const brokers: BrokerSummary[] = [];
  
  const buyMap = new Map<string, { value: number; lot: number; type: string }>();
  const sellMap = new Map<string, { value: number; lot: number; type: string }>();
  
  for (const b of response.data.broker_summary.brokers_buy) {
    buyMap.set(b.netbs_broker_code, {
      value: Math.abs(parseFloat(b.bval) || 0),
      lot: Math.abs(parseFloat(b.blot) || 0),
      type: b.type,
    });
  }
  
  for (const s of response.data.broker_summary.brokers_sell) {
    sellMap.set(s.netbs_broker_code, {
      value: Math.abs(parseFloat(s.sval) || 0),
      lot: Math.abs(parseFloat(s.slot) || 0),
      type: s.type,
    });
  }
  
  const allBrokers = new Set([...buyMap.keys(), ...sellMap.keys()]);
  
  for (const code of allBrokers) {
    const buy = buyMap.get(code) || { value: 0, lot: 0, type: 'Lokal' };
    const sell = sellMap.get(code) || { value: 0, lot: 0, type: 'Lokal' };
    
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
  async search(query: string): Promise<SearchResult> {
    return fetchApi<{ data: SearchResult; message: string }>('/main/search', { q: query }, 300)
      .then(res => res.data);
  },

  async getStockProfile(symbol: string): Promise<StockProfile> {
    return fetchApi<StockProfile>(`/emiten/${symbol}/profile`, undefined, 3600);
  },

  async getTopGainers(): Promise<TopMover[]> {
    return fetchApi<MoverApiResponse>('/movers/top-gainers', undefined, 30).then(transformMovers);
  },

  async getTopLosers(): Promise<TopMover[]> {
    return fetchApi<MoverApiResponse>('/movers/top-losers', undefined, 30).then(transformMovers);
  },

  async getMostActive(): Promise<TopMover[]> {
    return fetchApi<MoverApiResponse>('/movers/most-active', undefined, 30).then(transformMovers);
  },

  async getNetForeignBuy(): Promise<TopMover[]> {
    return fetchApi<MoverApiResponse>('/movers/net-foreign-buy', undefined, 30).then(transformMovers);
  },

  async getNetForeignSell(): Promise<TopMover[]> {
    return fetchApi<MoverApiResponse>('/movers/net-foreign-sell', undefined, 30).then(transformMovers);
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

  async getBandarAccumulation(symbol: string): Promise<BandarAccumulation | null> {
    try {
      return await fetchApi<BandarAccumulation>(`/analysis/bandar/accumulation/${symbol}`, undefined, 60);
    } catch {
      return null;
    }
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

  async getBandarPumpDump(symbol: string): Promise<BandarPumpDump | null> {
    try {
      return await fetchApi<BandarPumpDump>(`/analysis/bandar/pump-dump/${symbol}`, undefined, 60);
    } catch {
      return null;
    }
  },

  async getBandarAnalysis(symbol: string): Promise<BandarAnalysis> {
    const [accumulation, distribution, smartMoney, pumpDump] = await Promise.all([
      this.getBandarAccumulation(symbol),
      this.getBandarDistribution(symbol),
      this.getBandarSmartMoney(symbol),
      this.getBandarPumpDump(symbol),
    ]);
    return { accumulation, distribution, smartMoney, pumpDump };
  },

  async getMultibaggerScan(): Promise<MultibaggerScan | null> {
    try {
      return await fetchApi<MultibaggerScan>('/analysis/retail/multibagger/scan', undefined, 300);
    } catch {
      return null;
    }
  },

  async getBreakoutAlerts(): Promise<BreakoutAlerts | null> {
    try {
      return await fetchApi<BreakoutAlerts>('/analysis/retail/breakout/alerts', undefined, 60);
    } catch {
      return null;
    }
  },

  async getRiskReward(symbol: string): Promise<RiskRewardAnalysis | null> {
    try {
      return await fetchApi<RiskRewardAnalysis>(`/analysis/retail/risk-reward/${symbol}`, undefined, 60);
    } catch {
      return null;
    }
  },

  async getSectorRotation(): Promise<SectorRotation | null> {
    try {
      return await fetchApi<SectorRotation>('/analysis/retail/sector-rotation', undefined, 300);
    } catch {
      return null;
    }
  },

  async getRetailOpportunity(): Promise<RetailOpportunity> {
    const [multibagger, breakout, sectorRotation] = await Promise.all([
      this.getMultibaggerScan(),
      this.getBreakoutAlerts(),
      this.getSectorRotation(),
    ]);
    return { multibagger, breakout, sectorRotation };
  },
};
