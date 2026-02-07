'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Activity, Users, BarChart3, 
  Shield, Zap, Target, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Info, Building, DollarSign, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StockProfile, BrokerSummary, TopMover, BandarAnalysis, BandarPumpDump, ChartTimeframe, MarketSentiment, StockInfoDetail, Orderbook, HistoricalSummary, SeasonalityPoint, SubsidiaryData, KeyStats, HoldingComposition, ForeignOwnership, InsiderTransaction, InsightsData, InsightItem, TechnicalAnalysis } from '@/lib/datasaham-api';
import { 
  OHLCV, calculateTechnicalSummary, TechnicalSignal 
} from '@/lib/technical-analysis';
import { analyzeFundamentals, FundamentalSummary } from '@/lib/fundamental-analysis';
import { analyzeBrokerSummary, BandarmologySummary } from '@/lib/bandarmology-analysis';
import { predictPriceMovement } from '@/lib/quant-analysis';

interface StockAnalysisClientProps {
  symbol: string;
  profile: StockProfile | null;
  brokerSummary: BrokerSummary[];
  stockQuote: TopMover | null;
  bandarAnalysis: BandarAnalysis;
  sentiment: MarketSentiment | null;
  info: StockInfoDetail | null;
  orderbook: Orderbook | null;
  historicalSummary: HistoricalSummary | null;
  seasonality: SeasonalityPoint[];
  subsidiary: SubsidiaryData | null;
  keyStats: KeyStats | null;
  insights: InsightsData | null;
  technicalAnalysis: TechnicalAnalysis | null;
  foreignOwnership: ForeignOwnership[];
  holdingComposition: HoldingComposition[];
  insider: InsiderTransaction[];
}

function SignalBadge({ signal }: { signal: 'bullish' | 'bearish' | 'neutral' }) {
  if (signal === 'bullish') {
    return <Badge className="bg-bullish/20 text-bullish border-bullish/30">Bullish</Badge>;
  }
  if (signal === 'bearish') {
    return <Badge className="bg-bearish/20 text-bearish border-bearish/30">Bearish</Badge>;
  }
  return <Badge className="bg-neutral/20 text-neutral border-neutral/30">Neutral</Badge>;
}

