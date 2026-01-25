'use client';

import { useState, useCallback, useMemo } from 'react';
import { BrokerSummary } from '@/lib/datasaham-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpRight, RefreshCw, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BrokerSummaryClientProps {
  initialSymbol: string;
  initialData: BrokerSummary[];
  initialFrom: string;
  initialTo: string;
}

const ranges = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

function formatNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString('id-ID');
}

function formatPrice(value?: number): string {
  if (!value || Number.isNaN(value)) return '-';
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

export function BrokerSummaryClient({
  initialSymbol,
  initialData,
  initialFrom,
  initialTo,
}: BrokerSummaryClientProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [range, setRange] = useState(30);
  const [brokers, setBrokers] = useState<BrokerSummary[]>(initialData);
  const [period, setPeriod] = useState({ from: initialFrom, to: initialTo });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const holdings = useMemo(
    () => brokers.filter((b) => b.net_volume > 0).sort((a, b) => b.net_volume - a.net_volume),
    [brokers]
  );

  const fetchData = useCallback(
    async (targetSymbol?: string, targetRange?: number, customRange?: { from?: string; to?: string }) => {
      const sym = (targetSymbol || symbol).trim().toUpperCase();
      const days = targetRange ?? range;
      const from = customRange?.from;
      const to = customRange?.to;
      if (!sym) return;
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (!from || !to) params.set('days', String(days));
        const res = await fetch(`/api/broker-summary/${sym}?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Gagal memuat data broker');
        const payload = await res.json();
        setBrokers(Array.isArray(payload.data) ? payload.data : []);
        setPeriod({ from: payload.from, to: payload.to });
      } catch (e) {
        console.error(e);
        setError('Gagal memuat data broker');
        setBrokers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [range, symbol]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(symbol, range, { from: period.from, to: period.to });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Broker Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1fr,1fr,auto] md:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Kode Saham</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Contoh: BBCA"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Dari</label>
                <Input
                  type="date"
                  value={period.from}
                  onChange={(e) => setPeriod((prev) => ({ ...prev, from: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Sampai</label>
                <Input
                  type="date"
                  value={period.to}
                  onChange={(e) => setPeriod((prev) => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1">
                {ranges.map((r) => (
                  <Button
                    key={r.days}
                    type="button"
                    variant={range === r.days ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-3 text-[10px] uppercase tracking-[0.2em]"
                    onClick={() => {
                      setRange(r.days);
                      fetchData(symbol, r.days);
                    }}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
              <Button type="submit" size="sm" variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </form>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Periode: {period.from} s/d {period.to}</span>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> {holdings.length} broker masih pegang
            </Badge>
          </div>
          {error && <p className="text-sm text-bearish">{error}</p>}
          {holdings.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">Tidak ada broker yang masih net buy pada periode ini.</p>
          )}
          {holdings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr className="text-left">
                    <th className="px-3 py-2">Broker</th>
                    <th className="px-3 py-2">Lot Tersisa (Net)</th>
                    <th className="px-3 py-2">Net Value</th>
                    <th className="px-3 py-2">Avg Buy</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((b) => (
                    <tr key={b.broker_code} className="border-b border-border">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{b.broker_type || 'Lokal'}</Badge>
                          <span className="font-semibold">{b.broker_code}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono">{formatNumber(b.net_volume)}</td>
                      <td className="px-3 py-2 font-mono">{formatNumber(b.net_value)}</td>
                      <td className="px-3 py-2 font-mono">{formatPrice(b.buy_avg_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
