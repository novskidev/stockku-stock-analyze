import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

function requiredParam(url: URL, key: string): string | null {
  const value = url.searchParams.get(key);
  return value && value.trim().length > 0 ? value : null;
}

export async function GET(request: Request, { params }: { params: { brokerCode: string } }) {
  const brokerCode = params.brokerCode;
  const url = new URL(request.url);
  const from = requiredParam(url, 'from');
  const to = requiredParam(url, 'to');

  if (!brokerCode) {
    return NextResponse.json({ error: 'brokerCode is required' }, { status: 400 });
  }
  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required (YYYY-MM-DD)' }, { status: 400 });
  }

  const transactionType = url.searchParams.get('transactionType') || undefined;
  const marketBoard = url.searchParams.get('marketBoard') || undefined;
  const investorType = url.searchParams.get('investorType') || undefined;
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');
  const page = pageParam ? Number(pageParam) : undefined;
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const data = await datasahamApi.getBrokerActivity(brokerCode, {
      from,
      to,
      page,
      limit,
      transactionType,
      marketBoard,
      investorType,
      fresh: true,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch broker activity', error);
    return NextResponse.json({ error: 'Failed to fetch broker activity' }, { status: 500 });
  }
}
