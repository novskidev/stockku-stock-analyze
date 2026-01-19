import { datasahamApi, TopMover } from '@/lib/datasaham-api';
import { DashboardClient } from '@/components/dashboard-client';

async function getMarketData() {
  try {
    const [gainers, losers, mostActive, foreignBuy] = await Promise.all([
      datasahamApi.getTopGainers().catch(() => [] as TopMover[]),
      datasahamApi.getTopLosers().catch(() => [] as TopMover[]),
      datasahamApi.getMostActive().catch(() => [] as TopMover[]),
      datasahamApi.getNetForeignBuy().catch(() => [] as TopMover[]),
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
