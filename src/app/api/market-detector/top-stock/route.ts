import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

function requiredParam(url: URL, key: string): string | null {
  const value = url.searchParams.get(key);
  return value && value.trim().length > 0 ? value : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const start = requiredParam(url, 'start');
  const end = requiredParam(url, 'end');

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end are required (YYYY-MM-DD)' }, { status: 400 });
  }

  const investorType = url.searchParams.get('investorType') || undefined;
  const marketType = url.searchParams.get('marketType') || undefined;
  const valueType = url.searchParams.get('valueType') || undefined;
  const pageParam = url.searchParams.get('page');
  const page = pageParam ? Number(pageParam) : undefined;

  try {
    const data = await datasahamApi.getTopStock({
      start,
      end,
      investorType,
      marketType,
      valueType,
      page,
      fresh: true,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch top stock', error);
    return NextResponse.json({ error: 'Failed to fetch top stock' }, { status: 500 });
  }
}
