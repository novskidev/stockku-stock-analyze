'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Activity, ArrowDownRight, ArrowUpRight, Filter, Loader2, Zap, TrendingUp, TrendingDown, Users, Diamond, ArrowLeft } from 'lucide-react';
import { DEFAULT_MOVER_FILTERS, MoverFilter, MoverType, TopMover } from '@/lib/datasaham-api';

type MoverResponse = { type: MoverType; data: TopMover[] };

interface MoversClientProps {
  initialMovers: MoverResponse[];
  defaultFilters: MoverFilter[];
}

const MOVER_TABS: { type: MoverType; label: string; icon: React.ElementType }[] = [
  { type: 'top-gainer', label: 'Top Gainer', icon: TrendingUp },
  { type: 'top-loser', label: 'Top Loser', icon: TrendingDown },
  { type: 'top-value', label: 'Top Value', icon: Diamond },
  { type: 'top-volume', label: 'Top Volume', icon: Activity },
  { type: 'top-frequency', label: 'Top Frequency', icon: Zap },
  { type: 'net-foreign-buy', label: 'Net Foreign Buy', icon: Users },
  { type: 'net-foreign-sell', label: 'Net Foreign Sell', icon: Users },
];

const FILTER_OPTIONS: { value: MoverFilter; label: string }[] = [
  { value: 'FILTER_STOCKS_TYPE_MAIN_BOARD', label: 'Main Board' },
  { value: 'FILTER_STOCKS_TYPE_DEVELOPMENT_BOARD', label: 'Development Board' },
  { value: 'FILTER_STOCKS_TYPE_ACCELERATION_BOARD', label: 'Acceleration Board' },
  { value: 'FILTER_STOCKS_TYPE_NEW_ECONOMY_BOARD', label: 'New Economy Board' },
  { value: 'FILTER_STOCKS_TYPE_SPECIAL_MONITORING_BOARD', label: 'Special Monitoring Board' },
];

function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString('id-ID');
}

function formatPrice(price: number): string {
  return price.toLocaleString('id-ID');
}

function StockRow({ stock }: { stock: TopMover }) {
  const isPositive = stock.change >= 0;
  return (
    <Link href={`/stock/${stock.symbol}`} className="block">
      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{stock.symbol}</span>
            <Badge variant="outline">IDX</Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-[220px] truncate">{stock.company_name}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Vol {formatNumber(stock.volume)}</span>
            <span>|</span>
            <span>Val {formatNumber(stock.value)}</span>
            {stock.net_foreign_buy ? (
              <>
                <span>|</span>
                <span className="text-bullish">NFB {formatNumber(stock.net_foreign_buy)}</span>
              </>
            ) : stock.net_foreign_sell ? (
              <>
                <span>|</span>
                <span className="text-bearish">NFS {formatNumber(stock.net_foreign_sell)}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono font-semibold">{formatPrice(stock.last_price)}</p>
          <div className={`flex items-center justify-end gap-1 text-sm ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{stock.change_percentage?.toFixed(2) || '0.00'}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MoversClient({ initialMovers, defaultFilters }: MoversClientProps) {
  const [activeType, setActiveType] = useState<MoverType>('top-gainer');
  const [filters, setFilters] = useState<MoverFilter[]>(defaultFilters);
  const [data, setData] = useState<MoverResponse[]>(initialMovers);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentData = useMemo(
    () => data.find((item) => item.type === activeType)?.data || [],
    [data, activeType]
  );

  const refresh = useCallback(async (typeToFetch?: MoverType) => {
    setIsRefreshing(true);
    const targetType = typeToFetch || activeType;
    try {
      const params = new URLSearchParams();
      filters.forEach((f) => params.append('filterStocks', f));
      const res = await fetch(`/api/movers/${targetType}?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch movers');
      const payload = await res.json();
      setData((prev) => {
        const filteredPrev = prev.filter((m) => m.type !== targetType);
        return [...filteredPrev, { type: targetType, data: payload.data || [] }];
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeType, filters]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Market Movers</h1>
            <p className="text-sm text-muted-foreground">Top gainers/losers, value, volume, foreign flow, dan IEP/IEV</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Select
              value=""
              onValueChange={(val) => {
                if (!filters.includes(val as MoverFilter)) {
                  setFilters((prev) => [...prev, val as MoverFilter]);
                }
              }}
            >
              <SelectTrigger className="w-[230px]">
                <SelectValue placeholder="Tambah filter papan" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Badge
                  key={filter}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setFilters((prev) => prev.filter((f) => f !== filter))}
                >
                  {FILTER_OPTIONS.find((f) => f.value === filter)?.label || filter} ✕
                </Badge>
              ))}
              {filters.length === 0 && (
                <Badge variant="outline">No filters</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => refresh(activeType)} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeType} onValueChange={(val) => setActiveType(val as MoverType)} className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
            {MOVER_TABS.map((tab) => (
              <TabsTrigger key={tab.type} value={tab.type} className="gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {MOVER_TABS.map((tab) => (
            <TabsContent key={tab.type} value={tab.type}>
              <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon className="w-5 h-5 text-primary" />
                    {tab.label}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {filters.length > 0 ? `${filters.length} filters` : 'All boards'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => refresh(tab.type)} disabled={isRefreshing}>
                      {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Data tidak tersedia.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {currentData.slice(0, 30).map((stock) => (
                        <StockRow key={stock.symbol} stock={stock} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
