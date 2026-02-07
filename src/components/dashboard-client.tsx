'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Activity, Users, ArrowUpRight, ArrowDownRight, LineChart, Zap, Shield, RefreshCw, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TopMover } from '@/lib/datasaham-api';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Sparkline } from '@/components/sparkline';
import { useRouter } from 'next/navigation';

interface DashboardClientProps {
  initialData: {
    gainers: TopMover[];
    losers: TopMover[];
    mostActive: TopMover[];
    foreignBuy: TopMover[];
  };
}

function formatNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString();
}

function formatPrice(price: number): string {
  return price.toLocaleString('id-ID');
}

function StockCard({ stock }: { stock: TopMover }) {
  const isPositive = stock.change >= 0;
  
  return (
    <Link href={`/stock/${stock.symbol}`}>
      <div className="group flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all cursor-pointer">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{stock.symbol}</span>
            <Badge variant="outline" className="text-xs">IDX</Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{stock.company_name}</p>
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

function MarketOverviewCard({ title, icon: Icon, stocks, emptyMessage }: { 
  title: string; 
  icon: React.ElementType; 
  stocks: TopMover[]; 
  emptyMessage: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stocks.length > 0 ? (
          stocks.slice(0, 5).map((stock) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; desc: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [marketData, setMarketData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const router = useRouter();

  const refreshMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/market', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to refresh market data');
      }
      const data = await response.json();
      setMarketData({
        gainers: data.gainers || [],
        losers: data.losers || [],
        mostActive: data.mostActive || [],
        foreignBuy: data.foreignBuy || [],
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshMarketData();
    const interval = setInterval(refreshMarketData, 30000);
    return () => clearInterval(interval);
  }, [refreshMarketData]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setActiveSearchIndex(-1);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
      setActiveSearchIndex(-1);
    } catch {
      setSearchResults([]);
      setActiveSearchIndex(-1);
    } finally {
      setIsSearching(false);
    }
  };

  const marketPulse = useMemo(() => {
    const combined = [...marketData.gainers, ...marketData.losers];
    const total = combined.length || 1;
    const breadth = marketData.gainers.length / total;
    const avgVolatility =
      combined.length > 0
        ? combined.reduce((acc, item) => acc + Math.abs(item.change_percentage || 0), 0) / combined.length
        : 0;
    const flow = marketData.foreignBuy.slice(0, 5).reduce((acc, item) => acc + (item.value || 0), 0);
    const snapshotValues = marketData.mostActive.slice(0, 10).map((item) => item.last_price || 0);
    return { breadth, avgVolatility, flow, snapshotValues };
  }, [marketData]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSearchIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSearchIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter' && activeSearchIndex >= 0) {
      event.preventDefault();
      const selected = searchResults[activeSearchIndex];
      if (selected) {
        router.push(`/stock/${selected.name}`);
        setSearchQuery('');
        setSearchResults([]);
        setActiveSearchIndex(-1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          eyebrow="Market Overview"
          title="Stockku"
          description="Cari saham cepat dan lihat pergerakan pasar"
          icon={<LineChart className="h-6 w-6 text-primary" />}
          actions={
            <div className="relative z-20 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari saham (contoh: BBCA, TLKM)..."
                className="pl-10 bg-secondary"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                role="combobox"
                aria-expanded={searchResults.length > 0}
                aria-controls="search-results"
                aria-activedescendant={
                  activeSearchIndex >= 0 ? `search-result-${activeSearchIndex}` : undefined
                }
              />
              {searchResults.length > 0 && (
                <div
                  id="search-results"
                  role="listbox"
                  className="absolute top-full mt-2 w-full bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                >
                  {isSearching && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
                  )}
                  {searchResults.map((result, idx) => (
                    <Link
                      key={result.id}
                      id={`search-result-${idx}`}
                      role="option"
                      aria-selected={activeSearchIndex === idx}
                      href={`/stock/${result.name}`}
                      className={`flex items-center justify-between p-3 transition-colors ${
                        activeSearchIndex === idx ? 'bg-accent' : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setActiveSearchIndex(-1);
                      }}
                    >
                      <div>
                        <span className="font-bold">{result.name}</span>
                        <p className="text-xs text-muted-foreground">{result.desc}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          }
          className="mb-6 overflow-visible"
        />

        <Card className="mb-6 glass-card reveal-up">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Market Pulse</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Breadth {(marketPulse.breadth * 100).toFixed(0)}%</Badge>
            <Badge variant="outline">Volatility {marketPulse.avgVolatility.toFixed(2)}%</Badge>
            <Badge variant="outline">Flow {formatNumber(marketPulse.flow)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Snapshot aktivitas top movers hari ini, rangkum arah pasar, tekanan, dan arus dana asing.
              </p>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                  <p className="text-xs text-muted-foreground">Breadth</p>
                  <p className="text-xl font-bold">{(marketPulse.breadth * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                  <p className="text-xs text-muted-foreground">Avg Vol</p>
                  <p className="text-xl font-bold">{marketPulse.avgVolatility.toFixed(2)}%</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                  <p className="text-xs text-muted-foreground">Foreign Flow</p>
                  <p className="text-xl font-bold">{formatNumber(marketPulse.flow)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-card/60 p-4">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Snapshot</p>
                <Sparkline values={marketPulse.snapshotValues} className="mx-auto mt-3 h-12 w-40" />
                <p className="mt-2 text-xs text-muted-foreground">Top most-active prices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-bullish/10 to-bullish/5 border-bullish/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Gainer</p>
                  <p className="text-2xl font-bold text-bullish">
                    {marketData.gainers[0]?.symbol || '-'}
                  </p>
                  <p className="text-sm text-bullish">
                    +{marketData.gainers[0]?.change_percentage?.toFixed(2) || '0'}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-bullish/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-bearish/10 to-bearish/5 border-bearish/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Loser</p>
                  <p className="text-2xl font-bold text-bearish">
                    {marketData.losers[0]?.symbol || '-'}
                  </p>
                  <p className="text-sm text-bearish">
                    {marketData.losers[0]?.change_percentage?.toFixed(2) || '0'}%
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-bearish/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Most Active</p>
                  <p className="text-2xl font-bold text-chart-2">
                    {marketData.mostActive[0]?.symbol || '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vol: {formatNumber(marketData.mostActive[0]?.volume || 0)}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-chart-2/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-5/10 to-chart-5/5 border-chart-5/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Foreign Buy</p>
                  <p className="text-2xl font-bold text-chart-5">
                    {marketData.foreignBuy[0]?.symbol || '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Net: {formatNumber(marketData.foreignBuy[0]?.value || 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-chart-5/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Card className="bg-gradient-to-r from-primary/5 to-chart-2/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Analisis Kuantitatif Lengkap</h2>
                    <p className="text-sm text-muted-foreground">
                      Technical, Fundamental, Bandarmology & AI Prediction
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <BarChart3 className="w-3 h-3" /> Technical
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Shield className="w-3 h-3" /> Fundamental
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Users className="w-3 h-3" /> Bandarmology
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="gainers" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-xl">
              <TabsTrigger value="gainers" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Top Gainers</span>
              </TabsTrigger>
              <TabsTrigger value="losers" className="gap-2">
                <TrendingDown className="w-4 h-4" />
                <span className="hidden sm:inline">Top Losers</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Most Active</span>
              </TabsTrigger>
              <TabsTrigger value="foreign" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Foreign Flow</span>
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Update: {lastUpdated.toLocaleTimeString('id-ID')}
                </span>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={refreshMarketData}
                disabled={isRefreshing}
                aria-label="Refresh market data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <TabsContent value="gainers">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {marketData.gainers.slice(0, 12).map((stock) => (
                <StockCard key={stock.symbol} stock={stock} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="losers">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {marketData.losers.slice(0, 12).map((stock) => (
                <StockCard key={stock.symbol} stock={stock} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {marketData.mostActive.slice(0, 12).map((stock) => (
                <StockCard key={stock.symbol} stock={stock} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="foreign">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {marketData.foreignBuy.slice(0, 12).map((stock) => (
                <StockCard key={stock.symbol} stock={stock} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>Data dari datasaham.io API. Bukan rekomendasi investasi.</p>
        </div>
      </footer>
    </div>
  );
}
