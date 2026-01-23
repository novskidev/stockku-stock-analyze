import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

const ALLOWED_DAYS = [7, 14, 30] as const;
type PumpDumpDays = typeof ALLOWED_DAYS[number];

function isAllowedDays(value: number): value is PumpDumpDays {
  return ALLOWED_DAYS.includes(value as PumpDumpDays);
}

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const symbol = params.symbol?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get('days');
  const parsedDays = daysParam ? Number(daysParam) : 7;

  if (!Number.isFinite(parsedDays) || !isAllowedDays(parsedDays)) {
    return NextResponse.json({ error: 'Invalid days' }, { status: 400 });
  }

  try {
    const data = await datasahamApi.getBandarPumpDump(symbol, { days: parsedDays, fresh: true });

    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch pump-dump analysis' }, { status: 502 });
    }

    return NextResponse.json({
      symbol,
      days: parsedDays,
      data,
    });
  } catch (error) {
    console.error('Failed to fetch pump-dump analysis', error);
    return NextResponse.json({ error: 'Failed to fetch pump-dump analysis' }, { status: 500 });
  }
}