function OverallSignalCard({ 
  title, 
  signal, 
  confidence, 
  icon: Icon 
}: { 
  title: string; 
  signal: string; 
  confidence: number; 
  icon: React.ElementType;
}) {
  const normalized = signal.toLowerCase();
  const isPositive = normalized.includes('buy') || normalized.includes('bull') || normalized.includes('accumulation') || normalized === 'excellent' || normalized === 'good';
  const isNegative = normalized.includes('sell') || normalized.includes('bear') || normalized.includes('distribution') || normalized === 'poor' || normalized === 'weak';
  
  const colorClass = isPositive ? 'text-bullish' : isNegative ? 'text-bearish' : 'text-neutral';
  const bgClass = isPositive ? 'bg-bullish/10' : isNegative ? 'bg-bearish/10' : 'bg-neutral/10';
  
  return (
    <Card className={bgClass}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${colorClass}`} />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-lg font-bold ${colorClass} capitalize`}>
              {signal.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{confidence.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Confidence</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TechnicalIndicatorRow({ signal }: { signal: TechnicalSignal }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="font-medium">{signal.indicator}</p>
        <p className="text-xs text-muted-foreground">{signal.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={signal.strength * 100} className="w-20 h-2" />
        <SignalBadge signal={signal.signal} />
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1e12) return `Rp ${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `Rp ${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `Rp ${(value / 1e6).toFixed(2)}M`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString('id-ID');
}

function formatPrice(price: number): string {
  return price.toLocaleString('id-ID');
}

function formatSignedPercent(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  const sign = value > 0 ? '+' : '';
  const display = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${sign}${display}%`;
}

function formatNegativePercent(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  const display = Number.isInteger(value) ? Math.abs(value).toString() : Math.abs(value).toFixed(1);
  return `-${display}%`;
}

function isDistributionStatus(status?: string) {
  return (status || '').toUpperCase().includes('DISTRIBUTION');
}

function formatStatusLabel(value?: string) {
  if (!value) return '-';
  return value.replace(/_/g, ' ');
}

function formatPercentageString(value?: string) {
  if (!value) return '-';
  return value.includes('%') ? value : `${value}%`;
}

function parseNumberFromString(value?: string) {
  if (!value) return 0;
  const normalized = value.replace(/,/g, '').trim();
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
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

function normalizeSignalTone(value?: string): 'bullish' | 'bearish' | 'neutral' {
  if (!value) return 'neutral';
  const normalized = value.toLowerCase();
  if (
    normalized.includes('buy') ||
    normalized.includes('bull') ||
    normalized.includes('accum') ||
    normalized.includes('up') ||
    normalized.includes('strong') ||
    normalized.includes('excellent') ||
    normalized.includes('good')
  ) {
    return 'bullish';
  }
  if (
    normalized.includes('sell') ||
    normalized.includes('bear') ||
    normalized.includes('down') ||
    normalized.includes('weak') ||
    normalized.includes('poor') ||
    normalized.includes('distrib') ||
    normalized.includes('exit')
  ) {
    return 'bearish';
  }
  return 'neutral';
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}

function parseKeyStatsValue(raw?: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-') return null;

  let negative = false;
  let value = trimmed;
  if (value.startsWith('(') && value.endsWith(')')) {
    negative = true;
    value = value.slice(1, -1);
  }

  value = value.replace(/,/g, '').replace(/\s+/g, ' ').trim();

  const percent = value.endsWith('%');
  if (percent) {
    value = value.replace('%', '').trim();
  }

  const match = value.match(/^(-?\d+(?:\.\d+)?)(?:\s*([KMBT]))?/i);
  if (!match) return null;

  let numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return null;

  const unit = match[2]?.toUpperCase();
  if (unit === 'K') numeric *= 1e3;
  if (unit === 'M') numeric *= 1e6;
  if (unit === 'B') numeric *= 1e9;
  if (unit === 'T') numeric *= 1e12;

  if (negative) numeric *= -1;
  return numeric;
}

function insightStatusClass(status?: string) {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'good') return 'bg-bullish/10 text-bullish border-bullish/30';
  if (normalized === 'bad') return 'bg-bearish/10 text-bearish border-bearish/30';
  if (normalized === 'neutral') return 'bg-neutral/10 text-neutral border-neutral/30';
  return 'bg-muted/50 text-muted-foreground border-border';
}

function summarizeInsightStatuses(items: InsightItem[]) {
  return items.reduce(
    (acc, item) => {
      const status = (item.status || '').toLowerCase();
      if (status === 'good') acc.good += 1;
      else if (status === 'bad') acc.bad += 1;
      else if (status === 'neutral') acc.neutral += 1;
      else acc.na += 1;
      return acc;
    },
    { good: 0, bad: 0, neutral: 0, na: 0 }
  );
}

function normalizeSignal(value?: string) {
  return (value || '').toLowerCase();
}

function mapTechnicalSignal(value?: string): 'bullish' | 'bearish' | 'neutral' {
  const normalized = normalizeSignal(value);
  if (!normalized) return 'neutral';
  if (normalized.includes('bullish') || normalized.includes('buy') || normalized === 'above') return 'bullish';
  if (normalized.includes('bearish') || normalized.includes('sell') || normalized === 'below') return 'bearish';
  if (normalized.includes('oversold')) return 'bullish';
  if (normalized.includes('overbought')) return 'bearish';
  return 'neutral';
}

function signalStrength(value?: string) {
  const normalized = normalizeSignal(value);
  if (normalized.includes('strong')) return 0.9;
  if (normalized.includes('overbought') || normalized.includes('oversold')) return 0.75;
  if (normalized.includes('bull') || normalized.includes('bear')) return 0.7;
  if (normalized.includes('neutral') || normalized.includes('sideways')) return 0.4;
  return 0.5;
}

const TECHNICAL_TIMEFRAMES = [
  { value: 'daily', label: 'Daily' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
] as const;

const TECHNICAL_PERIODS = [20, 50, 100, 200] as const;

type TechnicalTimeframe = typeof TECHNICAL_TIMEFRAMES[number]['value'];
type TechnicalPeriod = typeof TECHNICAL_PERIODS[number];
type PumpDumpDays = 7 | 14 | 30;

function isTechnicalTimeframe(value?: string): value is TechnicalTimeframe {
  return TECHNICAL_TIMEFRAMES.some(option => option.value === value);
}

function pumpDumpTone(status?: string) {
  const normalized = normalizeSignal(status);
  if (normalized.includes('low') || normalized.includes('safe')) return 'bullish';
  if (normalized.includes('medium') || normalized.includes('warning')) return 'warning';
  if (normalized.includes('high') || normalized.includes('danger') || normalized.includes('pump') || normalized.includes('dump')) return 'bearish';
  return 'neutral';
}

export function StockAnalysisClient({
  symbol,
  profile,
  brokerSummary,
  stockQuote,
  bandarAnalysis,
  sentiment,
  info,
  orderbook,
  historicalSummary,
  seasonality,
  subsidiary,
  keyStats,
  insights,
  technicalAnalysis,
  foreignOwnership,
  holdingComposition,
  insider,
}: StockAnalysisClientProps) {
  const [chartData, setChartData] = useState<OHLCV[]>([]);
  const [liveSentiment, setLiveSentiment] = useState<MarketSentiment | null>(sentiment);
  const [isSentimentLoading, setIsSentimentLoading] = useState(false);
  const [sentimentUpdatedAt, setSentimentUpdatedAt] = useState<Date | null>(null);
  const [liveTechnical, setLiveTechnical] = useState<TechnicalAnalysis | null>(technicalAnalysis);
  const [technicalTimeframe, setTechnicalTimeframe] = useState<TechnicalTimeframe>(() => {
    const timeframe = technicalAnalysis?.timeframe;
    return isTechnicalTimeframe(timeframe) ? timeframe : 'daily';
  });
  const [technicalPeriod, setTechnicalPeriod] = useState<TechnicalPeriod>(20);
  const [isTechnicalLoading, setIsTechnicalLoading] = useState(false);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [pumpDumpDays, setPumpDumpDays] = useState<PumpDumpDays>(7);
  const [livePumpDump, setLivePumpDump] = useState<BandarPumpDump | null>(bandarAnalysis.pumpDump);
  const [isPumpDumpLoading, setIsPumpDumpLoading] = useState(false);
  const [pumpDumpError, setPumpDumpError] = useState<string | null>(null);
  const hasBandarmologyData = Boolean(
    bandarAnalysis.accumulation || bandarAnalysis.distribution || bandarAnalysis.smartMoney || livePumpDump
  );

  const fetchChartData = useCallback(async (tf: ChartTimeframe = 'daily') => {
    try {
      const query = new URLSearchParams({ limit: '0' });
      const response = await fetch(`/api/chart/${symbol}/${tf}?${query.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch chart');
      }
      const payload = await response.json();
      const candles: OHLCV[] = Array.isArray(payload.data) ? payload.data : [];
      const sorted = [...candles].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setChartData(sorted);
    } catch (error) {
      console.error(error);
      setChartData([]);
    }
  }, [symbol]);

  const refreshSentiment = useCallback(async () => {
    setIsSentimentLoading(true);
    try {
      const response = await fetch(`/api/sentiment/${symbol}?days=0`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch sentiment');
      }
      const payload = await response.json();
      setLiveSentiment(payload.data || null);
      setSentimentUpdatedAt(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setIsSentimentLoading(false);
    }
  }, [symbol]);

  const fetchTechnical = useCallback(async (timeframe = technicalTimeframe, period = technicalPeriod) => {
    setIsTechnicalLoading(true);
    setTechnicalError(null);
    try {
      const query = new URLSearchParams({
        timeframe,
        period: String(period),
        indicator: 'all',
      });
      const response = await fetch(`/api/technical/${symbol}?${query.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || 'Failed to fetch technical analysis';
        throw new Error(message);
      }
      const payload = await response.json();
      setLiveTechnical(payload.data || null);
    } catch (error) {
      console.error(error);
      setTechnicalError(error instanceof Error ? error.message : 'Failed to fetch technical analysis');
    } finally {
      setIsTechnicalLoading(false);
    }
  }, [symbol, technicalPeriod, technicalTimeframe]);

  const fetchPumpDump = useCallback(async (days = pumpDumpDays) => {
    setIsPumpDumpLoading(true);
    setPumpDumpError(null);
    try {
      const query = new URLSearchParams({ days: String(days) });
      const response = await fetch(`/api/bandarmology/pump-dump/${symbol}?${query.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || 'Failed to fetch pump-dump analysis';
        throw new Error(message);
      }
      const payload = await response.json();
      setLivePumpDump(payload.data || null);
    } catch (error) {
      console.error(error);
      setPumpDumpError(error instanceof Error ? error.message : 'Failed to fetch pump-dump analysis');
    } finally {
      setIsPumpDumpLoading(false);
    }
  }, [pumpDumpDays, symbol]);

  useEffect(() => {
    fetchChartData('daily');
  }, [fetchChartData]);

  useEffect(() => {
    refreshSentiment();
    const interval = setInterval(refreshSentiment, 30000);
    return () => clearInterval(interval);
  }, [refreshSentiment]);

  useEffect(() => {
    fetchTechnical();
  }, [fetchTechnical, technicalTimeframe, technicalPeriod]);

  useEffect(() => {
    fetchPumpDump();
  }, [fetchPumpDump]);

  useEffect(() => {
    setLiveTechnical(technicalAnalysis);
    const timeframe = technicalAnalysis?.timeframe;
    setTechnicalTimeframe(isTechnicalTimeframe(timeframe) ? timeframe : 'daily');
    setTechnicalPeriod(20);
    setLivePumpDump(bandarAnalysis.pumpDump);
    setPumpDumpDays(7);
  }, [technicalAnalysis, bandarAnalysis.pumpDump, symbol]);

  const currentPrice = stockQuote?.last_price || 0;
  const infoPrice = info?.last || currentPrice;
  const priceChange = info?.change ?? stockQuote?.change ?? 0;
  const priceChangePercent = info?.change_percentage ?? stockQuote?.change_percentage ?? 0;
  
  const priceSeries = chartData;
  
  const technicalSummary = useMemo(() => calculateTechnicalSummary(priceSeries), [priceSeries]);
  
  const fundamentalSummary = useMemo(() => {
    const map = new Map<string, string>();
    if (keyStats?.closure_fin_items_results) {
      keyStats.closure_fin_items_results.forEach(group => {
        group.fin_name_results.forEach(item => {
          if (item.fitem?.name) {
            map.set(item.fitem.name, item.fitem.value ?? '');
          }
        });
      });
    }

    const pickValue = (names: string[]) => {
      for (const name of names) {
        const value = map.get(name);
        if (value !== undefined && value !== '') return value;
      }
      return null;
    };

    const per = parseKeyStatsValue(pickValue(['Current PE Ratio (TTM)', 'Current PE Ratio (Annualised)']) ?? undefined);
    const pbv = parseKeyStatsValue(pickValue(['Current Price to Book Value']) ?? undefined);
    const roe = parseKeyStatsValue(pickValue(['Return on Equity (TTM)']) ?? undefined);
    const debtToEquity = parseKeyStatsValue(
      pickValue(['Debt to Equity Ratio (Quarter)', 'LT Debt/Equity (Quarter)', 'Total Liabilities/Equity (Quarter)']) ?? undefined
    );
    const netMargin = parseKeyStatsValue(
      pickValue(['Net Profit Margin (Quarter)', 'Net Profit Margin (TTM)']) ?? undefined
    );
    const earningsGrowth = parseKeyStatsValue(pickValue(['Net Income (Quarter YoY Growth)']) ?? undefined);
    const revenueGrowth = parseKeyStatsValue(pickValue(['Revenue (Quarter YoY Growth)']) ?? undefined);
    const dividendYield = parseKeyStatsValue(pickValue(['Dividend Yield']) ?? undefined);

    return analyzeFundamentals({
      per,
      pbv,
      roe,
      debtToEquity,
      dividendYield,
      netMargin,
      earningsGrowth,
      revenueGrowth,
      marketCap: info?.market_cap ?? null,
    });
  }, [info?.market_cap, keyStats]);
  
  const bandarmologySummary = useMemo(() => 
    brokerSummary.length > 0 ? analyzeBrokerSummary(brokerSummary) : null
  , [brokerSummary]);
  
  const prediction = useMemo(() => 
    predictPriceMovement(priceSeries, technicalSummary, fundamentalSummary, bandarmologySummary)
  , [priceSeries, technicalSummary, fundamentalSummary, bandarmologySummary]);

  const technicalData = liveTechnical;
  const technicalSignal = technicalData?.signal?.action
    ? technicalData.signal.action.toLowerCase()
    : technicalSummary.overallSignal;
  const technicalConfidence = technicalData?.signal?.confidence ?? technicalSummary.confidence;

  const consensus = useMemo(() => {
    const signals = [
      normalizeSignalTone(technicalSignal),
      normalizeSignalTone(fundamentalSummary.overallRating),
      normalizeSignalTone(bandarmologySummary?.overallSignal),
      prediction.direction === 'up' ? 'bullish' : prediction.direction === 'down' ? 'bearish' : 'neutral',
    ];
    const tally = { bullish: 0, bearish: 0, neutral: 0 };
    signals.forEach((tone) => {
      tally[tone] += 1;
    });
    const major =
      tally.bullish >= tally.bearish && tally.bullish >= tally.neutral
        ? 'bullish'
        : tally.bearish >= tally.neutral
          ? 'bearish'
          : 'neutral';
    return { tally, major };
  }, [technicalSignal, fundamentalSummary.overallRating, bandarmologySummary?.overallSignal, prediction.direction]);

  const technicalSignals = useMemo(() => {
    if (!technicalData) return technicalSummary.signals;
    const indicators = technicalData.indicators;
    const signals: TechnicalSignal[] = [];

    if (technicalData.trend?.overallTrend) {
      const trendLabel = technicalData.trend.overallTrend;
      const description = [
        technicalData.trend.shortTerm && `Short: ${technicalData.trend.shortTerm}`,
        technicalData.trend.mediumTerm && `Medium: ${technicalData.trend.mediumTerm}`,
        technicalData.trend.longTerm && `Long: ${technicalData.trend.longTerm}`,
      ]
        .filter(Boolean)
        .join(' • ');
      signals.push({
        indicator: 'Trend',
        signal: mapTechnicalSignal(trendLabel),
        strength: signalStrength(trendLabel),
        description: description || trendLabel,
      });
    }

    if (indicators?.rsi) {
      const label = indicators.rsi.signal || 'NEUTRAL';
      const valueText = indicators.rsi.value !== undefined && indicators.rsi.value !== null ? indicators.rsi.value.toFixed(2) : '-';
      signals.push({
        indicator: `RSI (${indicators.rsi.period || 14})`,
        signal: mapTechnicalSignal(label),
        strength: signalStrength(label),
        description: `RSI ${valueText} • ${label}`,
      });
    }

    if (indicators?.macd) {
      const label = indicators.macd.signal || 'NEUTRAL';
      const histogramText = indicators.macd.histogram !== null && indicators.macd.histogram !== undefined
        ? indicators.macd.histogram.toFixed(2)
        : '-';
      signals.push({
        indicator: 'MACD',
        signal: mapTechnicalSignal(label),
        strength: signalStrength(label),
        description: `Histogram ${histogramText} • ${label}`,
      });
    }

    if (indicators?.stochastic) {
      const label = indicators.stochastic.signal || 'NEUTRAL';
      const kValue = indicators.stochastic.k !== null && indicators.stochastic.k !== undefined
        ? indicators.stochastic.k.toFixed(2)
        : '-';
      const dValue = indicators.stochastic.d !== null && indicators.stochastic.d !== undefined
        ? indicators.stochastic.d.toFixed(2)
        : '-';
      signals.push({
        indicator: 'Stochastic',
        signal: mapTechnicalSignal(label),
        strength: signalStrength(label),
        description: `%K ${kValue} • %D ${dValue} • ${label}`,
      });
    }

    if (indicators?.bollingerBands) {
      const label = indicators.bollingerBands.signal || 'NEUTRAL';
      const percentB = indicators.bollingerBands.percentB !== null && indicators.bollingerBands.percentB !== undefined
        ? indicators.bollingerBands.percentB.toFixed(2)
        : '-';
      signals.push({
        indicator: 'Bollinger Bands',
        signal: mapTechnicalSignal(label),
        strength: signalStrength(label),
        description: `%B ${percentB} • ${label}`,
      });
    }

    if (indicators?.obv) {
      const label = indicators.obv.trend || 'NEUTRAL';
      signals.push({
        indicator: 'OBV',
        signal: mapTechnicalSignal(label),
        strength: signalStrength(label),
        description: `Trend ${label}`,
      });
    }

    if (indicators?.vwap) {
      const label = indicators.vwap.signal || 'NEUTRAL';
      signals.push({
        indicator: 'VWAP',
        signal: mapTechnicalSignal(label),
        strength: signalStrength(label),
        description: `Price ${label} VWAP`,
      });
    }

    return signals.length > 0 ? signals : technicalSummary.signals;
  }, [technicalData, technicalSummary.signals]);

  const technicalMetrics = useMemo(() => {
    if (!technicalData?.indicators) return null;
    const indicators = technicalData.indicators;
    const smaMap: Record<number, number | null | undefined> = {
      20: indicators.sma?.sma20,
      50: indicators.sma?.sma50,
      100: indicators.sma?.sma100,
      200: indicators.sma?.sma200,
    };
    const emaMap: Record<number, number | null | undefined> = {
      20: indicators.ema?.ema20,
      50: indicators.ema?.ema50,
      100: indicators.ema?.ema100,
      200: indicators.ema?.ema200,
    };

    return {
      rsi: indicators.rsi?.value ?? null,
      macd: indicators.macd?.histogram ?? indicators.macd?.macdLine ?? null,
      sma: smaMap[technicalPeriod] ?? null,
      ema: emaMap[technicalPeriod] ?? null,
      stochastic: indicators.stochastic?.k ?? null,
      atr: indicators.atr?.value ?? null,
      atrPercent: indicators.atr?.percentage ?? null,
      lastPrice: technicalData.lastPrice ?? null,
      lastUpdate: technicalData.lastUpdate,
      dataPoints: technicalData.dataPoints,
    };
  }, [technicalData, technicalPeriod]);

  const keyStatsMap = useMemo(() => {
    if (!keyStats?.closure_fin_items_results) return null;
    const map = new Map<string, string>();
    keyStats.closure_fin_items_results.forEach(group => {
      group.fin_name_results.forEach(item => {
        if (item.fitem?.name) {
          map.set(item.fitem.name, item.fitem.value ?? '');
        }
      });
    });
    return map;
  }, [keyStats]);

  const getKeyStatValue = useCallback((names: string[]) => {
    if (!keyStatsMap) return null;
    for (const name of names) {
      const value = keyStatsMap.get(name);
      if (value !== undefined && value !== '') return value;
    }
    return null;
  }, [keyStatsMap]);

  const keyStatsGroups = useMemo(() => keyStats?.closure_fin_items_results ?? [], [keyStats]);

  const subsidiaries = useMemo(() => subsidiary?.subsidiaries ?? [], [subsidiary]);
  const hasSubsidiary = subsidiaries.length > 0;
  const topSubsidiaries = useMemo(() => subsidiaries.slice(0, 6), [subsidiaries]);
  const topSubsidiaryAssets = useMemo(() => {
    if (subsidiaries.length === 0) return [];
    return [...subsidiaries]
      .sort((a, b) => parseNumberFromString(b.total_assets) - parseNumberFromString(a.total_assets))
      .slice(0, 3);
  }, [subsidiaries]);


  const insightCategories = useMemo(() => {
    if (!insights?.categories) return [];
    return Object.entries(insights.categories).map(([category, items]) => ({
      category,
      items: items || [],
      counts: summarizeInsightStatuses(items || []),
    }));
  }, [insights]);

  const insightSummary = useMemo(() => {
    if (insights?.summary) return insights.summary;
    if (insightCategories.length === 0) return null;
    const totals = insightCategories.reduce(
      (acc, entry) => ({
        good: acc.good + entry.counts.good,
        bad: acc.bad + entry.counts.bad,
        neutral: acc.neutral + entry.counts.neutral,
        na: acc.na + entry.counts.na,
      }),
      { good: 0, bad: 0, neutral: 0, na: 0 }
    );
    return {
      totalInsights: totals.good + totals.bad + totals.neutral + totals.na,
      good: totals.good,
      bad: totals.bad,
      neutral: totals.neutral,
      score: totals.good - totals.bad,
    };
  }, [insights, insightCategories]);

  const insightHighlights = useMemo(() => {
    if (insightCategories.length === 0) return [];
    const statusRank = (status?: string) => {
      const normalized = (status || '').toLowerCase();
      if (normalized === 'bad') return 3;
      if (normalized === 'good') return 2;
      if (normalized === 'neutral') return 1;
      return 0;
    };
    return insightCategories
      .flatMap(entry => entry.items.map(item => ({ category: entry.category, item })))
      .filter(entry => entry.item.shortStatement || entry.item.statement)
      .sort((a, b) => statusRank(b.item.status) - statusRank(a.item.status))
      .slice(0, 6);
  }, [insightCategories]);

  const insightScore = insightSummary?.score ?? 0;
  const sectionLinks = [
    { id: 'insights', label: 'Insights' },
    { id: 'signals', label: 'Signals' },
    { id: 'overview', label: 'Overview' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold">{symbol}</h1>
                  <Badge variant="outline">IDX</Badge>
                  {stockQuote && (
                    <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                      LIVE
                    </Badge>
                  )}
                </div>
                {stockQuote ? (
                  <p className="text-sm text-muted-foreground">
                    {stockQuote.company_name}
                  </p>
                ) : profile && (
                  <p className="text-sm text-muted-foreground">
                    {profile.background?.substring(0, 100)}...
                  </p>
                )}
              </div>
            </div>
            <div className="w-full md:w-auto md:text-right">
              {stockQuote ? (
                <>
                  <p className="text-2xl font-bold font-mono">{formatPrice(infoPrice || currentPrice)}</p>
                  <div className={`flex items-center justify-start gap-1 md:justify-end ${priceChange >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                    {priceChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span className="font-medium">
                      {priceChange >= 0 ? '+' : ''}{priceChange.toLocaleString('id-ID')} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vol: {formatNumber(info?.volume || stockQuote.volume)} | Val: {formatCurrency(info?.value || stockQuote.value)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs md:justify-end">
                    <Badge variant="outline" className={toneClass(consensus.major)}>
                      Consensus {consensus.major.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">Bull {consensus.tally.bullish}</Badge>
                    <Badge variant="outline">Bear {consensus.tally.bearish}</Badge>
                    <Badge variant="outline">Neutral {consensus.tally.neutral}</Badge>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Data tidak tersedia</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8 sm:px-6 sm:py-8 lg:px-8">
        <nav className="sticky top-20 z-40 overflow-x-auto rounded-full border border-border/60 bg-card/70 p-1 backdrop-blur">
          <div className="flex min-w-max items-center gap-1">
            {sectionLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground hover:bg-secondary/60"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
        <section id="insights" className="scroll-mt-32">
          <Card className="bg-gradient-to-r from-primary/10 to-chart-2/10 border-primary/20 reveal-up">
            <CardContent className="p-6">
              {insights ? (
                <div className="space-y-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-chart-2/20">
                      <Info className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Datasaham Insights</p>
                      <p className="text-2xl font-bold">{insights.displayName || symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        {insights.securityType ? insights.securityType.toUpperCase() : 'INSTRUMENT'}
                        {insights.instrumentId ? ` • ${insights.instrumentId}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {formatDateTime(insights.lastUpdated)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{insightSummary?.totalInsights ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Good</p>
                      <p className="text-xl font-bold text-bullish">{insightSummary?.good ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bad</p>
                      <p className="text-xl font-bold text-bearish">{insightSummary?.bad ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Neutral</p>
                      <p className="text-xl font-bold">{insightSummary?.neutral ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Score</p>
                      <p className={`text-xl font-bold ${
                        insightScore > 0 ? 'text-bullish' : insightScore < 0 ? 'text-bearish' : 'text-neutral'
                      }`}>
                        {insightSummary ? insightScore : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Ringkasan Kategori</p>
                    {insightCategories.length > 0 ? (
                      <div className="space-y-2">
                        {insightCategories.map(entry => (
                          <div key={entry.category} className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{entry.category}</span>
                            <Badge variant="outline" className={`text-xs ${insightStatusClass('good')}`}>
                              Good {entry.counts.good}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${insightStatusClass('bad')}`}>
                              Bad {entry.counts.bad}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${insightStatusClass('neutral')}`}>
                              Neutral {entry.counts.neutral}
                            </Badge>
                            {entry.counts.na > 0 && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                NA {entry.counts.na}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Kategori belum tersedia.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Highlight</p>
                    {insightHighlights.length > 0 ? (
                      <div className="space-y-3">
                        {insightHighlights.map((entry, idx) => (
                          <div key={`${entry.category}-${idx}`} className="flex items-start gap-3">
                            <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                            <Badge variant="outline" className={`text-xs ${insightStatusClass(entry.item.status)}`}>
                              {(entry.item.status || 'NA').toUpperCase()}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {entry.item.shortStatement || entry.item.statement}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Tidak ada highlight.</p>
                    )}
                  </div>
                </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4" />
                  Data insights tidak tersedia.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section id="signals" className="scroll-mt-32">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 reveal-up reveal-delay-1">
            <OverallSignalCard
              title="Technical"
              signal={technicalSignal}
              confidence={technicalConfidence}
              icon={BarChart3}
            />
            <OverallSignalCard
              title="Fundamental"
              signal={fundamentalSummary.overallRating}
              confidence={fundamentalSummary.score}
              icon={Shield}
            />
            <OverallSignalCard
              title="Bandarmology"
              signal={bandarmologySummary?.overallSignal || 'neutral'}
              confidence={bandarmologySummary?.confidence || 50}
              icon={Users}
            />
            <Card className={`${
              prediction.direction === 'up' ? 'bg-bullish/10' :
              prediction.direction === 'down' ? 'bg-bearish/10' : 'bg-neutral/10'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className={`w-8 h-8 ${
                    prediction.direction === 'up' ? 'text-bullish' :
                    prediction.direction === 'down' ? 'text-bearish' : 'text-neutral'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Prediction</p>
                    <p className={`text-lg font-bold capitalize ${
                      prediction.direction === 'up' ? 'text-bullish' :
                      prediction.direction === 'down' ? 'text-bearish' : 'text-neutral'
                    }`}>
                      {prediction.direction === 'up' ? 'Bullish' : 
                       prediction.direction === 'down' ? 'Bearish' : 'Sideways'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{(prediction.probability * 100).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Probability</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="overview" className="scroll-mt-32">
          <div className="grid gap-4 md:grid-cols-2 reveal-up reveal-delay-2">
            <Card>
            <CardHeader>
              <CardTitle>Info & Key Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">Last</p>
                <p className="font-semibold">{infoPrice ? formatPrice(infoPrice) : '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Volume</p>
                <p className="font-semibold">{formatNumber(info?.volume || stockQuote?.volume || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Value</p>
                <p className="font-semibold">{formatCurrency(info?.value || stockQuote?.value || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Market Cap</p>
                <p className="font-semibold">{formatCurrency(info?.market_cap || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">High / Low</p>
                <p className="font-semibold">
                  {info?.high ? formatPrice(info.high) : '-'} / {info?.low ? formatPrice(info.low) : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Sector</p>
                <p className="font-semibold">{info?.sector || '-'}</p>
              </div>
                {keyStats && (
                <>
                  <div>
                    <p className="text-muted-foreground text-xs">PE</p>
                    <p className="font-semibold">
                      {getKeyStatValue(['Current PE Ratio (TTM)', 'Current PE Ratio (Annualised)']) ?? '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">PBV</p>
                    <p className="font-semibold">
                      {getKeyStatValue(['Current Price to Book Value']) ?? '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">ROE</p>
                    <p className="font-semibold">
                      {getKeyStatValue(['Return on Equity (TTM)']) ?? '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Net Margin</p>
                    <p className="font-semibold">
                      {getKeyStatValue(['Net Profit Margin (Quarter)', 'Net Profit Margin (TTM)']) ?? '-'}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
              <CardTitle>Seasonality & Ownership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {hasSubsidiary ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Subsidiaries (latest)</p>
                    <div className="flex flex-wrap gap-2">
                      {topSubsidiaries.map((item, idx) => (
                        <Badge key={`${item.company_name}-${idx}`} variant="outline">
                          {item.company_name}: {formatPercentageString(item.percentage)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="font-semibold">{formatStatusLabel(subsidiary?.last_updated_period)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Currency / Unit</p>
                      <p className="font-semibold">
                        {formatStatusLabel(subsidiary?.currency)} / {formatStatusLabel(subsidiary?.unit)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Top Assets</p>
                    <div className="space-y-2">
                      {topSubsidiaryAssets.map((item, idx) => (
                        <div key={`${item.company_name}-asset-${idx}`} className="flex items-start justify-between gap-2">
                          <span className="text-sm">{item.company_name}</span>
                          <span className="text-sm font-semibold">{item.total_assets}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Seasonality (avg return)</p>
                    <div className="flex flex-wrap gap-2">
                      {seasonality.slice(0, 6).map((s) => (
                        <Badge key={s.month} variant="outline" className={s.average_return >= 0 ? 'text-bullish' : 'text-bearish'}>
                          {s.month}: {s.average_return.toFixed(2)}%
                        </Badge>
                      ))}
                      {seasonality.length === 0 && <p className="text-muted-foreground text-xs">Tidak ada data</p>}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Foreign Ownership (latest)</p>
                    <p className="font-semibold">
                      {foreignOwnership.length > 0 ? `${formatNumber(foreignOwnership[0].ownership)} @ ${foreignOwnership[0].date}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Top Holders</p>
                    <div className="flex flex-wrap gap-2">
                      {holdingComposition.slice(0, 3).map((h, idx) => (
                        <Badge key={`${h.holder}-${idx}`} variant="outline">
                          {h.holder}: {h.percentage.toFixed(2)}%
                        </Badge>
                      ))}
                      {holdingComposition.length === 0 && <p className="text-muted-foreground text-xs">Tidak ada data</p>}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            </Card>
          </div>
        </section>

        <section id="analysis" className="scroll-mt-32">
        <Tabs defaultValue="technical" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
              <TabsTrigger value="technical" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Technical
              </TabsTrigger>
              <TabsTrigger value="fundamental" className="gap-2">
                <Shield className="w-4 h-4" />
                Fundamental
              </TabsTrigger>
              <TabsTrigger value="bandarmology" className="gap-2">
                <Users className="w-4 h-4" />
                Bandarmology
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <Building className="w-4 h-4" />
                Profile
              </TabsTrigger>
            </TabsList>

          <TabsContent value="technical" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Timeframe</span>
                    <Select value={technicalTimeframe} onValueChange={(value) => setTechnicalTimeframe(value as TechnicalTimeframe)}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {TECHNICAL_TIMEFRAMES.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Period</span>
                    <Select value={String(technicalPeriod)} onValueChange={(value) => setTechnicalPeriod(Number(value) as TechnicalPeriod)}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent>
                        {TECHNICAL_PERIODS.map(option => (
                          <SelectItem key={option} value={String(option)}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {isTechnicalLoading ? 'Memuat...' : `Update: ${formatDateTime(technicalMetrics?.lastUpdate)}`}
                  </Badge>
                  {technicalMetrics?.dataPoints !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      Data Points: {technicalMetrics.dataPoints}
                    </Badge>
                  )}
                </div>
                {technicalError && (
                  <span className="text-xs text-bearish">{technicalError}</span>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="reveal-up reveal-delay-3">
                <CardHeader>
                  <CardTitle className="text-lg">Technical Indicators</CardTitle>
                  <CardDescription>{technicalData?.summary?.recommendation || 'Real-time technical analysis signals'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {technicalSignals.map((signal, idx) => (
                    <TechnicalIndicatorRow key={idx} signal={signal} />
                  ))}
                  {technicalSignals.length === 0 && (
                    <p className="text-sm text-muted-foreground">Tidak ada indikator tersedia.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="reveal-up reveal-delay-3">
                <CardHeader>
                  <CardTitle className="text-lg">Key Metrics</CardTitle>
                  <CardDescription>Current indicator values</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">RSI (14)</p>
                      <p className="text-xl font-bold">
                        {technicalMetrics?.rsi !== null && technicalMetrics?.rsi !== undefined
                          ? technicalMetrics.rsi.toFixed(2)
                          : '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">MACD</p>
                      <p className="text-xl font-bold">
                        {technicalMetrics?.macd !== null && technicalMetrics?.macd !== undefined
                          ? technicalMetrics.macd.toFixed(2)
                          : '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">SMA {technicalPeriod}</p>
                      <p className="text-xl font-bold font-mono">
                        {technicalMetrics?.sma !== null && technicalMetrics?.sma !== undefined
                          ? technicalMetrics.sma.toFixed(0)
                          : '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">EMA {technicalPeriod}</p>
                      <p className="text-xl font-bold font-mono">
                        {technicalMetrics?.ema !== null && technicalMetrics?.ema !== undefined
                          ? technicalMetrics.ema.toFixed(0)
                          : '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Stochastic %K</p>
                      <p className="text-xl font-bold">
                        {technicalMetrics?.stochastic !== null && technicalMetrics?.stochastic !== undefined
                          ? technicalMetrics.stochastic.toFixed(2)
                          : '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">ATR</p>
                      <p className="text-xl font-bold">
                        {technicalMetrics?.atr !== null && technicalMetrics?.atr !== undefined
                          ? technicalMetrics.atr.toFixed(2)
                          : '-'}
                      </p>
                      {technicalMetrics?.atrPercent !== null && technicalMetrics?.atrPercent !== undefined && (
                        <p className="text-xs text-muted-foreground">{technicalMetrics.atrPercent.toFixed(2)}%</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Support & Resistance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-bullish mb-2">Resistance Levels</p>
                    {technicalData?.supportResistance?.resistances?.length ? (
                      technicalData.supportResistance.resistances.map((level, idx) => (
                        <div key={`${level.level}-${idx}`} className="flex items-center justify-between py-1">
                          <span className="text-sm text-muted-foreground">R{idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{formatPrice(level.level)}</span>
                            {level.strength && (
                              <span className="text-xs text-muted-foreground">{level.strength}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No resistance levels detected</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-bearish mb-2">Support Levels</p>
                    {technicalData?.supportResistance?.supports?.length ? (
                      technicalData.supportResistance.supports.map((level, idx) => (
                        <div key={`${level.level}-${idx}`} className="flex items-center justify-between py-1">
                          <span className="text-sm text-muted-foreground">S{idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{formatPrice(level.level)}</span>
                            {level.strength && (
                              <span className="text-xs text-muted-foreground">{level.strength}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No support levels detected</p>
                    )}
                  </div>
                </div>
                {technicalData?.supportResistance?.pivotPoint !== null && technicalData?.supportResistance?.pivotPoint !== undefined && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Pivot: <span className="font-mono font-semibold">{formatPrice(technicalData.supportResistance.pivotPoint)}</span>
                  </div>
                )}
                {technicalData?.signal?.reasons && technicalData.signal.reasons.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex flex-wrap gap-2">
                      {technicalData.signal.reasons.map((reason, idx) => (
                        <Badge key={`${reason}-${idx}`} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fundamental" className="space-y-4">
            {keyStatsGroups.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {keyStatsGroups.map((group) => (
                  <Card key={group.keystats_name}>
                    <CardHeader>
                      <CardTitle className="text-lg">{group.keystats_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {group.fin_name_results.map((item) => (
                        <div key={item.fitem.id} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
                          <p className="text-sm text-muted-foreground">{item.fitem.name}</p>
                          <p className="text-sm font-semibold">{item.fitem.value || '-'}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Fundamental Data Unavailable</p>
                  <p className="text-sm text-muted-foreground">Key stats tidak tersedia untuk emiten ini.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bandarmology" className="space-y-4">
              {hasBandarmologyData && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {bandarAnalysis.accumulation && (
                    <Card className={`${
                      bandarAnalysis.accumulation.status === 'ACCUMULATION' ? 'bg-bullish/10 border-bullish/30' :
                      bandarAnalysis.accumulation.status === 'DISTRIBUTION' ? 'bg-bearish/10 border-bearish/30' : 'bg-neutral/10'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5" />
                          <span className="text-sm font-medium">Accumulation</span>
                        </div>
                        <p className={`text-2xl font-bold ${
                          bandarAnalysis.accumulation.status === 'ACCUMULATION' ? 'text-bullish' :
                          bandarAnalysis.accumulation.status === 'DISTRIBUTION' ? 'text-bearish' : ''
                        }`}>
                          {formatStatusLabel(bandarAnalysis.accumulation.status)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Score: {bandarAnalysis.accumulation.accumulation_score}/10 | Confidence: {bandarAnalysis.accumulation.confidence}%
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {bandarAnalysis.distribution && (
                    <Card className={`${
                      isDistributionStatus(bandarAnalysis.distribution.status) ? 'bg-bearish/10 border-bearish/30' : 'bg-neutral/10'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-5 h-5" />
                          <span className="text-sm font-medium">Distribution</span>
                        </div>
                        <p className={`text-2xl font-bold ${
                          isDistributionStatus(bandarAnalysis.distribution.status) ? 'text-bearish' : ''
                        }`}>
                          {formatStatusLabel(bandarAnalysis.distribution.status)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Score: {bandarAnalysis.distribution.distribution_score}/10 | Risk: {bandarAnalysis.distribution.risk_level}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {bandarAnalysis.smartMoney && (
                    <Card className={`${
                      bandarAnalysis.smartMoney.flow_direction === 'INFLOW' ? 'bg-bullish/10 border-bullish/30' :
                      bandarAnalysis.smartMoney.flow_direction === 'OUTFLOW' ? 'bg-bearish/10 border-bearish/30' : 'bg-neutral/10'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-5 h-5" />
                          <span className="text-sm font-medium">Smart Money</span>
                        </div>
                        <p className={`text-2xl font-bold ${
                          bandarAnalysis.smartMoney.flow_direction === 'INFLOW' ? 'text-bullish' :
                          bandarAnalysis.smartMoney.flow_direction === 'OUTFLOW' ? 'text-bearish' : ''
                        }`}>
                          {bandarAnalysis.smartMoney.flow_direction}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Score: {bandarAnalysis.smartMoney.smart_money_score}/10 | {bandarAnalysis.smartMoney.recommendation}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {livePumpDump && (
                    <Card className={`${
                      pumpDumpTone(livePumpDump.status) === 'bullish' ? 'bg-bullish/10 border-bullish/30' :
                      pumpDumpTone(livePumpDump.status) === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      pumpDumpTone(livePumpDump.status) === 'bearish' ? 'bg-bearish/10 border-bearish/30' :
                      'bg-neutral/10 border-border'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="text-sm font-medium">Pump & Dump</span>
                        </div>
                        <p className={`text-2xl font-bold ${
                          pumpDumpTone(livePumpDump.status) === 'bullish' ? 'text-bullish' :
                          pumpDumpTone(livePumpDump.status) === 'warning' ? 'text-yellow-500' :
                          pumpDumpTone(livePumpDump.status) === 'bearish' ? 'text-bearish' : 'text-neutral'
                        }`}>
                          {livePumpDump.status.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Risk Score: {livePumpDump.risk_score} | {livePumpDump.recommendation}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {(bandarAnalysis.accumulation || bandarAnalysis.distribution || bandarAnalysis.smartMoney) && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bandarAnalysis.accumulation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Accumulation Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {formatStatusLabel(bandarAnalysis.accumulation.status)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Confidence: {bandarAnalysis.accumulation.confidence}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Risk: {formatStatusLabel(bandarAnalysis.accumulation.risk_level)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Rec: {formatStatusLabel(bandarAnalysis.accumulation.recommendation)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Top 5 Brokers</p>
                          <div className="flex flex-wrap gap-2">
                            {bandarAnalysis.accumulation.indicators.broker_concentration.top_5_brokers.map((broker, idx) => (
                              <Badge key={idx} variant="outline">{broker}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Concentration</p>
                            <p className="text-lg font-bold">{bandarAnalysis.accumulation.indicators.broker_concentration.concentration_percentage}%</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Total Value</p>
                            <p className="text-lg font-bold">{formatCurrency(bandarAnalysis.accumulation.indicators.broker_concentration.total_value)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Buyers vs Sellers</p>
                            <p className="text-lg font-bold">
                              <span className="text-bullish">{bandarAnalysis.accumulation.indicators.broker_concentration.total_buyer}</span>
                              {' / '}
                              <span className="text-bearish">{bandarAnalysis.accumulation.indicators.broker_concentration.total_seller}</span>
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Acc Days</p>
                            <p className="text-lg font-bold">{bandarAnalysis.accumulation.indicators.accumulation_days} hari</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Net Flow</p>
                            <p className={`text-lg font-bold ${
                              bandarAnalysis.accumulation.indicators.broker_concentration.net_flow < 0 ? 'text-bearish' : 'text-bullish'
                            }`}>
                              {formatCurrency(bandarAnalysis.accumulation.indicators.broker_concentration.net_flow)}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Bandar Status</p>
                            <p className="text-lg font-bold">{bandarAnalysis.accumulation.indicators.broker_concentration.bandar_status}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Avg Volume Increase</p>
                            <p className="text-lg font-bold">
                              {formatSignedPercent(bandarAnalysis.accumulation.indicators.volume_pattern.avg_volume_increase)}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Price Stability</p>
                            <p className="text-lg font-bold">
                              {formatStatusLabel(bandarAnalysis.accumulation.indicators.volume_pattern.price_stability)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="outline"
                            className={
                              bandarAnalysis.accumulation.indicators.broker_concentration.is_suspicious
                                ? 'bg-bearish/10 text-bearish border-bearish/30'
                                : 'bg-neutral/10 text-neutral border-neutral/30'
                            }
                          >
                            {bandarAnalysis.accumulation.indicators.broker_concentration.is_suspicious
                              ? 'Suspicious concentration'
                              : 'Normal concentration'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              bandarAnalysis.accumulation.indicators.volume_pattern.volume_price_divergence
                                ? 'bg-bearish/10 text-bearish border-bearish/30'
                                : 'bg-neutral/10 text-neutral border-neutral/30'
                            }
                          >
                            {bandarAnalysis.accumulation.indicators.volume_pattern.volume_price_divergence
                              ? 'Volume/price divergence'
                              : 'No divergence'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Pattern Score: {bandarAnalysis.accumulation.indicators.volume_pattern.score}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Foreign Flow</p>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="p-3 rounded-lg bg-secondary">
                              <p className="text-xs text-muted-foreground">Net Foreign Flow</p>
                              <p className={`text-lg font-bold ${
                                bandarAnalysis.accumulation.indicators.foreign_flow.net_foreign_flow.includes('-') ? 'text-bearish' : 'text-bullish'
                              }`}>
                                {bandarAnalysis.accumulation.indicators.foreign_flow.net_foreign_flow}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary">
                              <p className="text-xs text-muted-foreground">Consistency Score</p>
                              <p className="text-lg font-bold">{bandarAnalysis.accumulation.indicators.foreign_flow.consistency_score}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary">
                              <p className="text-xs text-muted-foreground">Buy vs Sell Days</p>
                              <p className="text-lg font-bold">
                                <span className="text-bullish">{bandarAnalysis.accumulation.indicators.foreign_flow.buy_days}</span>
                                {' / '}
                                <span className="text-bearish">{bandarAnalysis.accumulation.indicators.foreign_flow.sell_days}</span>
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary">
                              <p className="text-xs text-muted-foreground">Trend</p>
                              <p className="text-lg font-bold">{formatStatusLabel(bandarAnalysis.accumulation.indicators.foreign_flow.trend)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Estimated Acc Value</p>
                            <p className="text-lg font-bold">{bandarAnalysis.accumulation.indicators.estimated_accumulation_value}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Timeframe (S/M/L)</p>
                            <p className="text-sm font-semibold">
                              {formatStatusLabel(bandarAnalysis.accumulation.timeframe_analysis.short_term)} /{' '}
                              {formatStatusLabel(bandarAnalysis.accumulation.timeframe_analysis.medium_term)} /{' '}
                              {formatStatusLabel(bandarAnalysis.accumulation.timeframe_analysis.long_term)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Entry Zone</p>
                          <div className="grid gap-3 rounded-lg bg-secondary p-3 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Ideal Price</p>
                              <p className="font-mono font-bold text-bullish">{formatPrice(bandarAnalysis.accumulation.entry_zone.ideal_price)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Max Price</p>
                              <p className="font-mono font-bold text-yellow-500">{formatPrice(bandarAnalysis.accumulation.entry_zone.max_price)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Current</p>
                              <p className="font-mono font-bold">{formatPrice(bandarAnalysis.accumulation.entry_zone.current_price)}</p>
                            </div>
                          </div>
                        </div>
                        {bandarAnalysis.accumulation.signals?.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Signals</p>
                            <div className="space-y-1">
                              {bandarAnalysis.accumulation.signals.map((signal, idx) => (
                                <p key={idx} className="text-xs bg-secondary p-2 rounded">{signal}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {bandarAnalysis.distribution && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingDown className="w-5 h-5 text-primary" />
                          Distribution Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {formatStatusLabel(bandarAnalysis.distribution.status)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Confidence: {bandarAnalysis.distribution.confidence}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Risk: {bandarAnalysis.distribution.risk_level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Rec: {formatStatusLabel(bandarAnalysis.distribution.recommendation)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Top Brokers Selling</p>
                          <div className="flex flex-wrap gap-2">
                            {bandarAnalysis.distribution.indicators.broker_exit_pattern.top_brokers_selling.map((broker, idx) => (
                              <Badge key={idx} variant="outline">{broker}</Badge>
                            ))}
                            {bandarAnalysis.distribution.indicators.broker_exit_pattern.top_brokers_selling.length === 0 && (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Selling %</p>
                            <p className="text-lg font-bold">{bandarAnalysis.distribution.indicators.broker_exit_pattern.selling_percentage}%</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Days Selling</p>
                            <p className="text-lg font-bold">{bandarAnalysis.distribution.indicators.broker_exit_pattern.days_selling} hari</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Buyers vs Sellers</p>
                            <p className="text-lg font-bold">
                              <span className="text-bullish">{bandarAnalysis.distribution.indicators.broker_exit_pattern.total_buyer}</span>
                              {' / '}
                              <span className="text-bearish">{bandarAnalysis.distribution.indicators.broker_exit_pattern.total_seller}</span>
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Net Flow</p>
                            <p className={`text-lg font-bold ${
                              bandarAnalysis.distribution.indicators.broker_exit_pattern.net_flow < 0 ? 'text-bearish' : 'text-bullish'
                            }`}>
                              {formatCurrency(bandarAnalysis.distribution.indicators.broker_exit_pattern.net_flow)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Price & Volume</p>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="p-3 rounded-lg bg-secondary">
                              <p className="text-xs text-muted-foreground">Price Change</p>
                              <p className={`text-lg font-bold ${
                                bandarAnalysis.distribution.indicators.price_volume_divergence.price_increase < 0 ? 'text-bearish' : 'text-bullish'
                              }`}>
                                {formatSignedPercent(bandarAnalysis.distribution.indicators.price_volume_divergence.price_increase)}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary">
                              <p className="text-xs text-muted-foreground">Volume Change</p>
                              <p className="text-lg font-bold text-bearish">
                                {formatNegativePercent(bandarAnalysis.distribution.indicators.price_volume_divergence.volume_decrease)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              bandarAnalysis.distribution.indicators.price_volume_divergence.divergence_detected
                                ? 'mt-2 bg-bearish/10 text-bearish border-bearish/30'
                                : 'mt-2 bg-neutral/10 text-neutral border-neutral/30'
                            }
                          >
                            {bandarAnalysis.distribution.indicators.price_volume_divergence.divergence_detected
                              ? 'Divergence detected'
                              : 'No divergence'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Foreign Flow</p>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="p-3 rounded-lg bg-secondary">
                              <p className="text-xs text-muted-foreground">Net Foreign Sell</p>
                              <p className="text-lg font-bold text-bearish">
                                {bandarAnalysis.distribution.indicators.foreign_flow.net_foreign_sell}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary">
                              <p className="text-xs text-muted-foreground">Consecutive Sell Days</p>
                              <p className="text-lg font-bold">{bandarAnalysis.distribution.indicators.foreign_flow.consecutive_sell_days} hari</p>
                            </div>
                          </div>
                        </div>
                        {bandarAnalysis.distribution.signals?.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Signals</p>
                            <div className="space-y-1">
                              {bandarAnalysis.distribution.signals.map((signal, idx) => (
                                <p key={idx} className="text-xs bg-secondary p-2 rounded">{signal}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {bandarAnalysis.smartMoney && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-primary" />
                          Smart Money Flow
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {formatStatusLabel(bandarAnalysis.smartMoney.flow_direction)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Score: {bandarAnalysis.smartMoney.smart_money_score}/10
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Confidence: {bandarAnalysis.smartMoney.confidence}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Rec: {formatStatusLabel(bandarAnalysis.smartMoney.recommendation)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Foreign 7D</p>
                            <p className={`text-lg font-bold ${
                              bandarAnalysis.smartMoney.analysis.foreign_investors.trend.includes('BUY') ? 'text-bullish' : 'text-bearish'
                            }`}>
                              {bandarAnalysis.smartMoney.analysis.foreign_investors.net_flow_7d}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Foreign 30D</p>
                            <p className={`text-lg font-bold ${
                              bandarAnalysis.smartMoney.analysis.foreign_investors.trend.includes('BUY') ? 'text-bullish' : 'text-bearish'
                            }`}>
                              {bandarAnalysis.smartMoney.analysis.foreign_investors.net_flow_30d}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Foreign Trend</p>
                            <p className={`text-lg font-bold ${
                              bandarAnalysis.smartMoney.analysis.foreign_investors.trend.includes('BUY') ? 'text-bullish' : 'text-bearish'
                            }`}>
                              {formatStatusLabel(bandarAnalysis.smartMoney.analysis.foreign_investors.trend)}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Consistency</p>
                            <p className="text-lg font-bold">
                              {bandarAnalysis.smartMoney.analysis.foreign_investors.consistency_score}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Institutional Brokers</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {bandarAnalysis.smartMoney.analysis.institutional_brokers.top_institutions.map((inst, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-500/10 text-blue-500">{inst}</Badge>
                            ))}
                          </div>
                          <p className="text-sm">
                            Position: <span className={bandarAnalysis.smartMoney.analysis.institutional_brokers.net_position === 'BUY' ? 'text-bullish' : 'text-bearish'}>
                              {bandarAnalysis.smartMoney.analysis.institutional_brokers.net_position}
                            </span>
                            {' | '}Value: {bandarAnalysis.smartMoney.analysis.institutional_brokers.total_value}
                            {' | '}Avg: {formatPrice(bandarAnalysis.smartMoney.analysis.institutional_brokers.avg_price)}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Insider Buy vs Sell</p>
                            <p className="text-lg font-bold">
                              <span className="text-bullish">{bandarAnalysis.smartMoney.analysis.insider_activity.major_holders_buying}</span>
                              {' / '}
                              <span className="text-bearish">{bandarAnalysis.smartMoney.analysis.insider_activity.major_holders_selling}</span>
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Net Insider Flow</p>
                            <p className={`text-lg font-bold ${
                              bandarAnalysis.smartMoney.analysis.insider_activity.net_insider_flow.includes('-') ? 'text-bearish' : 'text-bullish'
                            }`}>
                              {bandarAnalysis.smartMoney.analysis.insider_activity.net_insider_flow}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            Momentum S: {formatStatusLabel(bandarAnalysis.smartMoney.momentum.short_term)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            M: {formatStatusLabel(bandarAnalysis.smartMoney.momentum.medium_term)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            L: {formatStatusLabel(bandarAnalysis.smartMoney.momentum.long_term)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Insider Activity</p>
                          <div className="space-y-1">
                            {bandarAnalysis.smartMoney.analysis.insider_activity.recent_activity.slice(0, 3).map((activity, idx) => (
                              <p key={idx} className="text-xs bg-secondary p-2 rounded">{activity}</p>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {livePumpDump && (
                <Card>
                  <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Window</span>
                      <Select value={String(pumpDumpDays)} onValueChange={(value) => setPumpDumpDays(Number(value) as PumpDumpDays)}>
                        <SelectTrigger className="w-[90px]">
                          <SelectValue placeholder="Days" />
                        </SelectTrigger>
                        <SelectContent>
                          {[7, 14, 30].map(option => (
                            <SelectItem key={option} value={String(option)}>
                              {option}D
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {isPumpDumpLoading ? 'Memuat...' : `Update: ${formatDateTime(livePumpDump.analysis_date)}`}
                    </Badge>
                    {pumpDumpError && (
                      <span className="text-xs text-bearish">{pumpDumpError}</span>
                    )}
                  </CardContent>
                </Card>
              )}

              {livePumpDump && livePumpDump.warnings.length > 0 && (
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-yellow-500">
                      <AlertTriangle className="w-5 h-5" />
                      Pump & Dump Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {livePumpDump.warnings.map((warning, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded bg-yellow-500/10">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">{warning}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground">Price Surge</p>
                        <p className="text-lg font-bold">{livePumpDump.pump_indicators.price_surge}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground">Volume Surge</p>
                        <p className="text-lg font-bold">{livePumpDump.pump_indicators.volume_surge}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground">Broker Conc.</p>
                        <p className="text-lg font-bold">{livePumpDump.pump_indicators.broker_concentration}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground">Retail FOMO</p>
                        <p className="text-lg font-bold">{livePumpDump.pump_indicators.retail_fomo_score}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!bandarAnalysis.accumulation &&
                !bandarAnalysis.distribution &&
                !bandarAnalysis.smartMoney &&
                !livePumpDump && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No Broker Data Available</p>
                      <p className="text-sm text-muted-foreground">Broker summary data is not available for this stock</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

            <TabsContent value="profile" className="space-y-4" id="profile">
            {profile ? (
              <>
                <Collapsible defaultOpen>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Company Overview</CardTitle>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                          Toggle
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed">{profile.background}</p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">IPO Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Listing Date</span>
                          <span className="font-medium">{profile.history?.date || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IPO Price</span>
                          <span className="font-medium">{profile.history?.price || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Board</span>
                          <span className="font-medium">{profile.history?.board || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Free Float</span>
                          <span className="font-medium">{profile.history?.free_float || '-'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {profile.address?.[0] && (
                        <div className="space-y-3">
                          <div>
                            <span className="text-muted-foreground text-sm">Office</span>
                            <p className="font-medium">{profile.address[0].office}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-sm">Phone</span>
                            <p className="font-medium">{profile.address[0].phone}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-sm">Website</span>
                            <p className="font-medium">{profile.address[0].website}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Collapsible defaultOpen>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Major Shareholders</CardTitle>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                          Toggle
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="space-y-3">
                          {profile.shareholder?.slice(0, 5).map((holder, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                              <div className="flex-1">
                                <p className="font-medium">{holder.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold">{holder.percentage}</p>
                                <p className="text-xs text-muted-foreground">{holder.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Profile Data Available</p>
                  <p className="text-sm text-muted-foreground">Company profile data is not available for this stock</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </section>

        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-500">Disclaimer</p>
                <p className="text-sm text-muted-foreground">
                  Analisis ini bukan merupakan rekomendasi investasi. Data bersifat informatif dan 
                  keputusan investasi sepenuhnya menjadi tanggung jawab investor. Selalu lakukan 
                  riset mandiri sebelum mengambil keputusan investasi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>Data dari datasaham.io API. Bukan rekomendasi investasi.</p>
        </div>
      </footer>
    </div>
  );
}
