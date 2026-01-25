'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { ArrowLeft, Activity, RefreshCw, Shield } from 'lucide-react';
import { WhaleTransactionsApiResponse } from '@/lib/datasaham-api';
import { PageHeader } from '@/components/page-header';

interface WhaleTransactionsClientProps {
  initialSymbol: string;
  initialResponse: WhaleTransactionsApiResponse | null;
}

function formatNumber(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString('id-ID');
}

function toneClass(action?: string) {
  if (!action) return 'text-neutral';
  if (action.includes('ACCUM')) return 'text-bullish';
  if (action.includes('DISTRIB') || action.includes('EXIT')) return 'text-bearish';
  return 'text-neutral';
}

function formatValueFormatted(raw?: number, formatted?: string) {
  if (formatted) return formatted;
  return formatNumber(raw);
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID');
}

export function WhaleTransactionsClient({ initialSymbol, initialResponse }: WhaleTransactionsClientProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [minLot, setMinLot] = useState(500);
  const [response, setResponse] = useState<WhaleTransactionsApiResponse | null>(initialResponse);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async (sym?: string, lot?: number) => {
    const targetSymbol = (sym || symbol).trim().toUpperCase();
    if (!targetSymbol) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (lot !== undefined) params.append('min_lot', String(lot));
      const res = await fetch(`/api/whale-transactions/${targetSymbol}?${params.toString()}`, { cache: 'no-store' });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setResponse(payload || null);
        return;
      }
      setResponse(payload || null);
    } catch (error) {
      console.error(error);
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData(initialSymbol, minLot);
  }, [fetchData, initialSymbol, minLot]);

  const data = response?.data ?? null;
  const summary = data?.activity_summary || data?.summary;
  const prediction = data?.prediction;
  const topWhaleBrokers = data?.top_whale_brokers || [];
  const recentTx = data?.recent_whale_transactions || [];
  const statusLabel = response?.success === true ? 'SUCCESS' : response?.success === false ? 'FAILED' : '-';
  const statusTone = response?.success === true ? 'text-bullish' : response?.success === false ? 'text-bearish' : 'text-muted-foreground';
  const responseMessage = response?.message || response?.error || '-';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PageHeader
          eyebrow="Institutional Flow"
          title="Whale Transaction Detector"
          description="Deteksi transaksi jumbo (institusi) dan alirannya"
          icon={<Activity className="h-6 w-6 text-primary" />}
          actions={
            <>
              <Link href="/">
                <Button variant="ghost" size="icon" aria-label="Back">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => fetchData(symbol, minLot)} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </>
          }
          className="mb-6 reveal-up"
        />

        <Card className="glass-card reveal-up reveal-delay-1">
          <CardHeader className="flex flex-col gap-3">
            <CardTitle>Cari Emiten</CardTitle>
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
                placeholder="Min lot (misal 500)"
                className="w-36"
              />
              <Button onClick={() => fetchData(symbol, minLot)} disabled={isLoading}>
                Deteksi
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline" className={statusTone}>
                {statusLabel}
              </Badge>
              <span className="text-muted-foreground">{responseMessage}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Symbol</p>
                <p className="font-semibold">{data?.symbol || symbol}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Analysis Date</p>
                <p className="font-semibold">{formatDate(data?.analysis_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Price</p>
                <p className="font-semibold">{formatNumber(data?.current_price)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Min Lot</p>
                <p className="font-semibold">{formatNumber(data?.min_lot ?? minLot)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Whale threshold:</span>
              <Badge variant="outline">{data?.whale_threshold?.description || '-'}</Badge>
              {data?.whale_threshold?.lot && (
                <Badge variant="outline">Lot ≥ {formatNumber(data.whale_threshold.lot)}</Badge>
              )}
              {data?.whale_threshold?.value && (
                <Badge variant="outline">Value ≥ {formatNumber(data.whale_threshold.value)}</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total Buy</p>
                <p className="font-semibold text-bullish">{formatNumber(summary?.total_whale_buy_value)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sell</p>
                <p className="font-semibold text-bearish">{formatNumber(summary?.total_whale_sell_value)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net Flow</p>
                <p className={`font-semibold ${summary?.net_whale_flow && summary.net_whale_flow >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                  {formatValueFormatted(summary?.net_whale_flow, summary?.net_whale_flow_formatted)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dominant</p>
                <p className={`font-semibold ${toneClass(summary?.dominant_action)}`}>{summary?.dominant_action || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Buy Count</p>
                <p className="font-semibold">{formatNumber(summary?.whale_buy_count)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sell Count</p>
                <p className="font-semibold">{formatNumber(summary?.whale_sell_count)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span>Intensity: {summary?.whale_intensity || '-'}</span>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold mb-2">Top Whale Brokers</p>
                <div className="space-y-2">
                  {topWhaleBrokers.slice(0, 10).map((b, idx) => (
                    <div key={`${b.broker_code || b.code}-${idx}`} className="rounded-xl border border-border/60 bg-card/60 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{b.broker_code || b.code}</span>
                        <Badge variant="outline">{b.broker_type || b.type || 'Broker'}</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Net: {formatValueFormatted(b.net_value, b.net_value_formatted)} | Lot: {formatNumber(b.net_lot)}
                        {' '}| Avg: {formatNumber(b.avg_price)} | Tx: {formatNumber(b.transaction_count)}
                      </p>
                      <p className={`text-xs ${toneClass(b.action)}`}>Action: {b.action || '-'}</p>
                      {b.whale_score !== undefined && <p className="text-xs">Score: {b.whale_score.toFixed(1)}</p>}
                    </div>
                  ))}
                  {topWhaleBrokers.length === 0 && (
                    <p className="text-xs text-muted-foreground">Tidak ada data.</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold mb-2">Recent Whale Transactions</p>
                {recentTx.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tidak ada data.</p>
                ) : (
                  <div className="space-y-3">
                    {recentTx.slice(0, 10).map((tx, idx) => (
                      <div key={`${tx.time}-${idx}`} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className={`h-2.5 w-2.5 rounded-full ${toneClass(tx.action || '') === 'text-bullish' ? 'bg-bullish' : toneClass(tx.action || '') === 'text-bearish' ? 'bg-bearish' : 'bg-neutral'}`} />
                          {idx < recentTx.slice(0, 10).length - 1 && (
                            <span className="mt-1 h-full w-px bg-border/60" />
                          )}
                        </div>
                        <div className="flex-1 rounded-xl border border-border/60 bg-card/60 p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{tx.time}</span>
                            <Badge variant="outline" className={toneClass(tx.action || '')}>
                              {tx.action || '-'}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-muted-foreground">
                            <span>Lot: {formatNumber(tx.lot)}</span>
                            <span>Price: {formatNumber(tx.price)}</span>
                            <span>Value: {formatValueFormatted(tx.value, tx.value_formatted)}</span>
                            <span>Board: {tx.market_board || '-'}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline">Impact {tx.impact_estimate || '-'}</Badge>
                            <Badge variant="outline">{tx.whale_type || '-'}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold">Prediction</p>
              <p className={`text-lg font-semibold ${toneClass(prediction?.short_term_direction || prediction?.direction)}`}>
                {prediction?.short_term_direction || prediction?.direction || '-'}
              </p>
              <p className="text-sm text-muted-foreground">
                Confidence: {prediction?.confidence !== undefined ? `${prediction.confidence.toFixed(0)}%` : '-'}
              </p>
              {prediction?.confidence !== undefined && (
                <Progress value={Math.max(0, Math.min(100, prediction.confidence))} className="h-2" />
              )}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {(prediction?.reasoning || []).map((r, idx) => (
                  <Badge key={idx} variant="outline">{r}</Badge>
                ))}
                {(!prediction?.reasoning || prediction.reasoning.length === 0) && <span>-</span>}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold">Alerts</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {(data?.alerts || []).map((a, idx) => (
                  <Badge key={idx} variant="outline">{a}</Badge>
                ))}
                {(!data?.alerts || data.alerts.length === 0) && <span className="text-muted-foreground text-xs">Tidak ada alert.</span>}
              </div>
            </div>
            <Separator />
            <details className="rounded border border-border p-3 text-xs">
              <summary className="cursor-pointer font-semibold">Raw API Response (lengkap)</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {response ? JSON.stringify(response, null, 2) : '-'}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
