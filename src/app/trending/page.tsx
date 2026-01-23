import { datasahamApi } from '@/lib/datasaham-api';
import { TrendingClient } from '@/components/trending-client';

export const dynamic = 'force-dynamic';

async function getTrendingData() {
  try {
    const trending = await datasahamApi.getTrending({ fresh: true });
    return trending;
  } catch {
    return [];
  }
}

export default async function TrendingPage() {
  const trending = await getTrendingData();
  return <TrendingClient initialData={trending} />;
}
