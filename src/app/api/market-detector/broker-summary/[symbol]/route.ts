import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

function requiredParam(url: URL, key: string): string | null {
  const value = url.searchParams.get(key);
  return value && value.trim().length > 0 ? value : null;
}

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const symbol = params.symbol?.toUpperCase();
  const url = new URL(request.url);
  const from = requiredParam(url, 'from');
  const to = requiredParam(url, 'to');

  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required (YYYY-MM-DD)' }, { status: 400 });
  }

  const transactionType = url.searchParams.get('transactionType') || undefined;
  const marketBoard = url.searchParams.get('marketBoard') || undefined;
  const investorType = url.searchParams.get('investorType') || undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const data = await datasahamApi.getBrokerSummaryRange(symbol, {
      from,
      to,
      transactionType,
      marketBoard,
      investorType,
      limit,
      fresh: true,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch broker summary', error);
    return NextResponse.json({ error: 'Failed to fetch broker summary' }, { status: 500 });
  }
}
