import { datasahamApi, TopMover } from '@/lib/datasaham-api';
import { DashboardClient } from '@/components/dashboard-client';

export const dynamic = 'force-dynamic';

async function getMarketData() {
  try {
    const [gainers, losers, mostActive, foreignBuy] = await Promise.all([
      datasahamApi.getTopGainers({ fresh: true }).catch(() => [] as TopMover[]),
      datasahamApi.getTopLosers({ fresh: true }).catch(() => [] as TopMover[]),
      datasahamApi.getMostActive({ fresh: true }).catch(() => [] as TopMover[]),
      datasahamApi.getNetForeignBuy({ fresh: true }).catch(() => [] as TopMover[]),
    ]);

    return {
      gainers,
      losers,
      mostActive,
      foreignBuy,
    };
  } catch {
    return {
      gainers: [],
      losers: [],
      mostActive: [],
      foreignBuy: [],
    };
  }
}

export default async function HomePage() {
  const marketData = await getMarketData();

  return <DashboardClient initialData={marketData} />;
}
