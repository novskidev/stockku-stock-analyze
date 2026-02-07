'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Network, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CorrelationData } from '@/lib/datasaham-api';

const PERIOD_OPTIONS = [7, 14, 30, 60, 90, 180, 365];

const strengthStyles: Record<string, string> = {
  STRONG_POSITIVE: 'border-bullish/40 bg-bullish/10 text-bullish',
  MODERATE_POSITIVE: 'border-bullish/30 bg-bullish/5 text-bullish',
  WEAK: 'border-border/60 bg-muted/40 text-muted-foreground',
  MODERATE_NEGATIVE: 'border-bearish/30 bg-bearish/5 text-bearish',
  STRONG_NEGATIVE: 'border-bearish/40 bg-bearish/10 text-bearish',
};

function parseSymbols(input: string): string[] {
  return input
    .split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
}

function uniqueSymbols(symbols: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const symbol of symbols) {
    if (!seen.has(symbol)) {
      seen.add(symbol);
      unique.push(symbol);
    }
  }
  return unique;
}

function formatCorrelation(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  return value.toFixed(3);
}

function correlationTone(value: number) {
  if (value >= 0.7) return 'strong-positive';
  if (value >= 0.3) return 'moderate-positive';
  if (value > -0.3) return 'weak';
  if (value > -0.7) return 'moderate-negative';
  return 'strong-negative';
}

function correlationClass(value: number) {
  const tone = correlationTone(value);
  if (tone === 'strong-positive') return 'text-bullish bg-bullish/10';
  if (tone === 'moderate-positive') return 'text-bullish/90 bg-bullish/5';
  if (tone === 'weak') return 'text-muted-foreground bg-muted/30';
  if (tone === 'moderate-negative') return 'text-bearish/90 bg-bearish/5';
  return 'text-bearish bg-bearish/10';
}

function strengthBadgeClass(strength?: string) {
  if (!strength) return 'border-border/60 text-muted-foreground';
  return strengthStyles[strength] ?? 'border-border/60 text-muted-foreground';
}

interface CorrelationMatrixClientProps {
  initialSymbols?: string[];
  initialPeriodDays?: number;
}

