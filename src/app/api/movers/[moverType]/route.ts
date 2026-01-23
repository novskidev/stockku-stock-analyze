import { NextResponse } from 'next/server';
import { datasahamApi, DEFAULT_MOVER_FILTERS, MoverFilter, MoverType } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

const ALL_MOVER_TYPES: MoverType[] = [
  'top-gainer',
  'top-loser',
  'top-value',
  'top-volume',
  'top-frequency',
  'net-foreign-buy',
  'net-foreign-sell',
  'iep-current-top-gainer',
  'iep-current-top-loser',
  'iep-prev-top-gainer',
  'iep-prev-top-loser',
  'iev-top-gainer',
  'iev-top-loser',
  'ieval-top-gainer',
  'ieval-top-loser',
];

const ALL_MOVER_FILTERS: MoverFilter[] = [
  'FILTER_STOCKS_TYPE_MAIN_BOARD',
  'FILTER_STOCKS_TYPE_DEVELOPMENT_BOARD',
  'FILTER_STOCKS_TYPE_ACCELERATION_BOARD',
  'FILTER_STOCKS_TYPE_NEW_ECONOMY_BOARD',
  'FILTER_STOCKS_TYPE_SPECIAL_MONITORING_BOARD',
];

function isMoverType(value: string): value is MoverType {
  return ALL_MOVER_TYPES.includes(value as MoverType);
}

function isMoverFilter(value: string): value is MoverFilter {
  return ALL_MOVER_FILTERS.includes(value as MoverFilter);
}

export async function GET(request: Request, { params }: { params: { moverType: string } }) {
  const moverTypeParam = params.moverType;

  if (!isMoverType(moverTypeParam)) {
    return NextResponse.json({ error: 'Invalid mover type' }, { status: 400 });
  }

  const url = new URL(request.url);
  const filtersFromQuery = url.searchParams.getAll('filterStocks').filter(isMoverFilter);
  const filters = filtersFromQuery.length > 0 ? filtersFromQuery : DEFAULT_MOVER_FILTERS;

  try {
    const data = await datasahamApi.getMovers(moverTypeParam, {
      fresh: true,
      filters,
    });

    return NextResponse.json({ moverType: moverTypeParam, filters, data });
  } catch (error) {
    console.error('Failed to fetch mover data', error);
    return NextResponse.json({ error: 'Failed to fetch mover data' }, { status: 500 });
  }
}
