import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const minScoreParam = url.searchParams.get('min_score');
  const sector = url.searchParams.get('sector') || undefined;
  const maxResultsParam = url.searchParams.get('max_results');

  const min_score = minScoreParam ? Number(minScoreParam) : undefined;
  const max_results = maxResultsParam ? Number(maxResultsParam) : undefined;

  try {
    const data = await datasahamApi.getRetailOpportunity({
      fresh: true,
      min_score,
      sector: sector || undefined,
      max_results,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch retail opportunity data', error);
    return NextResponse.json({ error: 'Failed to fetch retail opportunity data' }, { status: 500 });
  }
}
