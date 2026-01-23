import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const upperSymbol = symbol?.toUpperCase();
  if (!upperSymbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get('days');
  const days = daysParam ? Number(daysParam) : undefined;

  try {
    const data = await datasahamApi.getMarketSentiment(upperSymbol, { days, fresh: true });
    return NextResponse.json({ symbol: upperSymbol, days, data });
  } catch (error) {
    console.error('Failed to fetch market sentiment', error);
    return NextResponse.json({ error: 'Failed to fetch market sentiment' }, { status: 500 });
  }
}
