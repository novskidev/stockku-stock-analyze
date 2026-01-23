import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [gainers, losers, mostActive, foreignBuy] = await Promise.all([
      datasahamApi.getTopGainers({ fresh: true }),
      datasahamApi.getTopLosers({ fresh: true }),
      datasahamApi.getMostActive({ fresh: true }),
      datasahamApi.getNetForeignBuy({ fresh: true }),
    ]);

    return NextResponse.json({
      gainers,
      losers,
      mostActive,
      foreignBuy,
    });
  } catch (error) {
    console.error('Failed to fetch market data', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
