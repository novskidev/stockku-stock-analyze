import { datasahamApi } from '@/lib/datasaham-api';
import { IpoMomentumClient } from '@/components/ipo-momentum-client';

export const dynamic = 'force-dynamic';

async function getMomentum() {
  const data = await datasahamApi.getIpoMomentum({ fresh: true }).catch(() => null);
  return data;
}

export default async function IpoMomentumPage() {
  const data = await getMomentum();
  return <IpoMomentumClient data={data} />;
}
