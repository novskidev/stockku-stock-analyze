import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') || undefined;
  const order = url.searchParams.get('order') || undefined;
  const period = url.searchParams.get('period') || undefined;
  const marketType = url.searchParams.get('marketType') || undefined;

  try {
    const data = await datasahamApi.getTopBroker({ sort, order, period, marketType, fresh: true });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch top brokers', error);
    return NextResponse.json({ error: 'Failed to fetch top brokers' }, { status: 500 });
  }
}
