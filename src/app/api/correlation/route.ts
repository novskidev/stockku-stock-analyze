import { NextResponse } from 'next/server';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

function parseSymbols(input: string | null): string[] {
  if (!input) return [];
  const raw = input
    .split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const symbol of raw) {
    if (!seen.has(symbol)) {
      seen.add(symbol);
      unique.push(symbol);
    }
  }
  return unique;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbols = parseSymbols(url.searchParams.get('symbols'));
  const periodParam = url.searchParams.get('period_days');

  if (symbols.length < 2) {
    return NextResponse.json({ error: 'At least two symbols are required' }, { status: 400 });
  }

  let periodDays: number | undefined;
  if (periodParam !== null) {
    const parsed = Number(periodParam);
    if (!Number.isFinite(parsed) || parsed < 7 || parsed > 365) {
      return NextResponse.json({ error: 'period_days must be between 7 and 365' }, { status: 400 });
    }
    periodDays = Math.round(parsed);
  }

  try {
    const data = await datasahamApi.getCorrelation(symbols, { period_days: periodDays, fresh: true });
    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch correlation data' }, { status: 502 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch correlation data', error);
    return NextResponse.json({ error: 'Failed to fetch correlation data' }, { status: 500 });
  }
}
