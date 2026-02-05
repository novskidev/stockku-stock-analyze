import { datasahamApi } from '@/lib/datasaham-api';
import { BrokerSummaryClient } from '@/components/broker-summary-client';
import { PageHeader } from '@/components/page-header';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getInitialData(symbol: string) {
  const today = new Date();
  const to = today.toISOString().split('T')[0];
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 30);
  const from = fromDate.toISOString().split('T')[0];

  const data = await datasahamApi.getBrokerSummaryRange(symbol, { from, to, fresh: true }).catch(() => []);
  return { data, from, to };
}

export default async function BrokerSummaryPage() {
  const defaultSymbol = 'BBCA';
  const { data, from, to } = await getInitialData(defaultSymbol);

  return (
    <main className="container mx-auto px-4 py-6">
      <PageHeader
        eyebrow="Broker Flow"
        title="Broker Summary"
        description="Lihat broker yang masih memegang saham, total lot, nilai net, dan rata-rata pembelian."
        icon={<Shield className="h-6 w-6 text-primary" />}
        className="mb-6"
      />
      <BrokerSummaryClient initialSymbol={defaultSymbol} initialData={data} initialFrom={from} initialTo={to} />
    </main>
  );
}
