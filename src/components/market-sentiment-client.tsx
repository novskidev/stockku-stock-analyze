'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Search, ArrowLeft } from 'lucide-react';
import { MarketSentiment, BandarTopBroker } from '@/lib/datasaham-api';
import Link from 'next/link';

interface MarketSentimentClientProps {
  initialSymbol: string;
  initialSentiment: MarketSentiment | null;
}

function formatPercent(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  return `${value.toFixed(2)}%`;
}

function sentimentTone(status?: string) {
  if (!status) return 'neutral';
  if (status.includes('EUPHORIC') || status.includes('BULLISH') || status.includes('ACCUMULAT')) return 'bullish';
  if (status.includes('PANIC') || status.includes('BEAR') || status.includes('EXIT') || status.includes('DISTRIB')) return 'bearish';
  return 'neutral';
}

function toneClass(tone: string) {
  if (tone === 'bullish') return 'text-bullish';
  if (tone === 'bearish') return 'text-bearish';
  return 'text-neutral';
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function formatNumber(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString('id-ID');
}

function TopBrokerList({ title, brokers }: { title: string; brokers?: BandarTopBroker[] }) {
  if (!brokers || brokers.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {brokers.slice(0, 5).map((b, idx) => (
          <div key={`${b.code}-${idx}`} className="rounded border border-border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{b.code}</span>
              <Badge variant="outline">{b.type}</Badge>
            </div>
            <MetricRow label="Net value" value={b.net_value_formatted || formatNumber(b.net_value)} />
            {b.net_lot !== undefined && <MetricRow label="Net lot" value={formatNumber(b.net_lot)} />}
            {b.avg_price !== undefined && <MetricRow label="Avg price" value={formatNumber(b.avg_price)} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketSentimentClient({ initialSymbol, initialSentiment }: MarketSentimentClientProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(initialSentiment);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSentiment = useCallback(async (targetSymbol?: string) => {
    const sym = (targetSymbol || symbol || '').trim().toUpperCase();
    if (!sym) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sentiment/${sym}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch sentiment');
      const payload = await res.json();
      setSentiment(payload.data || null);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
      setSentiment(null);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchSentiment(initialSymbol);
  }, [initialSymbol, fetchSentiment]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Market Sentiment</h1>
            <p className="text-sm text-muted-foreground">Sentimen ritel vs bandar per saham</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <Button variant="outline" size="sm" onClick={() => fetchSentiment()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle>Retail vs Bandar Sentiment</CardTitle>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="Symbol (contoh: BBCA)"
                  className="w-48"
                />
                <Button onClick={() => fetchSentiment()} disabled={isLoading}>
                  Cari
                </Button>
              </div>
            </div>
            {sentiment?.divergence?.type && (
              <Badge variant="outline" className={toneClass(sentimentTone(sentiment.divergence.type))}>
                {sentiment.divergence.type.replace(/_/g, ' ')}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!sentiment ? (
              <p className="text-sm text-muted-foreground">Data tidak tersedia.</p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Sentimen Ritel</p>
                      {sentiment.retail_sentiment?.status && (
                        <Badge className={toneClass(sentimentTone(sentiment.retail_sentiment.status))}>
                          {sentiment.retail_sentiment.status.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                    <MetricRow label="Score" value={sentiment.retail_sentiment?.score?.toFixed(1) || '-'} />
                    <MetricRow label="Frequency score" value={sentiment.retail_sentiment?.indicators?.frequency_score?.toFixed(2) || '-'} />
                    <MetricRow label="Small lot %" value={formatPercent(sentiment.retail_sentiment?.indicators?.small_lot_percentage)} />
                    <MetricRow label="FOMO score" value={sentiment.retail_sentiment?.indicators?.fomo_score?.toFixed(2) || '-'} />
                    <MetricRow label="Volume participation" value={formatPercent(sentiment.retail_sentiment?.indicators?.volume_participation)} />
                    {sentiment.retail_sentiment?.danger_level && (
                      <MetricRow label="Danger level" value={sentiment.retail_sentiment.danger_level} />
                    )}
                  </div>

                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Sentimen Bandar</p>
                      {sentiment.bandar_sentiment?.status && (
                        <Badge className={toneClass(sentimentTone(sentiment.bandar_sentiment.status))}>
                          {sentiment.bandar_sentiment.status.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                    <MetricRow label="Score" value={sentiment.bandar_sentiment?.score?.toFixed(1) || '-'} />
                    <MetricRow label="Top broker net flow" value={formatNumber(sentiment.bandar_sentiment?.indicators?.top_broker_net_flow)} />
                    <MetricRow label="Large lot %" value={formatPercent(sentiment.bandar_sentiment?.indicators?.large_lot_percentage)} />
                    <MetricRow label="Accumulation score" value={sentiment.bandar_sentiment?.indicators?.accumulation_score?.toFixed(2) || '-'} />
                    <MetricRow label="Foreign flow" value={formatNumber(sentiment.bandar_sentiment?.indicators?.foreign_flow)} />
                    <MetricRow label="Institutional flow" value={formatNumber(sentiment.bandar_sentiment?.indicators?.institutional_flow)} />
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Divergence</p>
                    <p className={`text-lg font-semibold ${toneClass(sentimentTone(sentiment.divergence?.type))}`}>
                      {sentiment.divergence?.warning || sentiment.divergence?.type?.replace(/_/g, ' ') || 'Netral'}
                    </p>
                    {sentiment.divergence?.recommendation && (
                      <p className="text-xs text-muted-foreground">Rekomendasi: {sentiment.divergence.recommendation}</p>
                    )}
                    {sentiment.divergence?.historical_outcome && (
                      <p className="text-xs text-muted-foreground">Outcome historis: {sentiment.divergence.historical_outcome}</p>
                    )}
                  </div>
                  {sentiment.summary && (
                    <p className="text-sm text-muted-foreground sm:text-right max-w-xl">{sentiment.summary}</p>
                  )}
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <TopBrokerList title="Top Buyers" brokers={sentiment.bandar_sentiment?.top_brokers?.buyers} />
                  <TopBrokerList title="Top Sellers" brokers={sentiment.bandar_sentiment?.top_brokers?.sellers} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
