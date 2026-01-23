'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, TrendingDown, Activity, Users, ArrowUpRight, ArrowDownRight, LineChart, Zap, Target, Shield, Rocket, RefreshCw, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TopMover } from '@/lib/datasaham-api';
import Link from 'next/link';

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
  const [marketData, setMarketData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">StockAnalyzer</h1>
            <p className="text-sm text-muted-foreground">Cari saham cepat dan lihat pergerakan pasar</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari saham (contoh: BBCA, TLKM)..."
              className="pl-10 bg-secondary"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <Link
                    key={result.id}
                    href={`/stock/${result.name}`}
                    className="flex items-center justify-between p-3 hover:bg-accent transition-colors"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
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
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
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
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                <div className="flex gap-2">
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
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Data dari datasaham.io API. Bukan rekomendasi investasi.</p>
        </div>
      </footer>
    </div>
  );
}
