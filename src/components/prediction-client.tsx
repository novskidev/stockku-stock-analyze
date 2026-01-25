'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RefreshCw, Activity } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Progress } from '@/components/ui/progress';

interface PredictionReason {
  label: string;
  impact: number;
}

interface PredictionResponse {
  symbol: string;
  score: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reasons: PredictionReason[];
  inputs: {
    whale?: Record<string, unknown>;
    sentiment?: Record<string, unknown>;
    info?: Record<string, unknown>;
  };
}

interface PredictionClientProps {
  defaultSymbol: string;
}

function toneClass(signal: string) {
  if (signal === 'BULLISH') return 'text-bullish';
  if (signal === 'BEARISH') return 'text-bearish';
  return 'text-muted-foreground';
}

function formatNumber(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString('id-ID');
}

export function PredictionClient({ defaultSymbol }: PredictionClientProps) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [minLot, setMinLot] = useState(500);
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrediction = useCallback(async (sym?: string, lot?: number) => {
    const s = (sym || symbol).trim().toUpperCase();
    if (!s) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (lot !== undefined) params.append('min_lot', String(lot));
      const res = await fetch(`/api/predictions/${s}?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch prediction');
      const payload = await res.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchPrediction(defaultSymbol, minLot);
  }, [defaultSymbol, fetchPrediction, minLot]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PageHeader
          eyebrow="Quant Signal"
          title="Prediksi Saham (Heuristik)"
          description="Menggabungkan whale, sentimen, dan harga"
          icon={<Activity className="h-6 w-6 text-primary" />}
          actions={
            <>
              <Link href="/">
                <Button variant="ghost" size="icon" aria-label="Back">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => fetchPrediction(symbol, minLot)} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </>
          }
          className="mb-6"
        />

        <Card>
          <CardHeader className="flex flex-col gap-3">
            <CardTitle>Input</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Symbol (contoh: BBCA)"
                className="w-32"
              />
              <Input
                type="number"
                value={minLot}
                onChange={(e) => setMinLot(Number(e.target.value) || 0)}
                placeholder="Min lot whale"
                className="w-32"
              />
              <Button onClick={() => fetchPrediction(symbol, minLot)} disabled={isLoading}>
                Prediksi
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data ? (
              <>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{data.symbol}</Badge>
                  <Badge className={toneClass(data.signal)}>{data.signal}</Badge>
                  <span className="text-lg font-bold">Score: {data.score.toFixed(0)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Signal Strength</span>
                    <span>{Math.max(0, Math.min(100, data.score)).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, data.score))} className="h-2" />
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {data.reasons.map((r, idx) => (
                    <Badge key={idx} variant="outline" className={r.impact >= 0 ? 'text-bullish' : 'text-bearish'}>
                      {r.label} ({r.impact >= 0 ? '+' : ''}{r.impact})
                    </Badge>
                  ))}
                  {data.reasons.length === 0 && <span className="text-muted-foreground text-sm">Tidak ada alasan.</span>}
                </div>
                <Separator />
                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Whale Net Flow</p>
                    <p className={((data.inputs?.whale?.activity_summary || data.inputs?.whale?.summary)?.net_whale_flow || 0) >= 0 ? 'text-bullish font-semibold' : 'text-bearish font-semibold'}>
                      {formatNumber((data.inputs?.whale?.activity_summary || data.inputs?.whale?.summary)?.net_whale_flow)}
                    </p>
                    <p className="text-xs text-muted-foreground">Dominant: {(data.inputs?.whale?.activity_summary || data.inputs?.whale?.summary)?.dominant_action || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bandar Status</p>
                    <p className="font-semibold">{data.inputs?.sentiment?.bandar_sentiment?.status || '-'}</p>
                    <p className="text-xs text-muted-foreground">Retail Status: {data.inputs?.sentiment?.retail_sentiment?.status || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Harga</p>
                    <p className="font-semibold">{formatNumber(data.inputs?.info?.last)}</p>
                    <p className={data.inputs?.info?.change_percentage >= 0 ? 'text-bullish text-xs' : 'text-bearish text-xs'}>
                      {data.inputs?.info?.change_percentage >= 0 ? '+' : ''}{data.inputs?.info?.change_percentage?.toFixed(2) ?? '-'}%
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
