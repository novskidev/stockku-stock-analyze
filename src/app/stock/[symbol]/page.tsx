import { datasahamApi } from '@/lib/datasaham-api';
import { StockAnalysisClient } from '@/components/stock-analysis-client';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

async function getStockData(symbol: string) {
  try {
    const [profile, brokerSummary] = await Promise.all([
      datasahamApi.getStockProfile(symbol).catch(() => null),
      datasahamApi.getBrokerSummary(symbol).catch(() => ({ data: [] })),
    ]);

    return {
      profile,
      brokerSummary: brokerSummary.data || [],
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
    />
  );
}
