import { NextResponse } from 'next/server';
import { ChartTimeframe, datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

const TIMEFRAMES: ChartTimeframe[] = ['daily', '15m', '30m', '1h', '2h', '3h', '4h'];

function isTimeframe(value: string): value is ChartTimeframe {
  return TIMEFRAMES.includes(value as ChartTimeframe);
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function getDefaultRange(timeframe: ChartTimeframe): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  const backDays = timeframe === 'daily' ? 180 : 14;
  from.setDate(from.getDate() - backDays);
  return { from: formatDate(from), to: formatDate(to) };
}

export async function GET(request: Request, { params }: { params: { symbol: string; timeframe: string } }) {
  const { symbol, timeframe } = params;

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  if (!isTimeframe(timeframe)) {
    return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
  }

  const url = new URL(request.url);
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;

  const { from, to } = fromParam && toParam ? { from: fromParam, to: toParam } : getDefaultRange(timeframe);

  try {
    const data = await datasahamApi.getChartData(symbol.toUpperCase(), timeframe, {
      from,
      to,
      limit,
      fresh: true,
    });

    return NextResponse.json({ symbol: symbol.toUpperCase(), timeframe, from, to, data });
  } catch (error) {
    console.error('Failed to fetch chart data', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
