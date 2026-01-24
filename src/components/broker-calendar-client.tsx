'use client';

import { useCallback, useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const monthValue = (date: Date) => format(date, 'yyyy-MM');
const dayKey = (date: Date) => format(date, 'yyyy-MM-dd');

type DaySnapshot = {
  netLot: number | null;
  buyAvgPrice: number | null;
  buyVolume: number | null;
};

type DayMap = Record<string, DaySnapshot>;

type BrokerCalendarClientProps = {
  defaultBroker?: string;
  defaultSymbol?: string;
};

function formatLot(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString('id-ID');
}

function formatPrice(value?: number): string {
  if (!value || Number.isNaN(value)) return '-';
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

type MonthlySummary = {
  totalNetLot: number;
  totalWeightedBuy: number;
  totalBuyVolume: number;
  missingDays: number;
};

export function BrokerCalendarClient({
  defaultBroker = '',
  defaultSymbol = 'BBCA',
}: BrokerCalendarClientProps) {
  const [brokerCode, setBrokerCode] = useState(defaultBroker);
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [month, setMonth] = useState(() => new Date());
  const [dayStats, setDayStats] = useState<DayMap>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [summary, setSummary] = useState<MonthlySummary>({
    totalNetLot: 0,
    totalWeightedBuy: 0,
    totalBuyVolume: 0,
    missingDays: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthDates = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  }, [month]);

  const fetchCalendar = useCallback(async () => {
    const broker = brokerCode.trim().toUpperCase();
    const stock = symbol.trim().toUpperCase();

    if (!broker || !stock) {
      setError('Masukkan kode broker dan kode saham terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDayStats({});
    setSelectedDate(undefined);
    setSummary({ totalNetLot: 0, totalWeightedBuy: 0, totalBuyVolume: 0, missingDays: 0 });

    const tradingDays = monthDates.filter((d) => !isWeekend(d));

    try {
      const results = await Promise.all(
        tradingDays.map(async (date) => {
          const dateStr = dayKey(date);
          try {
            const res = await fetch(`/api/broker-summary/${stock}?from=${dateStr}&to=${dateStr}`,
              { cache: 'no-store' }
            );
            if (!res.ok) throw new Error('Gagal memuat data');
            const payload = await res.json();
            const brokers = Array.isArray(payload.data) ? payload.data : [];
            const match = brokers.find(
              (b: { broker_code?: string }) => String(b.broker_code || '').toUpperCase() === broker
            );
            const netLot = match ? Number(match.net_volume) : 0;
            const buyAvgPrice = match ? Number(match.buy_avg_price) : 0;
            const buyVolume = match ? Number(match.buy_volume) : 0;
            return { dateStr, netLot, buyAvgPrice, buyVolume };
          } catch {
            return { dateStr, netLot: null, buyAvgPrice: 0, buyVolume: 0 };
          }
        })
      );

      const nextMap: DayMap = {};
      let totalNetLot = 0;
      let totalWeightedBuy = 0;
      let totalBuyVolume = 0;
      let missingDays = 0;

      for (const result of results) {
        nextMap[result.dateStr] = {
          netLot: result.netLot,
          buyAvgPrice: result.buyAvgPrice,
          buyVolume: result.buyVolume,
        };
        if (result.netLot === null) {
          missingDays += 1;
        } else {
          totalNetLot += result.netLot;
          if (result.buyVolume > 0 && result.buyAvgPrice > 0) {
            totalWeightedBuy += result.buyAvgPrice * result.buyVolume;
            totalBuyVolume += result.buyVolume;
          }
        }
      }
      setDayStats(nextMap);
      setSummary({ totalNetLot, totalWeightedBuy, totalBuyVolume, missingDays });
    } catch (err) {
      console.error(err);
      setError('Gagal memuat kalender broker.');
    } finally {
      setIsLoading(false);
    }
  }, [brokerCode, symbol, monthDates]);

  const handleMonthInput = (value: string) => {
    if (!value) return;
    const [year, monthIndex] = value.split('-').map((part) => Number(part));
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return;
    setMonth(new Date(year, monthIndex - 1, 1));
  };

  const positiveDates = useMemo(
    () => Object.entries(dayStats)
      .filter(([, value]) => value.netLot !== null && value.netLot > 0)
      .map(([dateStr]) => new Date(`${dateStr}T00:00:00`)),
    [dayStats]
  );

  const negativeDates = useMemo(
    () => Object.entries(dayStats)
      .filter(([, value]) => value.netLot !== null && value.netLot < 0)
      .map(([dateStr]) => new Date(`${dateStr}T00:00:00`)),
    [dayStats]
  );

  const avgBuy = summary.totalBuyVolume > 0 ? summary.totalWeightedBuy / summary.totalBuyVolume : undefined;
  const netTone =
    summary.totalNetLot > 0
      ? 'text-emerald-700'
      : summary.totalNetLot < 0
        ? 'text-rose-700'
        : 'text-muted-foreground';
  const selectedKey = selectedDate ? dayKey(selectedDate) : undefined;
  const selectedStats = selectedKey ? dayStats[selectedKey] : undefined;
  const hasSelectedStats = Boolean(selectedStats && selectedStats.netLot !== null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Broker Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              fetchCalendar();
            }}
            className="grid gap-3 md:grid-cols-[1fr,1fr,auto,auto] md:items-end"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Kode Broker</label>
              <Input
                value={brokerCode}
                onChange={(event) => setBrokerCode(event.target.value.toUpperCase())}
                placeholder="Contoh: YP"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Kode Saham</label>
              <Input
                value={symbol}
                onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                placeholder="Contoh: BBCA"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Bulan</label>
              <Input
                type="month"
                value={monthValue(month)}
                onChange={(event) => handleMonthInput(event.target.value)}
              />
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700">Net Buy</Badge>
            <Badge variant="outline" className="bg-rose-500/15 text-rose-700">Net Sell</Badge>
            <span>Menampilkan net lot per hari pada bulan terpilih.</span>
          </div>

          {error && <p className="text-sm text-bearish">{error}</p>}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-md border border-border p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={month}
                onMonthChange={setMonth}
                modifiers={{ positive: positiveDates, negative: negativeDates }}
                modifiersClassNames={{
                  positive: 'bg-emerald-500/15 text-emerald-700',
                  negative: 'bg-rose-500/15 text-rose-700',
                }}
                components={{
                  DayButton: (props) => {
                    const dateStr = dayKey(props.day.date);
                    const net = dayStats[dateStr]?.netLot;
                    const isOutside = props.modifiers.outside;
                    const tone =
                      net !== null && net !== undefined && net !== 0
                        ? net > 0
                          ? 'bg-emerald-500/15 text-emerald-700'
                          : 'bg-rose-500/15 text-rose-700'
                      : '';
                    const netLabel =
                      net !== null && net !== undefined && !isOutside ? formatLot(net) : '';

                    return (
                      <CalendarDayButton
                        {...props}
                        className={cn('h-14 justify-center', tone)}
                      >
                        <span className="text-xs font-medium">{props.day.date.getDate()}</span>
                        {netLabel ? (
                          <span className="text-[10px] font-mono leading-none opacity-80">
                            {netLabel}
                          </span>
                        ) : null}
                      </CalendarDayButton>
                    );
                  },
                }}
              />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ringkasan Bulan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Net Lot</span>
                  <span className={cn('font-mono font-semibold', netTone)}>
                    {formatLot(summary.totalNetLot)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg Buy</span>
                  <span className="font-mono font-semibold">
                    {formatPrice(avgBuy)}
                  </span>
                </div>
                <div className="rounded-md border border-border p-3 text-xs">
                  <p className="font-semibold text-muted-foreground">Detail Harian</p>
                  {!selectedDate && (
                    <p className="mt-2 text-muted-foreground">Klik tanggal untuk melihat detail.</p>
                  )}
                  {selectedDate && !hasSelectedStats && (
                    <p className="mt-2 text-muted-foreground">
                      Data tidak tersedia untuk {selectedKey}.
                    </p>
                  )}
                  {selectedDate && hasSelectedStats && selectedStats && (
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tanggal</span>
                        <span className="font-mono">{selectedKey}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Net Lot</span>
                        <span className={cn('font-mono font-semibold', selectedStats.netLot && selectedStats.netLot > 0 ? 'text-emerald-700' : selectedStats.netLot && selectedStats.netLot < 0 ? 'text-rose-700' : 'text-muted-foreground')}>
                          {formatLot(selectedStats.netLot ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Avg Buy</span>
                        <span className="font-mono font-semibold">
                          {formatPrice(selectedStats.buyAvgPrice ?? undefined)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {summary.missingDays > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {summary.missingDays} hari gagal dimuat.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
