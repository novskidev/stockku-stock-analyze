import { datasahamApi } from '@/lib/datasaham-api';
import { BrokerSummaryClient } from '@/components/broker-summary-client';

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
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Broker Summary</h1>
        <p className="text-muted-foreground text-sm">
          Lihat broker yang masih memegang saham, total lot, nilai net, dan rata-rata pembelian.
        </p>
      </div>
      <BrokerSummaryClient initialSymbol={defaultSymbol} initialData={data} initialFrom={from} initialTo={to} />
    </main>
  );
}
