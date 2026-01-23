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
    const response = await datasahamApi.getWhaleTransactionsFull(symbol, { min_lot, fresh: true });
    if (!response) {
      return NextResponse.json({ error: 'Failed to fetch whale transactions' }, { status: 500 });
    }
    const status = response.success ? 200 : 502;
    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Failed to fetch whale transactions', error);
    return NextResponse.json({ error: 'Failed to fetch whale transactions' }, { status: 500 });
  }
}
