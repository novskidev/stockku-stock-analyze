'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Flame, RefreshCw, ArrowUpRight, Activity, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingItem } from '@/lib/datasaham-api';
import { Button } from '@/components/ui/button';

interface TrendingClientProps {
  initialData: TrendingItem[];
}

export function TrendingClient({ initialData }: TrendingClientProps) {
  const [trending, setTrending] = useState<TrendingItem[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/trending', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch trending');
      const payload = await res.json();
      setTrending(Array.isArray(payload.data) ? payload.data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10">
              <Flame className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trending Stocks</h1>
              <p className="text-sm text-muted-foreground">Stockbit paling ramai dibicarakan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Update: {lastUpdated.toLocaleTimeString('id-ID')}
              </span>
            )}
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={refresh}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Badge>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </div>
        </header>

        {trending.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Tidak ada data trending saat ini.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trending.map((item, idx) => (
              <Link key={`${item.symbol}-${idx}`} href={`/stock/${item.symbol}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{idx + 1}</Badge>
                        <span className="font-bold text-lg">{item.symbol}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-[240px]">
                        {item.name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {item.score !== undefined && (
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Score {item.score.toFixed(1)}
                          </span>
                        )}
                        {item.mentions !== undefined && (
                          <span>{item.mentions} mentions</span>
                        )}
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