export function CorrelationMatrixClient({
  initialSymbols = ['BBCA', 'BBRI', 'BMRI', 'TLKM'],
  initialPeriodDays = 30,
}: CorrelationMatrixClientProps) {
  const [symbolsInput, setSymbolsInput] = useState(initialSymbols.join(','));
  const [periodDays, setPeriodDays] = useState(String(initialPeriodDays));
  const [data, setData] = useState<CorrelationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const parsedSymbols = useMemo(() => uniqueSymbols(parseSymbols(symbolsInput)), [symbolsInput]);

  const fetchCorrelation = useCallback(async () => {
    if (parsedSymbols.length < 2) {
      setError('Masukkan minimal 2 emiten (pisahkan dengan koma).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('symbols', parsedSymbols.join(','));
      if (periodDays) params.set('period_days', periodDays);

      const res = await fetch(`/api/correlation?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to fetch correlation');
      }
      const payload = await res.json();
      setData(payload.data || null);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengambil data korelasi.';
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [parsedSymbols, periodDays]);

  useEffect(() => {
    fetchCorrelation();
  }, [fetchCorrelation]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          eyebrow="Portfolio Insights"
          title="Correlation Matrix Calculator"
          description="Hitung korelasi harga antar emiten untuk diversifikasi portofolio dan manajemen risiko."
          icon={<Network className="h-6 w-6 text-primary" />}
          meta={
            data ? (
              <>
                <span>Symbols: {data.symbols.length}</span>
                <span>Period: {data.period_days} hari</span>
                <span>Analisis: {new Date(data.analysis_date).toLocaleDateString('id-ID')}</span>
              </>
            ) : null
          }
          actions={
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={fetchCorrelation} disabled={isLoading}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isLoading ? 'animate-spin' : '')} />
                Refresh
              </Button>
            </>
          }
          className="mb-6"
        />

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Parameter Kalkulasi</CardTitle>
            <p className="text-sm text-muted-foreground">
              Masukkan simbol saham dipisahkan koma, lalu pilih periode hari.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Symbols
                </label>
                <Input
                  value={symbolsInput}
                  onChange={(event) => setSymbolsInput(event.target.value)}
                  placeholder="Contoh: BBCA,BBRI,BMRI,TLKM"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') fetchCorrelation();
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Parsed: {parsedSymbols.length > 0 ? parsedSymbols.join(', ') : '-'}
                </p>
              </div>
              <div className="w-full md:w-44 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Period Days
                </label>
                <Select value={periodDays} onValueChange={setPeriodDays}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hari" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option} hari
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchCorrelation} disabled={isLoading} className="w-full md:w-auto md:self-end">
                Hitung Korelasi
              </Button>
            </div>
            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Correlation Values</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>1.0</span>
                <span>Perfect positive correlation</span>
              </div>
              <div className="flex items-center justify-between">
                <span>0.0</span>
                <span>No correlation</span>
              </div>
              <div className="flex items-center justify-between">
                <span>-1.0</span>
                <span>Perfect negative correlation</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Correlation Strength</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-bullish">{'>= 0.7'}</span>
                <span className="text-muted-foreground">STRONG_POSITIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-bullish">0.3 to 0.7</span>
                <span className="text-muted-foreground">MODERATE_POSITIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">-0.3 to 0.3</span>
                <span className="text-muted-foreground">WEAK</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-bearish">-0.7 to -0.3</span>
                <span className="text-muted-foreground">MODERATE_NEGATIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-bearish">{'<= -0.7'}</span>
                <span className="text-muted-foreground">STRONG_NEGATIVE</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <span>Portfolio diversification analysis</span>
            <span>Identify hedging opportunities</span>
            <span>Sector correlation analysis</span>
            <span>Risk management</span>
          </CardContent>
        </Card>

        {data ? (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle>Correlation Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-lg border border-border">
                  <Table className="min-w-[520px]">
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="sticky left-0 z-10 bg-muted/60">Symbol</TableHead>
                        {data.symbols.map((symbol) => (
                          <TableHead key={symbol} className="text-center">
                            {symbol}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.symbols.map((rowSymbol, rowIndex) => (
                        <TableRow key={rowSymbol}>
                          <TableCell className="sticky left-0 z-10 bg-card/95 font-semibold">
                            {rowSymbol}
                          </TableCell>
                          {data.matrix[rowIndex]?.map((value, colIndex) => (
                            <TableCell
                              key={`${rowSymbol}-${data.symbols[colIndex]}`}
                              className={cn('text-center text-sm font-medium', correlationClass(value))}
                            >
                              {formatCorrelation(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>All Unique Pairs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto rounded-lg border border-border">
                    <Table className="min-w-[640px]">
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Pair</TableHead>
                          <TableHead className="text-center">Correlation</TableHead>
                          <TableHead>Strength</TableHead>
                          <TableHead>Interpretation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.pairs.map((pair) => (
                          <TableRow key={`${pair.symbol_a}-${pair.symbol_b}`}>
                            <TableCell className="font-semibold">
                              {pair.symbol_a} - {pair.symbol_b}
                            </TableCell>
                            <TableCell className="text-center">
                              {formatCorrelation(pair.correlation)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={strengthBadgeClass(pair.strength)}>
                                {pair.strength}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pair.interpretation}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pairs</span>
                    <span className="font-semibold">{data.pairs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Highly correlated</span>
                    <span className="font-semibold">{data.insights.highly_correlated.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Inversely correlated</span>
                    <span className="font-semibold">{data.insights.inversely_correlated.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Uncorrelated</span>
                    <span className="font-semibold">{data.insights.uncorrelated.length}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      Period
                    </p>
                    <Badge variant="outline">{data.period_days} hari</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Highly Correlated</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.insights.highly_correlated.length === 0 ? (
                    <p className="text-muted-foreground">Tidak ada pasangan.</p>
                  ) : (
                    data.insights.highly_correlated.map((pair) => (
                      <div key={`${pair.symbol_a}-${pair.symbol_b}`} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {pair.symbol_a} - {pair.symbol_b}
                          </span>
                          <Badge variant="outline" className={strengthBadgeClass(pair.strength)}>
                            {formatCorrelation(pair.correlation)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{pair.interpretation}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inversely Correlated</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.insights.inversely_correlated.length === 0 ? (
                    <p className="text-muted-foreground">Tidak ada pasangan.</p>
                  ) : (
                    data.insights.inversely_correlated.map((pair) => (
                      <div key={`${pair.symbol_a}-${pair.symbol_b}`} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {pair.symbol_a} - {pair.symbol_b}
                          </span>
                          <Badge variant="outline" className={strengthBadgeClass(pair.strength)}>
                            {formatCorrelation(pair.correlation)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{pair.interpretation}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Uncorrelated</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.insights.uncorrelated.length === 0 ? (
                    <p className="text-muted-foreground">Tidak ada pasangan.</p>
                  ) : (
                    data.insights.uncorrelated.map((pair) => (
                      <div key={`${pair.symbol_a}-${pair.symbol_b}`} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {pair.symbol_a} - {pair.symbol_b}
                          </span>
                          <Badge variant="outline" className={strengthBadgeClass(pair.strength)}>
                            {formatCorrelation(pair.correlation)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{pair.interpretation}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Per-Symbol Analysis</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {data.symbol_analysis.map((entry) => (
                  <div key={entry.symbol} className="rounded-xl border border-border/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg">{entry.symbol}</p>
                      <Badge variant="outline">Avg: {formatCorrelation(entry.avg_correlation)}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Most: {entry.most_correlated} · Least: {entry.least_correlated}
                    </div>
                    <div className="space-y-2">
                      {entry.correlations.map((item) => (
                        <div key={`${entry.symbol}-${item.symbol}`} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.symbol}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formatCorrelation(item.value)}</span>
                            <Badge variant="outline" className={strengthBadgeClass(item.strength)}>
                              {item.strength}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trading Implications & Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {data.trading_implications.length === 0 ? (
                  <p>Tidak ada rekomendasi.</p>
                ) : (
                  data.trading_implications.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-lg border border-border/60 p-3">
                      {item}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
