import { datasahamApi, DEFAULT_MOVER_FILTERS, MoverFilter, MoverType } from '@/lib/datasaham-api';
import { MoversClient } from '@/components/movers-client';

export const dynamic = 'force-dynamic';

const DEFAULT_TYPES: MoverType[] = [
  'top-gainer',
  'top-loser',
  'top-value',
  'top-volume',
  'top-frequency',
  'net-foreign-buy',
  'net-foreign-sell',
];

async function getMoversData() {
  try {
    const results = await Promise.all(
      DEFAULT_TYPES.map(async (type) => {
        const data = await datasahamApi.getMovers(type, { fresh: true });
        return { type, data };
      })
    );
    return results;
  } catch {
    return [];
  }
}

export default async function MoversPage() {
  const initialMovers = await getMoversData();
  return <MoversClient initialMovers={initialMovers} defaultFilters={[]} />;
}
