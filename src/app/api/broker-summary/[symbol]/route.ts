import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const today = new Date();
    const url = new URL(_req.url);

    const toParam = url.searchParams.get('to');
    const fromParam = url.searchParams.get('from');
    const daysParam = url.searchParams.get('days');

    let to = today.toISOString().split('T')[0];
    let from: string;

    if (toParam && !Number.isNaN(Date.parse(toParam))) {
      to = new Date(toParam).toISOString().split('T')[0];
    }

    if (fromParam && !Number.isNaN(Date.parse(fromParam))) {
      from = new Date(fromParam).toISOString().split('T')[0];
    } else {
      const fromDate = new Date(to);
      const days = Number(daysParam || '30');
      fromDate.setDate(fromDate.getDate() - (Number.isFinite(days) ? days : 30));
      from = fromDate.toISOString().split('T')[0];
    }

    const symbol = params.symbol?.toUpperCase();
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const brokers = await datasahamApi.getBrokerSummaryRange(symbol, { from, to, fresh: true });
    return NextResponse.json({ data: brokers, from, to });
  } catch (error) {
    console.error('Failed to fetch broker summary', error);
    return NextResponse.json({ error: 'Failed to fetch broker summary' }, { status: 500 });
  }
}
