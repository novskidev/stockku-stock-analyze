'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { ArrowLeft, Flame, RefreshCw } from 'lucide-react';
import { IpoMomentum, IpoMomentumItem } from '@/lib/datasaham-api';

interface IpoMomentumClientProps {
  data: IpoMomentum | null;
}

function formatScore(score?: number) {
  return score !== undefined && score !== null ? score.toFixed(1) : '-';
}

function TierBadge({ tier }: { tier?: string }) {
  if (!tier) return null;
  const color =
    tier === 'TIER_1' ? 'bg-bullish/20 text-bullish' :
    tier === 'TIER_2' ? 'bg-yellow-500/20 text-yellow-500' :
    'bg-muted text-muted-foreground';
  return <Badge className={color}>{tier.replace('_', ' ')}</Badge>;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const color =
    status === 'UPCOMING' ? 'bg-blue-500/20 text-blue-500' :
    status === 'OFFERING' ? 'bg-bullish/20 text-bullish' :
    status === 'LISTED' ? 'bg-primary/20 text-primary' :
    'bg-muted text-muted-foreground';
  return <Badge className={color}>{status}</Badge>;
}

function RecommendationBadge({ recommendation }: { recommendation?: string }) {
  if (!recommendation) return null;
  const color =
    recommendation === 'STRONG_APPLY' ? 'bg-bullish/20 text-bullish' :
    recommendation === 'APPLY' ? 'bg-primary/20 text-primary' :
    recommendation === 'CONSIDER' ? 'bg-yellow-500/20 text-yellow-500' :
    'bg-bearish/20 text-bearish';
  return <Badge className={color}>{recommendation.replace('_', ' ')}</Badge>;
}

function IpoCard({ ipo }: { ipo: IpoMomentumItem }) {
  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">{ipo.symbol}</p>
            <p className="text-sm text-muted-foreground">{ipo.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={ipo.status} />
            <TierBadge tier={ipo.underwriter_tier} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Score {formatScore(ipo.momentum_score)}</Badge>
          <RecommendationBadge recommendation={ipo.recommendation} />
        </div>
        {ipo.offering_price && (
          <p className="text-sm text-muted-foreground">Offering price: Rp {ipo.offering_price.toLocaleString('id-ID')}</p>
        )}
        {ipo.offering_period && (
          <p className="text-sm text-muted-foreground">Offering period: {ipo.offering_period}</p>
        )}
        {ipo.listing_date && (
          <p className="text-sm text-muted-foreground">Listing date: {ipo.listing_date}</p>
        )}
        {ipo.performance_since_listing !== undefined && (
          <p className={`text-sm ${ipo.performance_since_listing >= 0 ? 'text-bullish' : 'text-bearish'}`}>
            Perf since listing: {ipo.performance_since_listing.toFixed(2)}%
          </p>
        )}
        {ipo.sector && (
          <Badge variant="outline">{ipo.sector}</Badge>
        )}
      </CardContent>
    </Card>
  );
}

export function IpoMomentumClient({ data }: IpoMomentumClientProps) {
  const [momentum, setMomentum] = useState<IpoMomentum | null>(data);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sentiment/ipo/momentum', { cache: 'no-store' });
      const payload = await res.json();
      setMomentum(payload.data || null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10">
              <Flame className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">IPO Momentum Tracker</h1>
              <p className="text-sm text-muted-foreground">Momentum score, rekomendasi, dan sektor panas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Analysis date: {momentum?.analysis_date || '-'}</p>
            {momentum?.market_sentiment && <p>Market sentiment: {momentum.market_sentiment}</p>}
            {momentum?.hot_sectors && momentum.hot_sectors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {momentum.hot_sectors.map((sector, idx) => (
                  <Badge key={`${sector}-${idx}`} variant="outline">{sector}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming IPOs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {momentum?.upcoming_ipos && momentum.upcoming_ipos.length > 0 ? (
                <div className="grid gap-3">
                  {momentum.upcoming_ipos.map((ipo, idx) => (
                    <IpoCard key={`${ipo.symbol}-${idx}`} ipo={ipo} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming IPOs data.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent IPOs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {momentum?.recent_ipos && momentum.recent_ipos.length > 0 ? (
                <div className="grid gap-3">
                  {momentum.recent_ipos.map((ipo, idx) => (
                    <IpoCard key={`${ipo.symbol}-${idx}`} ipo={ipo} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent IPOs data.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
