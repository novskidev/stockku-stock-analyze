import { datasahamApi } from '@/lib/datasaham-api';
import { WhaleTransactionsClient } from '@/components/whale-transactions-client';

export const dynamic = 'force-dynamic';

const DEFAULT_SYMBOL = 'BBCA';

async function getInitialWhales() {
  try {
    const data = await datasahamApi.getWhaleTransactions(DEFAULT_SYMBOL, { min_lot: 500, fresh: true });
    return { data, symbol: DEFAULT_SYMBOL };
  } catch {
    return { data: null, symbol: DEFAULT_SYMBOL };
  }
}

export default async function WhaleTransactionsPage() {
  const initialData = await getInitialWhales();
  return <WhaleTransactionsClient initialSymbol={initialData.symbol} initialData={initialData.data} />;
}
