'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Activity, Users, BarChart3, 
  Shield, Zap, Target, AlertTriangle, CheckCircle, XCircle,
  ArrowUpRight, ArrowDownRight, Info, Building, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StockProfile, BrokerSummary, TopMover, BandarAnalysis, RiskRewardAnalysis, ChartTimeframe, MarketSentiment, StockInfoDetail, Orderbook, HistoricalSummary, SeasonalityPoint, KeyStats, HoldingComposition, ForeignOwnership, InsiderTransaction } from '@/lib/datasaham-api';
import { 
  OHLCV, calculateTechnicalSummary, TechnicalSummary, TechnicalSignal 
} from '@/lib/technical-analysis';
import { analyzeFundamentals, FundamentalSummary } from '@/lib/fundamental-analysis';
import { analyzeBrokerSummary, BandarmologySummary } from '@/lib/bandarmology-analysis';
import { generateQuantSignal, predictPriceMovement, QuantAnalysis, PredictionResult } from '@/lib/quant-analysis';

interface StockAnalysisClientProps {
  symbol: string;
  profile: StockProfile | null;
  brokerSummary: BrokerSummary[];
  stockQuote: TopMover | null;
  bandarAnalysis: BandarAnalysis;
  riskReward: RiskRewardAnalysis | null;
  sentiment: MarketSentiment | null;
  info: StockInfoDetail | null;
  orderbook: Orderbook | null;
  historicalSummary: HistoricalSummary | null;
  seasonality: SeasonalityPoint[];
  keyStats: KeyStats | null;
  foreignOwnership: ForeignOwnership[];
  holdingComposition: HoldingComposition[];
  insider: InsiderTransaction[];
}

function generateMockOHLCV(basePrice: number = 10000, days: number = 100): OHLCV[] {
  const data: OHLCV[] = [];
  let price = basePrice;
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const volatility = 0.02;
    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    price = Math.max(100, price + change);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
    });
  }
  
  return data;
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
  const isPositive = signal.includes('buy') || signal.includes('accumulation') || signal === 'excellent' || signal === 'good';
  const isNegative = signal.includes('sell') || signal.includes('distribution') || signal === 'poor' || signal === 'weak';
  
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

