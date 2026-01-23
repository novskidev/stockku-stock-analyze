import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || searchParams.get('keyword');
  const pageParam = searchParams.get('page');
  const page = pageParam ? Number(pageParam) : undefined;

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const searchResult = await datasahamApi.search(query, { page, type: 'company', fresh: true });
    const results = searchResult.company
      .filter(c => c.type === 'Saham' && c.is_tradeable)
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name,
        desc: c.desc,
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
