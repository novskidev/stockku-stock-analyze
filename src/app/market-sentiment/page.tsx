import { MarketSentimentClient } from '@/components/market-sentiment-client';
import { datasahamApi } from '@/lib/datasaham-api';

export const dynamic = 'force-dynamic';

const DEFAULT_SYMBOL = 'BBCA';

async function getInitialSentiment() {
  try {
    const sentiment = await datasahamApi.getMarketSentiment(DEFAULT_SYMBOL, { fresh: true });
    return { sentiment, symbol: DEFAULT_SYMBOL };
  } catch {
    return { sentiment: null, symbol: DEFAULT_SYMBOL };
  }
}

export default async function MarketSentimentPage() {
  const initialData = await getInitialSentiment();
  return <MarketSentimentClient initialSymbol={initialData.symbol} initialSentiment={initialData.sentiment} />;
}