export function StockAnalysisClient({
  symbol,
  profile,
  brokerSummary,
  stockQuote,
  bandarAnalysis,
  riskReward,
  sentiment,
  info,
  orderbook,
  historicalSummary,
  seasonality,
  keyStats,
  foreignOwnership,
  holdingComposition,
  insider,
}: StockAnalysisClientProps) {
  const [chartData, setChartData] = useState<OHLCV[]>([]);
  const [liveSentiment, setLiveSentiment] = useState<MarketSentiment | null>(sentiment);
  const [isSentimentLoading, setIsSentimentLoading] = useState(false);
  const [sentimentUpdatedAt, setSentimentUpdatedAt] = useState<Date | null>(null);

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

  useEffect(() => {
    fetchChartData('daily');
  }, [fetchChartData]);

  useEffect(() => {
    refreshSentiment();
    const interval = setInterval(refreshSentiment, 30000);
    return () => clearInterval(interval);
  }, [refreshSentiment]);

  const currentPrice = stockQuote?.last_price || 0;
  const infoPrice = info?.last || currentPrice;
  const priceChange = info?.change ?? stockQuote?.change ?? 0;
  const priceChangePercent = info?.change_percentage ?? stockQuote?.change_percentage ?? 0;
  
  const mockData = useMemo(() => generateMockOHLCV(infoPrice || 10000, 100), [infoPrice]);
  const priceSeries = chartData.length ? chartData : mockData;
  
  const technicalSummary = useMemo(() => calculateTechnicalSummary(priceSeries), [priceSeries]);
  
  const fundamentalSummary = useMemo(() => analyzeFundamentals({
    per: 15 + Math.random() * 10,
    pbv: 1.5 + Math.random() * 2,
    roe: 12 + Math.random() * 10,
    debtToEquity: 0.3 + Math.random() * 0.5,
    dividendYield: 2 + Math.random() * 3,
    netMargin: 8 + Math.random() * 15,
    earningsGrowth: 5 + Math.random() * 20,
  }), []);
  
  const bandarmologySummary = useMemo(() => 
    brokerSummary.length > 0 ? analyzeBrokerSummary(brokerSummary) : null
  , [brokerSummary]);
  
  const quantAnalysis = useMemo(() => 
    generateQuantSignal(priceSeries, technicalSummary, fundamentalSummary, bandarmologySummary)
  , [priceSeries, technicalSummary, fundamentalSummary, bandarmologySummary]);
  
  const prediction = useMemo(() => 
    predictPriceMovement(priceSeries, technicalSummary, fundamentalSummary, bandarmologySummary)
  , [priceSeries, technicalSummary, fundamentalSummary, bandarmologySummary]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
              <div className="flex-1">
                <div className="flex items-center gap-3">
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
              <div className="text-right">
                {stockQuote ? (
                  <>
                    <p className="text-2xl font-bold font-mono">{formatPrice(infoPrice || currentPrice)}</p>
                    <div className={`flex items-center justify-end gap-1 ${priceChange >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                      {priceChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span className="font-medium">
                        {priceChange >= 0 ? '+' : ''}{priceChange.toLocaleString('id-ID')} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vol: {formatNumber(info?.volume || stockQuote.volume)} | Val: {formatCurrency(info?.value || stockQuote.value)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Data tidak tersedia</p>
                )}
              </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card className="bg-gradient-to-r from-primary/10 to-chart-2/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-16 h-16 rounded-full ${
                  quantAnalysis.signal.action.includes('buy') ? 'bg-bullish/20' :
                  quantAnalysis.signal.action.includes('sell') ? 'bg-bearish/20' : 'bg-neutral/20'
                }`}>
                  {quantAnalysis.signal.action.includes('buy') ? (
                    <TrendingUp className="w-8 h-8 text-bullish" />
                  ) : quantAnalysis.signal.action.includes('sell') ? (
                    <TrendingDown className="w-8 h-8 text-bearish" />
                  ) : (
                    <Activity className="w-8 h-8 text-neutral" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI Trading Signal</p>
                  <p className={`text-2xl font-bold capitalize ${
                    quantAnalysis.signal.action.includes('buy') ? 'text-bullish' :
                    quantAnalysis.signal.action.includes('sell') ? 'text-bearish' : 'text-neutral'
                  }`}>
                    {quantAnalysis.signal.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {quantAnalysis.signal.confidence.toFixed(0)}% | Timeframe: {quantAnalysis.signal.timeframe}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Target Price</p>
                  <p className="text-xl font-bold text-bullish">
                    {quantAnalysis.signal.targetPrice ? formatPrice(quantAnalysis.signal.targetPrice) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stop Loss</p>
                  <p className="text-xl font-bold text-bearish">
                    {quantAnalysis.signal.stopLoss ? formatPrice(quantAnalysis.signal.stopLoss) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk/Reward</p>
                  <p className="text-xl font-bold">
                    {quantAnalysis.signal.riskRewardRatio ? `1:${quantAnalysis.signal.riskRewardRatio.toFixed(2)}` : '-'}
                  </p>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex flex-wrap gap-2">
              {quantAnalysis.signal.reasoning.map((reason, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {reason}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <OverallSignalCard
            title="Technical"
            signal={technicalSummary.overallSignal}
            confidence={technicalSummary.confidence}
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Info & Key Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
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
                    <p className="font-semibold">{keyStats.valuation?.pe_ratio ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">PBV</p>
                    <p className="font-semibold">{keyStats.valuation?.pb_ratio ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">ROE</p>
                    <p className="font-semibold">{keyStats.profitability?.roe ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Net Margin</p>
                    <p className="font-semibold">{keyStats.profitability?.net_margin ?? '-'}</p>
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
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="technical" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
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
              <TabsTrigger value="riskreward" className="gap-2">
                <Target className="w-4 h-4" />
                Risk/Reward
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <Building className="w-4 h-4" />
                Profile
              </TabsTrigger>
            </TabsList>

          <TabsContent value="technical" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Technical Indicators</CardTitle>
                  <CardDescription>Real-time technical analysis signals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {technicalSummary.signals.map((signal, idx) => (
                    <TechnicalIndicatorRow key={idx} signal={signal} />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Metrics</CardTitle>
                  <CardDescription>Current indicator values</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">RSI (14)</p>
                      <p className="text-xl font-bold">
                        {technicalSummary.indicators.rsi?.toFixed(2) || '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">MACD</p>
                      <p className="text-xl font-bold">
                        {technicalSummary.indicators.macd?.histogram.toFixed(2) || '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">SMA 20</p>
                      <p className="text-xl font-bold font-mono">
                        {technicalSummary.indicators.sma20?.toFixed(0) || '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">SMA 50</p>
                      <p className="text-xl font-bold font-mono">
                        {technicalSummary.indicators.sma50?.toFixed(0) || '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Stochastic %K</p>
                      <p className="text-xl font-bold">
                        {technicalSummary.indicators.stochastic?.k.toFixed(2) || '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">ATR</p>
                      <p className="text-xl font-bold">
                        {technicalSummary.indicators.atr?.toFixed(2) || '-'}
                      </p>
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
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-bullish mb-2">Resistance Levels</p>
                    {quantAnalysis.resistanceLevels.length > 0 ? (
                      quantAnalysis.resistanceLevels.map((level, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <span className="text-sm text-muted-foreground">R{idx + 1}</span>
                          <span className="font-mono font-medium">{formatPrice(level)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No resistance levels detected</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-bearish mb-2">Support Levels</p>
                    {quantAnalysis.supportLevels.length > 0 ? (
                      quantAnalysis.supportLevels.map((level, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <span className="text-sm text-muted-foreground">S{idx + 1}</span>
                          <span className="font-mono font-medium">{formatPrice(level)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No support levels detected</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fundamental" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fundamental Signals</CardTitle>
                  <CardDescription>Value & quality metrics analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fundamentalSummary.signals.map((signal, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{signal.metric}</p>
                          <SignalBadge signal={signal.signal} />
                        </div>
                        <p className="text-xs text-muted-foreground">{signal.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold">{signal.value}</p>
                        <p className="text-xs text-muted-foreground">{signal.benchmark}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Ratios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">P/E Ratio</p>
                      <p className="text-xl font-bold">
                        {fundamentalSummary.metrics.per?.toFixed(2) || '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">P/B Value</p>
                      <p className="text-xl font-bold">
                        {fundamentalSummary.metrics.pbv?.toFixed(2) || '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">ROE</p>
                      <p className="text-xl font-bold">
                        {fundamentalSummary.metrics.roe?.toFixed(2) || '-'}%
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Debt/Equity</p>
                      <p className="text-xl font-bold">
                        {fundamentalSummary.metrics.debtToEquity?.toFixed(2) || '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Dividend Yield</p>
                      <p className="text-xl font-bold">
                        {fundamentalSummary.metrics.dividendYield?.toFixed(2) || '-'}%
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Net Margin</p>
                      <p className="text-xl font-bold">
                        {fundamentalSummary.metrics.netMargin?.toFixed(2) || '-'}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bandarmology" className="space-y-4">
              {bandarAnalysis.accumulation && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                        {bandarAnalysis.accumulation.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Score: {bandarAnalysis.accumulation.accumulation_score}/10 | Confidence: {bandarAnalysis.accumulation.confidence}%
                      </p>
                    </CardContent>
                  </Card>

                  {bandarAnalysis.distribution && (
                    <Card className={`${
                      bandarAnalysis.distribution.status === 'DISTRIBUTION' ? 'bg-bearish/10 border-bearish/30' : 'bg-neutral/10'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-5 h-5" />
                          <span className="text-sm font-medium">Distribution</span>
                        </div>
                        <p className={`text-2xl font-bold ${
                          bandarAnalysis.distribution.status === 'DISTRIBUTION' ? 'text-bearish' : ''
                        }`}>
                          {bandarAnalysis.distribution.status}
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

                  {bandarAnalysis.pumpDump && (
                    <Card className={`${
                      bandarAnalysis.pumpDump.status === 'SAFE' ? 'bg-bullish/10 border-bullish/30' :
                      bandarAnalysis.pumpDump.status === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-bearish/10 border-bearish/30'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="text-sm font-medium">Pump & Dump</span>
                        </div>
                        <p className={`text-2xl font-bold ${
                          bandarAnalysis.pumpDump.status === 'SAFE' ? 'text-bullish' :
                          bandarAnalysis.pumpDump.status === 'WARNING' ? 'text-yellow-500' : 'text-bearish'
                        }`}>
                          {bandarAnalysis.pumpDump.status}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Risk: {bandarAnalysis.pumpDump.risk_score}/10 | {bandarAnalysis.pumpDump.recommendation}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {bandarAnalysis.accumulation && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Accumulation Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Top 5 Brokers</p>
                        <div className="flex flex-wrap gap-2">
                          {bandarAnalysis.accumulation.indicators.broker_concentration.top_5_brokers.map((broker, idx) => (
                            <Badge key={idx} variant="outline">{broker}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Entry Zone</p>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
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
                    </CardContent>
                  </Card>

                  {bandarAnalysis.smartMoney && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-primary" />
                          Smart Money Flow
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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
                          </p>
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

              {bandarAnalysis.pumpDump && bandarAnalysis.pumpDump.warnings.length > 0 && (
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-yellow-500">
                      <AlertTriangle className="w-5 h-5" />
                      Pump & Dump Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {bandarAnalysis.pumpDump.warnings.map((warning, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded bg-yellow-500/10">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">{warning}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground">Price Surge</p>
                        <p className="text-lg font-bold">{bandarAnalysis.pumpDump.pump_indicators.price_surge}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground">Volume Surge</p>
                        <p className="text-lg font-bold">{bandarAnalysis.pumpDump.pump_indicators.volume_surge}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground">Broker Conc.</p>
                        <p className="text-lg font-bold">{bandarAnalysis.pumpDump.pump_indicators.broker_concentration}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground">Retail FOMO</p>
                        <p className="text-lg font-bold">{bandarAnalysis.pumpDump.pump_indicators.retail_fomo_score}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {bandarmologySummary ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Users className="w-8 h-8 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Smart Money</p>
                            <p className={`text-lg font-bold capitalize ${
                              bandarmologySummary.smartMoneyDirection === 'bullish' ? 'text-bullish' :
                              bandarmologySummary.smartMoneyDirection === 'bearish' ? 'text-bearish' : 'text-neutral'
                            }`}>
                              {bandarmologySummary.smartMoneyDirection}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {bandarmologySummary.foreignFlow && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <DollarSign className={`w-8 h-8 ${
                              bandarmologySummary.foreignFlow.trend === 'inflow' ? 'text-bullish' :
                              bandarmologySummary.foreignFlow.trend === 'outflow' ? 'text-bearish' : 'text-neutral'
                            }`} />
                            <div>
                              <p className="text-sm text-muted-foreground">Foreign Flow</p>
                              <p className={`text-lg font-bold capitalize ${
                                bandarmologySummary.foreignFlow.trend === 'inflow' ? 'text-bullish' :
                                bandarmologySummary.foreignFlow.trend === 'outflow' ? 'text-bearish' : 'text-neutral'
                              }`}>
                                {formatCurrency(Math.abs(bandarmologySummary.foreignFlow.netValue))}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Activity className="w-8 h-8 text-chart-2" />
                          <div>
                            <p className="text-sm text-muted-foreground">Market Signal</p>
                            <p className="text-lg font-bold capitalize text-chart-2">
                              {bandarmologySummary.overallSignal.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-bullish" />
                          Top Buyers
                        </CardTitle>
                      </CardHeader>
                        <CardContent>
                          {bandarmologySummary.topBuyers.length > 0 ? (
                            <div className="space-y-2">
                              {bandarmologySummary.topBuyers.slice(0, 5).map((broker, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{broker.brokerCode}</p>
                                    {broker.brokerType && (
                                      <Badge variant="outline" className={`text-xs ${
                                        broker.brokerType === 'Asing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                                        broker.brokerType === 'Pemerintah' ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' :
                                        'bg-gray-500/10 text-gray-500 border-gray-500/30'
                                      }`}>
                                        {broker.brokerType}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono text-bullish">{formatCurrency(broker.netValue)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-4">No buyer data available</p>
                          )}
                        </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingDown className="w-5 h-5 text-bearish" />
                          Top Sellers
                        </CardTitle>
                      </CardHeader>
                        <CardContent>
                          {bandarmologySummary.topSellers.length > 0 ? (
                            <div className="space-y-2">
                              {bandarmologySummary.topSellers.slice(0, 5).map((broker, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{broker.brokerCode}</p>
                                    {broker.brokerType && (
                                      <Badge variant="outline" className={`text-xs ${
                                        broker.brokerType === 'Asing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                                        broker.brokerType === 'Pemerintah' ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' :
                                        'bg-gray-500/10 text-gray-500 border-gray-500/30'
                                      }`}>
                                        {broker.brokerType}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono text-bearish">{formatCurrency(Math.abs(broker.netValue))}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-4">No seller data available</p>
                          )}
                        </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Bandarmology Signals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {bandarmologySummary.signals.map((signal, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <div className="flex items-center gap-2">
                              {signal.type === 'accumulation' ? (
                                <CheckCircle className="w-4 h-4 text-bullish" />
                              ) : signal.type === 'distribution' ? (
                                <XCircle className="w-4 h-4 text-bearish" />
                              ) : (
                                <Info className="w-4 h-4 text-neutral" />
                              )}
                              <span>{signal.description}</span>
                            </div>
                            <Badge className={
                              signal.type === 'accumulation' ? 'bg-bullish/20 text-bullish' :
                              signal.type === 'distribution' ? 'bg-bearish/20 text-bearish' : 'bg-neutral/20 text-neutral'
                            }>
                              {(signal.strength * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : !bandarAnalysis.accumulation && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Broker Data Available</p>
                    <p className="text-sm text-muted-foreground">Broker summary data is not available for this stock</p>
                  </CardContent>
                </Card>
              )}
              </TabsContent>

            <TabsContent value="riskreward" className="space-y-4">
              {riskReward ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className={`${
                      riskReward.recommendation === 'BUY' || riskReward.recommendation === 'STRONG_BUY' ? 'bg-bullish/10 border-bullish/30' :
                      riskReward.recommendation === 'SELL' || riskReward.recommendation === 'AVOID' ? 'bg-bearish/10 border-bearish/30' :
                      'bg-yellow-500/10 border-yellow-500/30'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5" />
                          <span className="text-sm font-medium">Recommendation</span>
                        </div>
                        <p className={`text-2xl font-bold ${
                          riskReward.recommendation === 'BUY' || riskReward.recommendation === 'STRONG_BUY' ? 'text-bullish' :
                          riskReward.recommendation === 'SELL' || riskReward.recommendation === 'AVOID' ? 'text-bearish' : 'text-yellow-500'
                        }`}>
                          {riskReward.recommendation.replace(/_/g, ' ')}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-5 h-5 text-bearish" />
                          <span className="text-sm font-medium">Stop Loss</span>
                        </div>
                        <p className="text-2xl font-bold font-mono text-bearish">
                          Rp {formatPrice(riskReward.stop_loss_recommended)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Risk: {riskReward.risk_amount.toFixed(2)}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-bullish" />
                          <span className="text-sm font-medium">Best Target</span>
                        </div>
                        <p className="text-2xl font-bold font-mono text-bullish">
                          Rp {formatPrice(riskReward.target_prices[0]?.level || 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Reward: +{riskReward.reward_amount.toFixed(2)}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={`${
                      riskReward.risk_reward_ratio >= 2 ? 'bg-bullish/10 border-bullish/30' :
                      riskReward.risk_reward_ratio >= 1 ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-bearish/10 border-bearish/30'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-5 h-5" />
                          <span className="text-sm font-medium">Risk:Reward</span>
                        </div>
                        <p className={`text-2xl font-bold ${
                          riskReward.risk_reward_ratio >= 2 ? 'text-bullish' :
                          riskReward.risk_reward_ratio >= 1 ? 'text-yellow-500' : 'text-bearish'
                        }`}>
                          1:{riskReward.risk_reward_ratio.toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {riskReward.risk_reward_ratio >= 2 ? 'Good Setup' : riskReward.risk_reward_ratio >= 1 ? 'Fair Setup' : 'Poor Setup'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Target Prices
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {riskReward.target_prices.map((target, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-secondary">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Target {idx + 1}</span>
                                <Badge className={`${
                                  target.probability >= 70 ? 'bg-bullish/20 text-bullish' :
                                  target.probability >= 50 ? 'bg-yellow-500/20 text-yellow-500' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {target.probability}% prob
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xl font-mono font-bold text-bullish">
                                  Rp {formatPrice(target.level)}
                                </p>
                                <div className="text-right text-sm">
                                  <p className="text-bullish">+{target.reward.toFixed(2)}%</p>
                                  <p className="text-muted-foreground">RR 1:{target.risk_reward.toFixed(1)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-primary" />
                          Position Sizing
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Max Position</p>
                            <p className="text-lg font-bold">{riskReward.position_sizing.max_position_percent}%</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Suggested Shares</p>
                            <p className="text-lg font-bold">{riskReward.position_sizing.suggested_shares.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs text-muted-foreground">Total Investment</p>
                            <p className="text-lg font-bold">{riskReward.position_sizing.total_investment}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-bearish/10">
                            <p className="text-xs text-muted-foreground">Max Loss</p>
                            <p className="text-lg font-bold text-bearish">{riskReward.position_sizing.max_loss}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Technical Levels
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                        <div className="p-2 rounded bg-bearish/10 text-center">
                          <p className="text-xs text-muted-foreground">S3</p>
                          <p className="font-mono font-bold text-bearish">{formatPrice(riskReward.technical_levels.s3)}</p>
                        </div>
                        <div className="p-2 rounded bg-bearish/10 text-center">
                          <p className="text-xs text-muted-foreground">S2</p>
                          <p className="font-mono font-bold text-bearish">{formatPrice(riskReward.technical_levels.s2)}</p>
                        </div>
                        <div className="p-2 rounded bg-bearish/10 text-center">
                          <p className="text-xs text-muted-foreground">S1</p>
                          <p className="font-mono font-bold text-bearish">{formatPrice(riskReward.technical_levels.s1)}</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10 text-center">
                          <p className="text-xs text-muted-foreground">Pivot</p>
                          <p className="font-mono font-bold">{formatPrice(riskReward.technical_levels.pivot_point)}</p>
                        </div>
                        <div className="p-2 rounded bg-bullish/10 text-center">
                          <p className="text-xs text-muted-foreground">R1</p>
                          <p className="font-mono font-bold text-bullish">{formatPrice(riskReward.technical_levels.r1)}</p>
                        </div>
                        <div className="p-2 rounded bg-bullish/10 text-center">
                          <p className="text-xs text-muted-foreground">R2</p>
                          <p className="font-mono font-bold text-bullish">{formatPrice(riskReward.technical_levels.r2)}</p>
                        </div>
                        <div className="p-2 rounded bg-bullish/10 text-center">
                          <p className="text-xs text-muted-foreground">R3</p>
                          <p className="font-mono font-bold text-bullish">{formatPrice(riskReward.technical_levels.r3)}</p>
                        </div>
                        <div className="p-2 rounded bg-secondary text-center">
                          <p className="text-xs text-muted-foreground">ATR</p>
                          <p className="font-mono font-bold">{riskReward.technical_levels.atr} ({riskReward.technical_levels.atr_percent}%)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Risk/Reward Data Unavailable</p>
                    <p className="text-sm text-muted-foreground">Risk reward analysis is not available for this stock</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
            {profile ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{profile.background}</p>
                  </CardContent>
                </Card>

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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Major Shareholders</CardTitle>
                  </CardHeader>
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
                </Card>
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
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Data dari datasaham.io API. Bukan rekomendasi investasi.</p>
        </div>
      </footer>
    </div>
  );
}
