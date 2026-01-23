import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

type Reason = { label: string; impact: number };

function computeScore({
  whaleFlow,
  whaleDominant,
  whaleIntensity,
  sentimentRetail,
  sentimentBandar,
  divergence,
  priceChange,
}: {
  whaleFlow?: number;
  whaleDominant?: string;
  whaleIntensity?: string;
  sentimentRetail?: string;
  sentimentBandar?: string;
  divergence?: string;
  priceChange?: number;
}) {
  let score = 50;
  const reasons: Reason[] = [];

  if (whaleFlow !== undefined) {
    if (whaleFlow > 0) {
      score += 10;
      reasons.push({ label: 'Net whale buy', impact: +10 });
    } else if (whaleFlow < 0) {
      score -= 10;
      reasons.push({ label: 'Net whale sell', impact: -10 });
    }
  }

  if (whaleDominant) {
    if (whaleDominant.includes('ACCUM')) {
      score += 8;
      reasons.push({ label: 'Whale accumulation', impact: +8 });
    } else if (whaleDominant.includes('DISTRIB') || whaleDominant.includes('SELL')) {
      score -= 8;
      reasons.push({ label: 'Whale distribution', impact: -8 });
    }
  }

  if (whaleIntensity) {
    if (whaleIntensity.includes('EXTREME') || whaleIntensity.includes('HIGH')) {
      reasons.push({ label: 'High whale intensity (volatility)', impact: 0 });
    }
  }

  if (sentimentRetail) {
    if (sentimentRetail.includes('BULL')) {
      score += 4;
      reasons.push({ label: 'Retail bullish', impact: +4 });
    } else if (sentimentRetail.includes('PANIC') || sentimentRetail.includes('FEAR')) {
      score -= 2;
      reasons.push({ label: 'Retail fear', impact: -2 });
    }
  }

  if (sentimentBandar) {
    if (sentimentBandar.includes('ACCUM')) {
      score += 10;
      reasons.push({ label: 'Bandar accumulating', impact: +10 });
    } else if (sentimentBandar.includes('EXIT') || sentimentBandar.includes('DISTRIB')) {
      score -= 10;
      reasons.push({ label: 'Bandar distributing/exit', impact: -10 });
    }
  }

  if (divergence) {
    if (divergence.includes('PANIC') && divergence.includes('ACCUMULATE')) {
      score += 6;
      reasons.push({ label: 'Retail panic vs bandar accumulate', impact: +6 });
    } else if (divergence.includes('EUPHORIC') && divergence.includes('EXIT')) {
      score -= 6;
      reasons.push({ label: 'Retail euphoric vs bandar exit', impact: -6 });
    }
  }

  if (priceChange !== undefined) {
    if (priceChange > 0) {
      score += 3;
      reasons.push({ label: 'Price up today', impact: +3 });
    } else if (priceChange < 0) {
      score -= 3;
      reasons.push({ label: 'Price down today', impact: -3 });
    }
  }

  score = Math.max(0, Math.min(100, score));
  const signal = score >= 65 ? 'BULLISH' : score <= 40 ? 'BEARISH' : 'NEUTRAL';

  return { score, signal, reasons };
}

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const symbol = params.symbol?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  const url = new URL(request.url);
  const minLotParam = url.searchParams.get('min_lot');
  const min_lot = minLotParam ? Number(minLotParam) : 500;

  try {
    const [whale, sentiment, info] = await Promise.all([
      datasahamApi.getWhaleTransactions(symbol, { min_lot, fresh: true }),
      datasahamApi.getMarketSentiment(symbol, { fresh: true }),
      datasahamApi.getStockInfoDetail(symbol, { fresh: true }),
    ]);

    const summary = whale?.activity_summary || whale?.summary;
    const { score, signal, reasons } = computeScore({
      whaleFlow: summary?.net_whale_flow,
      whaleDominant: summary?.dominant_action,
      whaleIntensity: summary?.whale_intensity,
      sentimentRetail: sentiment?.retail_sentiment?.status,
      sentimentBandar: sentiment?.bandar_sentiment?.status,
      divergence: sentiment?.divergence?.type,
      priceChange: info?.change_percentage,
    });

    return NextResponse.json({
      symbol,
      score,
      signal,
      reasons,
      inputs: {
        whale,
        sentiment,
        info,
      },
    });
  } catch (error) {
    console.error('Failed to compute prediction', error);
    return NextResponse.json({ error: 'Failed to compute prediction' }, { status: 500 });
  }
}
