import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await datasahamApi.getTrending({ fresh: true });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch trending data', error);
    return NextResponse.json({ error: 'Failed to fetch trending data' }, { status: 500 });
  }
}
