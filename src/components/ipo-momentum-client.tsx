'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Flame, RefreshCw } from 'lucide-react';
import { IpoMomentum, IpoMomentumItem } from '@/lib/datasaham-api';
import { PageHeader } from '@/components/page-header';

interface IpoMomentumClientProps {
  data: IpoMomentum | null;
}

function formatScore(score?: number) {
  return score !== undefined && score !== null ? score.toFixed(1) : '-';
}

function parseOfferingPeriod(period?: string) {
  if (!period) return null;
  const match = period.match(/(\d{4}-\d{2}-\d{2}).*(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
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
  const offeringRange = parseOfferingPeriod(ipo.offering_period);
  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-2 flex flex-col h-full">
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
        {(offeringRange || ipo.listing_date) && (
          <div className="mt-2 space-y-2 text-xs text-muted-foreground">
            {offeringRange && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>Offering {offeringRange.start} → {offeringRange.end}</span>
              </div>
            )}
            {ipo.listing_date && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-chart-2" />
                <span>Listing {ipo.listing_date}</span>
              </div>
            )}
          </div>
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
  const [sortKey, setSortKey] = useState<'score' | 'date'>('score');

  const upcomingSorted = useMemo(() => {
    const list = momentum?.upcoming_ipos ? [...momentum.upcoming_ipos] : [];
    if (sortKey === 'date') {
      return list.sort((a, b) => (a.listing_date || '').localeCompare(b.listing_date || ''));
    }
    return list.sort((a, b) => (b.momentum_score || 0) - (a.momentum_score || 0));
  }, [momentum?.upcoming_ipos, sortKey]);

  const recentSorted = useMemo(() => {
    const list = momentum?.recent_ipos ? [...momentum.recent_ipos] : [];
    if (sortKey === 'date') {
      return list.sort((a, b) => (b.listing_date || '').localeCompare(a.listing_date || ''));
    }
    return list.sort((a, b) => (b.momentum_score || 0) - (a.momentum_score || 0));
  }, [momentum?.recent_ipos, sortKey]);

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
        <PageHeader
          eyebrow="Primary Market"
          title="IPO Momentum Tracker"
          description="Momentum score, rekomendasi, dan sektor panas"
          icon={<Flame className="h-6 w-6 text-primary" />}
          actions={
            <>
              <Link href="/">
                <Button variant="ghost" size="icon" aria-label="Back">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </>
          }
          className="mb-6"
        />

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
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="outline">Sort by</Badge>
              <Button
                type="button"
                size="sm"
                variant={sortKey === 'score' ? 'default' : 'ghost'}
                onClick={() => setSortKey('score')}
              >
                Score
              </Button>
              <Button
                type="button"
                size="sm"
                variant={sortKey === 'date' ? 'default' : 'ghost'}
                onClick={() => setSortKey('date')}
              >
                Listing Date
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming IPOs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingSorted.length > 0 ? (
                <div className="grid gap-3">
                  {upcomingSorted.map((ipo, idx) => (
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
              {recentSorted.length > 0 ? (
                <div className="grid gap-3">
                  {recentSorted.map((ipo, idx) => (
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
