import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

const TIMEFRAMES = ['daily', '15m', '1h', '4h'] as const;
const PERIODS = [20, 50, 100, 200] as const;

type TechnicalTimeframe = typeof TIMEFRAMES[number];
type TechnicalPeriod = typeof PERIODS[number];

function isTimeframe(value: string): value is TechnicalTimeframe {
  return TIMEFRAMES.includes(value as TechnicalTimeframe);
}

function isPeriod(value: number): value is TechnicalPeriod {
  return PERIODS.includes(value as TechnicalPeriod);
}

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const symbol = params.symbol?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const url = new URL(request.url);
  const timeframeParam = (url.searchParams.get('timeframe') || 'daily').replace(/\s+/g, '');
  const periodParam = url.searchParams.get('period');
  const indicator = url.searchParams.get('indicator') || 'all';

  if (!isTimeframe(timeframeParam)) {
    return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
  }

  const parsedPeriod = periodParam ? Number(periodParam) : 20;
  if (!Number.isFinite(parsedPeriod) || !isPeriod(parsedPeriod)) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
  }

  try {
    const data = await datasahamApi.getTechnicalAnalysis(symbol, {
      timeframe: timeframeParam,
      period: parsedPeriod,
      indicator,
      fresh: true,
    });

    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch technical analysis' }, { status: 502 });
    }

    return NextResponse.json({
      symbol,
      timeframe: timeframeParam,
      period: parsedPeriod,
      indicator,
      data,
    });
  } catch (error) {
    console.error('Failed to fetch technical analysis', error);
    return NextResponse.json({ error: 'Failed to fetch technical analysis' }, { status: 500 });
  }
}
