'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Rocket, Target, PieChart, ArrowUp, CheckCircle, Zap, ArrowLeft
} from 'lucide-react';
import { MultibaggerScan, BreakoutAlerts, SectorRotation, MultibaggerCandidate } from '@/lib/datasaham-api';
import { PageHeader } from '@/components/page-header';

interface RetailOpportunityClientProps {
  multibagger: MultibaggerScan | null;
  breakout: BreakoutAlerts | null;
  sectorRotation: SectorRotation | null;
}

type RetailData = {
  multibagger: MultibaggerScan | null;
  breakout: BreakoutAlerts | null;
  sectorRotation: SectorRotation | null;
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID').format(price);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function RetailOpportunityClient({ multibagger, breakout, sectorRotation }: RetailOpportunityClientProps) {
  const [activeTab, setActiveTab] = useState('multibagger');
  const [data, setData] = useState<RetailData>({ multibagger, breakout, sectorRotation });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [multibaggerSort, setMultibaggerSort] = useState<'score' | 'return'>('score');
  const [breakoutSort, setBreakoutSort] = useState<'probability' | 'severity'>('probability');

  const sortedMultibagger = useMemo(() => {
    const list = data.multibagger?.candidates ? [...data.multibagger.candidates] : [];
    if (multibaggerSort === 'return') {
      return list.sort((a, b) => {
        const aNum = Number(String(a.potential_return).replace('%', '').replace('+', '')) || 0;
        const bNum = Number(String(b.potential_return).replace('%', '').replace('+', '')) || 0;
        return bNum - aNum;
      });
    }
    return list.sort((a, b) => (b.multibagger_score || 0) - (a.multibagger_score || 0));
  }, [data.multibagger, multibaggerSort]);

  const sortedBreakouts = useMemo(() => {
    const list = data.breakout?.alerts ? [...data.breakout.alerts] : [];
    if (breakoutSort === 'severity') {
      const rank = (value: string) => (value === 'HIGH' ? 3 : value === 'MEDIUM' ? 2 : 1);
      return list.sort((a, b) => rank(b.severity) - rank(a.severity));
    }
    return list.sort((a, b) => (b.breakout_probability || 0) - (a.breakout_probability || 0));
  }, [data.breakout, breakoutSort]);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/retail/opportunity', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to refresh retail opportunity');
      }
      const payload = await response.json();
      setData(payload.data || { multibagger: null, breakout: null, sectorRotation: null });
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          eyebrow="Retail Signal"
          title="Retail Opportunity"
          description="Find multibagger stocks, breakout alerts, dan peluang rotasi sektor."
          icon={<Rocket className="h-6 w-6 text-primary" />}
          meta={
            lastUpdated ? (
              <span>Update: {lastUpdated.toLocaleTimeString('id-ID')}</span>
            ) : null
          }
          actions={
            <>
              <Link href="/">
                <Badge variant="outline" className="cursor-pointer flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back
                </Badge>
              </Link>
              <Badge variant="outline" className="cursor-pointer" onClick={refreshData}>
                {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
              </Badge>
            </>
          }
          className="mb-8"
        />

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Rocket className="w-8 h-8 text-chart-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Multibagger</p>
                  <p className="text-2xl font-bold">{data.multibagger?.total_candidates || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-chart-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Breakout Alerts</p>
                  <p className="text-2xl font-bold">{data.breakout?.total_alerts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <PieChart className="w-8 h-8 text-chart-3" />
                <div>
                    <p className="text-sm text-muted-foreground">Leading Sectors</p>
                    <p className="text-2xl font-bold">{data.sectorRotation?.hot_sectors?.length || 0}</p>

                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-chart-4" />
                <div>
                  <p className="text-sm text-muted-foreground">Market Phase</p>
                  <p className="text-lg font-bold">{data.sectorRotation?.market_phase || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="multibagger" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Multibagger
            </TabsTrigger>
            <TabsTrigger value="breakout" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Breakout
            </TabsTrigger>
            <TabsTrigger value="sector" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Sector
            </TabsTrigger>
          </TabsList>

          <TabsContent value="multibagger" className="space-y-4">
            {data.multibagger && data.multibagger.candidates && data.multibagger.candidates.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-chart-1" />
                      Multibagger Scanner
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {data.multibagger.total_candidates} candidates with score {'>='} {data.multibagger.filters_applied.min_score}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Sort by</Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant={multibaggerSort === 'score' ? 'default' : 'ghost'}
                        onClick={() => setMultibaggerSort('score')}
                      >
                        Score
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={multibaggerSort === 'return' ? 'default' : 'ghost'}
                        onClick={() => setMultibaggerSort('return')}
                      >
                        Return
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sortedMultibagger.map((stock, idx) => (
                    <Link key={idx} href={`/stock/${stock.symbol}`}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col">
                        <CardContent className="p-4 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-bold text-lg">{stock.symbol}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[150px]">{stock.name}</p>
                            </div>
                            <Badge className={`${
                              stock.multibagger_score >= 80 ? 'bg-bullish/20 text-bullish' :
                              stock.multibagger_score >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              Score {stock.multibagger_score}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-2 rounded bg-secondary">
                              <p className="text-xs text-muted-foreground">Current</p>
                              <p className="font-mono font-bold">Rp {formatPrice(stock.current_price)}</p>
                            </div>
                            <div className="p-2 rounded bg-secondary">
                              <p className="text-xs text-muted-foreground">Target 1</p>
                              <p className="font-mono font-bold text-bullish">Rp {formatPrice(stock.target_prices[0]?.target || 0)}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1">
                              <ArrowUp className="w-4 h-4 text-bullish" />
                              <span className="text-bullish font-bold">{stock.potential_return}</span>
                            </div>
                            <Badge variant="outline">{stock.timeframe}</Badge>
                          </div>

                          <div className="space-y-2 mt-auto">
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline" className={`${
                                stock.reasons.technical.trend === 'UPTREND' ? 'bg-bullish/10 text-bullish' : 'bg-muted'
                              }`}>
                                {stock.reasons.technical.trend}
                              </Badge>
                              {stock.reasons.volume.unusual_volume && (
                                  <Badge variant="outline" className="bg-chart-2/10 text-chart-2">
                                    Vol Surge {stock.reasons.volume.volume_surge?.toFixed(0) || 0}%
                                  </Badge>

                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{stock.sector}</span>
                              <span>|</span>
                              <span>{stock.market_cap_formatted}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Rocket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Multibagger Found</p>
                  <p className="text-sm text-muted-foreground">Scanner will update when opportunities arise</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="breakout" className="space-y-4">
            {data.breakout && data.breakout.alerts && data.breakout.alerts.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-chart-2" />
                      Breakout Alerts
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {data.breakout.total_alerts} real-time breakout detections with volume confirmation
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Sort by</Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant={breakoutSort === 'probability' ? 'default' : 'ghost'}
                        onClick={() => setBreakoutSort('probability')}
                      >
                        Probability
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={breakoutSort === 'severity' ? 'default' : 'ghost'}
                        onClick={() => setBreakoutSort('severity')}
                      >
                        Severity
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                <div className="space-y-3">
                  {sortedBreakouts.slice(0, 15).map((alert, idx) => (
                    <Link key={idx} href={`/stock/${alert.symbol}`}>
                      <Card className={`hover:border-primary/50 transition-colors cursor-pointer ${
                        alert.severity === 'HIGH' ? 'border-bullish/30 bg-bullish/5' :
                        alert.severity === 'MEDIUM' ? 'border-yellow-500/30 bg-yellow-500/5' :
                        'border-muted'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-lg">{alert.symbol}</p>
                                  <Badge className={`${
                                    alert.severity === 'HIGH' ? 'bg-bullish/20 text-bullish' :
                                    alert.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-muted'
                                  }`}>
                                    {alert.severity}
                                  </Badge>
                                  <Badge variant="outline">{alert.alert_type.replace(/_/g, ' ')}</Badge>
                                  {alert.indicators.volume_confirmation && (
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Volume
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{alert.name}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Price</p>
                                <p className="font-mono font-bold">Rp {formatPrice(alert.price)}</p>
                                <p className={`text-xs ${alert.change_percentage >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                  {formatPercent(alert.change_percentage)}
                                </p>
                              </div>
                              <div>
                                  <p className="text-xs text-muted-foreground">Volume</p>
                                  <p className="font-medium">{alert.volume}</p>
                                  <p className="text-xs text-chart-2">{alert.volume_vs_avg?.toFixed(0) || 0}x avg</p>

                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Target / SL</p>
                                <p className="font-mono">
                                  <span className="text-bullish">{formatPrice(alert.target)}</span>
                                  {' / '}
                                  <span className="text-bearish">{formatPrice(alert.stop_loss)}</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Probability</p>
                                <p className={`font-bold ${alert.breakout_probability >= 80 ? 'text-bullish' : 'text-yellow-500'}`}>
                                  {alert.breakout_probability}%
                                </p>
                                <p className="text-xs text-muted-foreground">{alert.action.replace(/_/g, ' ')}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Breakout Alerts</p>
                  <p className="text-sm text-muted-foreground">Alerts will appear when breakouts are detected</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sector" className="space-y-4">
            {data.sectorRotation && data.sectorRotation.all_sectors ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-primary" />
                      Sector Rotation Analysis
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Market Phase: <span className="font-medium text-foreground">{data.sectorRotation.market_phase}</span>
                    </p>
                  </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-bullish" />
                          <span className="font-medium text-bullish">{data.sectorRotation.summary.bullish_sectors}</span>
                          <span className="text-muted-foreground">Bullish</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-bearish" />
                          <span className="font-medium text-bearish">{data.sectorRotation.summary.bearish_sectors}</span>
                          <span className="text-muted-foreground">Bearish</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="font-medium text-yellow-500">{data.sectorRotation.summary.neutral_sectors}</span>
                          <span className="text-muted-foreground">Neutral</span>
                        </div>
                        <div className="border-l pl-4 flex items-center gap-2">
                          <span className="font-medium">{data.sectorRotation.summary.total_sectors}</span>
                          <span className="text-muted-foreground">Total Sectors</span>
                        </div>
                      </div>
                    </CardContent>

                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.sectorRotation.all_sectors.slice(0, 9).map((sector, idx) => (
                    <Card key={idx} className={`${
                      sector.status === 'IMPROVING' || sector.avg_return_today > 0 ? 'border-bullish/30 bg-bullish/5' :
                      sector.status === 'WEAKENING' || sector.avg_return_today < 0 ? 'border-bearish/30 bg-bearish/5' :
                      ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-bold">{sector.sector_name}</p>
                          <Badge className={`${
                            sector.status === 'IMPROVING' ? 'bg-bullish/20 text-bullish' :
                            sector.status === 'WEAKENING' ? 'bg-bearish/20 text-bearish' :
                            'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {sector.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Today</p>
                            <p className={sector.avg_return_today >= 0 ? 'text-bullish font-medium' : 'text-bearish font-medium'}>
                              {formatPercent(sector.avg_return_today)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Score</p>
                            <p className="font-medium">{sector.momentum_score}/10</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Flow</p>
                            <p className={`font-medium ${
                              sector.foreign_flow === 'INFLOW' ? 'text-bullish' :
                              sector.foreign_flow === 'OUTFLOW' ? 'text-bearish' : ''
                            }`}>
                              {sector.foreign_flow}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>{sector.companies_count} stocks</span>
                          <span>|</span>
                          <span className="text-bullish">{sector.gainers_count} up</span>
                          <span>|</span>
                          <span className="text-bearish">{sector.losers_count} down</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {sector.top_stocks.slice(0, 3).map((stock, i) => (
                            <Link key={i} href={`/stock/${stock.symbol}`}>
                              <Badge variant="outline" className={`cursor-pointer hover:bg-primary/10 ${
                                stock.change_percent >= 0 ? 'text-bullish' : 'text-bearish'
                              }`}>
                                {stock.symbol} {formatPercent(stock.change_percent)}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <PieChart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Sector Data</p>
                  <p className="text-sm text-muted-foreground">Sector rotation analysis will be available soon</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
