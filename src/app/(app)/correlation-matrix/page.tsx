import { CorrelationMatrixClient } from '@/components/correlation-matrix-client';

export const dynamic = 'force-dynamic';

export default function CorrelationMatrixPage() {
  return (
    <CorrelationMatrixClient
      initialSymbols={['BBCA', 'BBRI', 'BMRI', 'TLKM']}
      initialPeriodDays={30}
    />
  );
}
