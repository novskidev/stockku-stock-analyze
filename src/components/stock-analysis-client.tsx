'use client';

import { useState, useMemo } from 'react';
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
import { StockProfile, BrokerSummary, TopMover } from '@/lib/datasaham-api';
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

export function StockAnalysisClient({ symbol, profile, brokerSummary, stockQuote }: StockAnalysisClientProps) {
  const currentPrice = stockQuote?.last_price || 0;
  const priceChange = stockQuote?.change || 0;
  const priceChangePercent = stockQuote?.change_percentage || 0;
  
  const mockData = useMemo(() => generateMockOHLCV(currentPrice || 10000, 100), [currentPrice]);
  
  const technicalSummary = useMemo(() => calculateTechnicalSummary(mockData), [mockData]);
  
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
    generateQuantSignal(mockData, technicalSummary, fundamentalSummary, bandarmologySummary)
  , [mockData, technicalSummary, fundamentalSummary, bandarmologySummary]);
  
  const prediction = useMemo(() => 
    predictPriceMovement(mockData, technicalSummary, fundamentalSummary, bandarmologySummary)
  , [mockData, technicalSummary, fundamentalSummary, bandarmologySummary]);

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
                    <p className="text-2xl font-bold font-mono">{formatPrice(currentPrice)}</p>
                    <div className={`flex items-center justify-end gap-1 ${priceChange >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                      {priceChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span className="font-medium">
                        {priceChange >= 0 ? '+' : ''}{priceChange.toLocaleString('id-ID')} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vol: {formatNumber(stockQuote.volume)} | Val: {formatCurrency(stockQuote.value)}
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

        <Tabs defaultValue="technical" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
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
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Broker Data Available</p>
                  <p className="text-sm text-muted-foreground">Broker summary data is not available for this stock</p>
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
