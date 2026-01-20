'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Rocket, TrendingUp, Target, PieChart, ArrowUp, ArrowDown, 
  AlertTriangle, CheckCircle, Clock, Zap, BarChart3, Shield
} from 'lucide-react';
import { MultibaggerScan, BreakoutAlerts, SectorRotation, MultibaggerCandidate } from '@/lib/datasaham-api';

interface RetailOpportunityClientProps {
  multibagger: MultibaggerScan | null;
  breakout: BreakoutAlerts | null;
  sectorRotation: SectorRotation | null;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID').format(price);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function RetailOpportunityClient({ multibagger, breakout, sectorRotation }: RetailOpportunityClientProps) {
  const [activeTab, setActiveTab] = useState('multibagger');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Rocket className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Retail Opportunity</h1>
          </div>
          <p className="text-muted-foreground">
            Find multibagger stocks, breakout alerts, and sector rotation opportunities
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Rocket className="w-8 h-8 text-chart-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Multibagger</p>
                  <p className="text-2xl font-bold">{multibagger?.total_candidates || 0}</p>
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
                  <p className="text-2xl font-bold">{breakout?.total_alerts || 0}</p>
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
                  <p className="text-2xl font-bold">{sectorRotation?.leading_sectors?.length || 0}</p>
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
                  <p className="text-lg font-bold">{sectorRotation?.market_phase || 'N/A'}</p>
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
            {multibagger && multibagger.candidates && multibagger.candidates.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-chart-1" />
                      Multibagger Scanner
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {multibagger.total_candidates} candidates with score {'>='} {multibagger.filters_applied.min_score}
                    </p>
                  </CardHeader>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {multibagger.candidates.map((stock, idx) => (
                    <Link key={idx} href={`/stock/${stock.symbol}`}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardContent className="p-4">
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

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline" className={`${
                                stock.reasons.technical.trend === 'UPTREND' ? 'bg-bullish/10 text-bullish' : 'bg-muted'
                              }`}>
                                {stock.reasons.technical.trend}
                              </Badge>
                              {stock.reasons.volume.unusual_volume && (
                                <Badge variant="outline" className="bg-chart-2/10 text-chart-2">
                                  Vol Surge {stock.reasons.volume.volume_surge.toFixed(0)}%
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
            {breakout && breakout.alerts && breakout.alerts.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-chart-2" />
                      Breakout Alerts
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {breakout.total_alerts} real-time breakout detections with volume confirmation
                    </p>
                  </CardHeader>
                </Card>

                <div className="space-y-3">
                  {breakout.alerts.slice(0, 15).map((alert, idx) => (
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
                                <p className="text-xs text-chart-2">{alert.volume_vs_avg.toFixed(0)}x avg</p>
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
            {sectorRotation && sectorRotation.all_sectors ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-primary" />
                      Sector Rotation Analysis
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Market Phase: <span className="font-medium text-foreground">{sectorRotation.market_phase}</span>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{sectorRotation.summary}</p>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sectorRotation.all_sectors.slice(0, 9).map((sector, idx) => (
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
