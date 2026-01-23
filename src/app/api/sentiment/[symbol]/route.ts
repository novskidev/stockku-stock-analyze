import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const symbol = params.symbol?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get('days');
  const days = daysParam ? Number(daysParam) : undefined;

  try {
    const data = await datasahamApi.getMarketSentiment(symbol, { days, fresh: true });
    return NextResponse.json({ symbol, days, data });
  } catch (error) {
    console.error('Failed to fetch market sentiment', error);
    return NextResponse.json({ error: 'Failed to fetch market sentiment' }, { status: 500 });
  }
}
