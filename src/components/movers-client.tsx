'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ArrowDownRight, ArrowUpRight, Filter, Loader2, Zap, TrendingUp, TrendingDown, Users, Diamond, ArrowLeft } from 'lucide-react';
import { MoverFilter, MoverType, TopMover } from '@/lib/datasaham-api';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkline } from '@/components/sparkline';

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

const FILTER_OPTIONS: { value: MoverFilter; label: string; shortLabel: string }[] = [
  { value: 'FILTER_STOCKS_TYPE_MAIN_BOARD', label: 'Main Board', shortLabel: 'Main' },
  { value: 'FILTER_STOCKS_TYPE_DEVELOPMENT_BOARD', label: 'Development Board', shortLabel: 'Dev' },
  { value: 'FILTER_STOCKS_TYPE_ACCELERATION_BOARD', label: 'Acceleration Board', shortLabel: 'Accel' },
  { value: 'FILTER_STOCKS_TYPE_NEW_ECONOMY_BOARD', label: 'New Economy Board', shortLabel: 'NewEco' },
  { value: 'FILTER_STOCKS_TYPE_SPECIAL_MONITORING_BOARD', label: 'Special Monitoring Board', shortLabel: 'Special' },
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

export function MoversClient({ initialMovers, defaultFilters }: MoversClientProps) {
  const [activeType, setActiveType] = useState<MoverType>('top-gainer');
  const [filters, setFilters] = useState<MoverFilter[]>(defaultFilters);
  const [data, setData] = useState<MoverResponse[]>(initialMovers);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sparklineMap, setSparklineMap] = useState<Record<string, number[]>>({});
  const sparklineLoading = useRef(new Set<string>());

  const currentData = useMemo(
    () => data.find((item) => item.type === activeType)?.data || [],
    [data, activeType]
  );
  const activeLabel = MOVER_TABS.find((tab) => tab.type === activeType)?.label || activeType;

  useEffect(() => {
    const symbols = currentData.slice(0, 12).map((stock) => stock.symbol);
    const missing = symbols.filter((symbol) => !sparklineMap[symbol] && !sparklineLoading.current.has(symbol));
    if (missing.length === 0) return;

    missing.forEach(async (symbol) => {
      sparklineLoading.current.add(symbol);
      try {
        const res = await fetch(`/api/chart/${symbol}/daily?limit=12`, { cache: 'no-store' });
        const payload = await res.json();
        const values = Array.isArray(payload.data)
          ? payload.data.map((c: { close?: number }) => Number(c.close)).filter((v: number) => Number.isFinite(v))
          : [];
        setSparklineMap((prev) => ({ ...prev, [symbol]: values }));
      } catch (error) {
        console.error(error);
        setSparklineMap((prev) => ({ ...prev, [symbol]: [] }));
      } finally {
        sparklineLoading.current.delete(symbol);
      }
    });
  }, [currentData, sparklineMap]);

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
        <PageHeader
          eyebrow="Liquidity Pulse"
          title="Market Movers"
          description="Top gainers/losers, value, volume, foreign flow, dan IEP/IEV"
          icon={<Activity className="h-6 w-6 text-primary" />}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="icon" aria-label="Back">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex flex-wrap items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1">
                {FILTER_OPTIONS.map((option) => {
                  const isActive = filters.includes(option.value);
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={isActive ? 'default' : 'ghost'}
                      className="h-7 px-3 text-[10px] uppercase tracking-[0.2em]"
                      onClick={() => {
                        setFilters((prev) =>
                          isActive ? prev.filter((f) => f !== option.value) : [...prev, option.value]
                        );
                      }}
                    >
                      {option.shortLabel}
                    </Button>
                  );
                })}
              </div>
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
          }
          className="mb-6 reveal-up"
        />

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground reveal-up reveal-delay-1">
          <Badge variant="outline">Active {activeLabel}</Badge>
          <Badge variant="outline">{currentData.length} stocks</Badge>
          <Badge variant="outline">{filters.length > 0 ? `${filters.length} filter` : 'All boards'}</Badge>
          {isRefreshing && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing
            </span>
          )}
        </div>

        <Tabs value={activeType} onValueChange={(val) => setActiveType(val as MoverType)} className="space-y-4 reveal-up reveal-delay-2">
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
                    <Table>
                      <TableHeader className="sticky top-0 z-10">
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead className="text-right">Last</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                          <TableHead className="text-right">Volume</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead className="text-right">Trend</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentData.slice(0, 25).map((stock, idx) => {
                          const isPositive = stock.change >= 0;
                          const sparkValues = sparklineMap[stock.symbol] || [];
                          const sparkTone = isPositive ? "stroke-[var(--bullish)]" : "stroke-[var(--bearish)]";
                          return (
                            <TableRow key={stock.symbol}>
                              <TableCell className="text-muted-foreground">#{idx + 1}</TableCell>
                              <TableCell>
                                <Link href={`/stock/${stock.symbol}`} className="font-semibold hover:text-primary">
                                  {stock.symbol}
                                </Link>
                                <Badge variant="outline" className="ml-2">IDX</Badge>
                              </TableCell>
                              <TableCell className="max-w-[240px] truncate text-muted-foreground">
                                {stock.company_name}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {formatPrice(stock.last_price)}
                              </TableCell>
                              <TableCell className={`text-right font-mono ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                                <span className="inline-flex items-center gap-1">
                                  {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                  {isPositive ? '+' : ''}{stock.change_percentage?.toFixed(2) || '0.00'}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">
                                {formatNumber(stock.volume)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">
                                {formatNumber(stock.value)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Sparkline values={sparkValues} strokeClassName={sparkTone} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
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
