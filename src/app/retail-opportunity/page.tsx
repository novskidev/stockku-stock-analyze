import { datasahamApi } from '@/lib/datasaham-api';
import { RetailOpportunityClient } from '@/components/retail-opportunity-client';

async function getRetailData() {
  const [multibagger, breakout, sectorRotation] = await Promise.all([
    datasahamApi.getMultibaggerScan().catch(() => null),
    datasahamApi.getBreakoutAlerts().catch(() => null),
    datasahamApi.getSectorRotation().catch(() => null),
  ]);
  
  return { multibagger, breakout, sectorRotation };
}

export default async function RetailOpportunityPage() {
  const data = await getRetailData();
  
  return <RetailOpportunityClient {...data} />;
}
