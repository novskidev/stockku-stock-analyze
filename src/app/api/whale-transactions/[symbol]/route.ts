import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const symbol = params.symbol?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  const url = new URL(request.url);
  const minLotParam = url.searchParams.get('min_lot');
  const min_lot = minLotParam ? Number(minLotParam) : undefined;

  try {
    const data = await datasahamApi.getWhaleTransactions(symbol, { min_lot, fresh: true });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch whale transactions', error);
    return NextResponse.json({ error: 'Failed to fetch whale transactions' }, { status: 500 });
  }
}
