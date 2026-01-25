'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Flame, RefreshCw, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingItem } from '@/lib/datasaham-api';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkline } from '@/components/sparkline';

interface TrendingClientProps {
  initialData: TrendingItem[];
}

export function TrendingClient({ initialData }: TrendingClientProps) {
  const [trending, setTrending] = useState<TrendingItem[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sparklineMap, setSparklineMap] = useState<Record<string, number[]>>({});
  const sparklineLoading = useRef(new Set<string>());

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

  useEffect(() => {
    const symbols = trending.slice(0, 12).map((item) => item.symbol);
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
  }, [trending, sparklineMap]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PageHeader
          eyebrow="Social Heat"
          title="Trending Stocks"
          description="Stockbit paling ramai dibicarakan"
          icon={<Flame className="h-6 w-6 text-primary" />}
          meta={
            lastUpdated ? (
              <span>Update: {lastUpdated.toLocaleTimeString('id-ID')}</span>
            ) : null
          }
          actions={
            <>
              <Link href="/">
                <Button variant="ghost" size="icon" aria-label="Back">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Badge variant="outline" className="cursor-pointer" onClick={refresh}>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Badge>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </>
          }
          className="mb-6"
        />

        {trending.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Tidak ada data trending saat ini.
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Mentions</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trending.slice(0, 25).map((item, idx) => (
                    <TableRow key={`${item.symbol}-${idx}`}>
                      <TableCell className="text-muted-foreground">#{idx + 1}</TableCell>
                      <TableCell>
                        <Link href={`/stock/${item.symbol}`} className="font-semibold hover:text-primary">
                          {item.symbol}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-muted-foreground">
                        {item.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.score !== undefined ? item.score.toFixed(1) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {item.mentions !== undefined ? item.mentions : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Sparkline values={sparklineMap[item.symbol] || []} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
