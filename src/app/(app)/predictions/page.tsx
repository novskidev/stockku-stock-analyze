import { PredictionClient } from '@/components/prediction-client';

export const dynamic = 'force-dynamic';

const DEFAULT_SYMBOL = 'BBCA';

export default function PredictionsPage() {
  return <PredictionClient defaultSymbol={DEFAULT_SYMBOL} />;
}
