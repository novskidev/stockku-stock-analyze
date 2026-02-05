import { datasahamApi, TopMover } from '@/lib/datasaham-api';
import { StockAnalysisClient } from '@/components/stock-analysis-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

async function getStockData(symbol: string) {
  try {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    const fromDate = new Date(today);
    fromDate.setMonth(fromDate.getMonth() - 1);
    const from = fromDate.toISOString().split('T')[0];

    const [
      profile,
      brokerSummary,
      gainers,
      losers,
      mostActive,
      bandarAnalysis,
      sentiment,
      info,
      orderbook,
      historicalSummary,
      seasonality,
      subsidiary,
      keyStats,
      insights,
      technicalAnalysis,
      foreignOwnership,
      holdingComposition,
      insider,
    ] = await Promise.all([
      datasahamApi.getStockProfile(symbol).catch(() => null),
      datasahamApi.getBrokerSummary(symbol).catch(() => []),
      datasahamApi.getTopGainers().catch(() => []),
      datasahamApi.getTopLosers().catch(() => []),
      datasahamApi.getMostActive().catch(() => []),
      datasahamApi.getBandarAnalysis(symbol).catch(() => ({ accumulation: null, distribution: null, smartMoney: null, pumpDump: null })),
      datasahamApi.getMarketSentiment(symbol, { fresh: true }).catch(() => null),
      datasahamApi.getStockInfoDetail(symbol, { fresh: true }).catch(() => null),
      datasahamApi.getOrderbook(symbol, { fresh: true }).catch(() => null),
      datasahamApi.getHistoricalSummary(symbol, { startDate: from, endDate: to, fresh: true }).catch(() => null),
      datasahamApi.getSeasonality(symbol, { fresh: true }).catch(() => []),
      datasahamApi.getSubsidiary(symbol, { fresh: true }).catch(() => null),
      datasahamApi.getKeyStatsDetail(symbol, { fresh: true }).catch(() => null),
      datasahamApi.getInsights(symbol, { fresh: true }).catch(() => null),
      datasahamApi.getTechnicalAnalysis(symbol, { timeframe: 'daily', period: 20, indicator: 'all', fresh: true }).catch(() => null),
      datasahamApi.getForeignOwnership(symbol, { fresh: true }).catch(() => []),
      datasahamApi.getHoldingComposition(symbol, { fresh: true }).catch(() => []),
      datasahamApi.getInsider(symbol, { fresh: true }).catch(() => []),
    ]);

    const allStocks = [...gainers, ...losers, ...mostActive];
    const stockQuote = allStocks.find(s => s.symbol === symbol) || null;

    return {
      profile,
      brokerSummary,
      stockQuote,
      bandarAnalysis,
      sentiment,
      info,
      orderbook,
      historicalSummary,
      seasonality,
      subsidiary,
      keyStats,
      insights,
      technicalAnalysis,
      foreignOwnership,
      holdingComposition,
      insider,
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
      sentiment={data?.sentiment || null}
      info={data?.info || null}
      orderbook={data?.orderbook || null}
      historicalSummary={data?.historicalSummary || null}
      seasonality={data?.seasonality || []}
      subsidiary={data?.subsidiary || null}
      keyStats={data?.keyStats || null}
      insights={data?.insights || null}
      technicalAnalysis={data?.technicalAnalysis || null}
      foreignOwnership={data?.foreignOwnership || []}
      holdingComposition={data?.holdingComposition || []}
      insider={data?.insider || []}
    />
  );
}
