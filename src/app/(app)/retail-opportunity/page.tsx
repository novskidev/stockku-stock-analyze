import { datasahamApi } from '@/lib/datasaham-api';
import { RetailOpportunityClient } from '@/components/retail-opportunity-client';

export const dynamic = 'force-dynamic';

async function getRetailData() {
  const [multibagger, breakout, sectorRotation] = await Promise.all([
    datasahamApi.getMultibaggerScan({ fresh: true }).catch(() => null),
    datasahamApi.getBreakoutAlerts({ fresh: true }).catch(() => null),
    datasahamApi.getSectorRotation({ fresh: true }).catch(() => null),
  ]);
  
  return { multibagger, breakout, sectorRotation };
}

export default async function RetailOpportunityPage() {
  const data = await getRetailData();
  
  return <RetailOpportunityClient {...data} />;
}
