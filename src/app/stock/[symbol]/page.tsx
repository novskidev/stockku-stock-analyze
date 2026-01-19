import { datasahamApi, TopMover } from '@/lib/datasaham-api';
import { StockAnalysisClient } from '@/components/stock-analysis-client';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

async function getStockData(symbol: string) {
  try {
    const [profile, brokerSummary, gainers, losers, mostActive, bandarAnalysis] = await Promise.all([
      datasahamApi.getStockProfile(symbol).catch(() => null),
      datasahamApi.getBrokerSummary(symbol).catch(() => []),
      datasahamApi.getTopGainers().catch(() => []),
      datasahamApi.getTopLosers().catch(() => []),
      datasahamApi.getMostActive().catch(() => []),
      datasahamApi.getBandarAnalysis(symbol).catch(() => ({ accumulation: null, distribution: null, smartMoney: null, pumpDump: null })),
    ]);

    const allStocks = [...gainers, ...losers, ...mostActive];
    const stockQuote = allStocks.find(s => s.symbol === symbol) || null;

    return {
      profile,
      brokerSummary,
      stockQuote,
      bandarAnalysis,
    };
  } catch {
    return null;
  }
}

export default async function StockPage({ params }: PageProps) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  
  const data = await getStockData(upperSymbol);

  return (
    <StockAnalysisClient 
      symbol={upperSymbol}
      profile={data?.profile || null}
      brokerSummary={data?.brokerSummary || []}
      stockQuote={data?.stockQuote || null}
      bandarAnalysis={data?.bandarAnalysis || { accumulation: null, distribution: null, smartMoney: null, pumpDump: null }}
    />
  );
}
