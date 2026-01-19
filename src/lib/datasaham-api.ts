const API_BASE = 'https://api.datasaham.io/api';
const API_KEY = process.env.DATASAHAM_API_KEY || 'sbk_8fbb3824f0f13e617109e37c66b8c7c55a3debbb9a5870b0';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchApi<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
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
    next: { revalidate: 60 },
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
}

interface MoverApiItem {
  stock_detail: { code: string; name: string };
  price: number;
  change: { value: number; percentage: number };
  value: { raw: number };
  volume: { raw: number };
}

interface MoverApiResponse {
  data: {
    mover_list: MoverApiItem[];
  };
}

export interface SectorPerformance {
  sector_name: string;
  change_percentage: number;
  market_cap: number;
}

export interface GlobalIndex {
  name: string;
  symbol: string;
  last: number;
  change: number;
  change_percentage: number;
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
}

export interface CalendarEvent {
  company_symbol: string;
  stocksplit_cumdate: string;
  stocksplit_exdate: string;
  stocksplit_paymentdate: string;
  sahambonus_ratio: string;
}

export interface FinancialData {
  currency: string[];
  default_currency: string;
  html_report: string;
}

export interface TrendingStock {
  symbol: string;
  company_name: string;
  last_price: number;
  change: number;
  change_percentage: number;
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
  }));
}

export const datasahamApi = {
  async search(query: string): Promise<SearchResult> {
    return fetchApi<{ data: SearchResult; message: string }>('/main/search', { q: query })
      .then(res => res.data);
  },

  async getStockProfile(symbol: string): Promise<StockProfile> {
    return fetchApi<StockProfile>(`/emiten/${symbol}/profile`);
  },

  async getTopGainers(): Promise<TopMover[]> {
    return fetchApi<MoverApiResponse>('/movers/top-gainers').then(transformMovers);
  },

  async getTopLosers(): Promise<TopMover[]> {
    return fetchApi<MoverApiResponse>('/movers/top-losers').then(transformMovers);
  },

  async getMostActive(): Promise<TopMover[]> {
    return fetchApi<MoverApiResponse>('/movers/most-active').then(transformMovers);
  },

  async getNetForeignBuy(): Promise<TopMover[]> {
    return fetchApi<MoverApiResponse>('/movers/net-foreign-buy').then(transformMovers);
  },

  async getNetForeignSell(): Promise<TopMover[]> {
    return fetchApi<MoverApiResponse>('/movers/net-foreign-sell').then(transformMovers);
  },

  async getSectorPerformance(): Promise<{ data: SectorPerformance[] }> {
    return fetchApi<{ data: SectorPerformance[] }>('/sectors/performance');
  },

  async getGlobalIndices(): Promise<{ data: GlobalIndex[] }> {
    return fetchApi<{ data: GlobalIndex[] }>('/global-market/indices');
  },

  async getBrokerSummary(symbol: string): Promise<{ data: BrokerSummary[] }> {
    return fetchApi<{ data: BrokerSummary[] }>(`/market-detector/broker-summary/${symbol}`);
  },

  async getCalendarBonus(): Promise<{ data: { bonus: CalendarEvent[] } }> {
    return fetchApi<{ data: { bonus: CalendarEvent[] } }>('/calendar/bonus');
  },

  async getCalendarDividend(): Promise<{ data: { dividend: CalendarEvent[] } }> {
    return fetchApi<{ data: { dividend: CalendarEvent[] } }>('/calendar/dividend');
  },

  async getFinancials(symbol: string, reportType: number, statementType: number): Promise<FinancialData> {
    return fetchApi<FinancialData>(`/emiten/${symbol}/financials`, {
      report_type: reportType.toString(),
      statement_type: statementType.toString(),
    });
  },

  async getTrending(): Promise<{ data: TrendingStock[] }> {
    return fetchApi<{ data: TrendingStock[] }>('/main/trending');
  },
};
