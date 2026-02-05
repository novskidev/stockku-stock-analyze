import { datasahamApi } from '@/lib/datasaham-api';
import { WhaleTransactionsClient } from '@/components/whale-transactions-client';

export const dynamic = 'force-dynamic';

const DEFAULT_SYMBOL = 'BBCA';

async function getInitialWhales() {
  try {
    const response = await datasahamApi.getWhaleTransactionsFull(DEFAULT_SYMBOL, { min_lot: 500, fresh: true });
    return { response, symbol: DEFAULT_SYMBOL };
  } catch {
    return { response: null, symbol: DEFAULT_SYMBOL };
  }
}

export default async function WhaleTransactionsPage() {
  const initialData = await getInitialWhales();
  return <WhaleTransactionsClient initialSymbol={initialData.symbol} initialResponse={initialData.response} />;
}
