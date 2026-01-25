import { BrokerCalendarClient } from '@/components/broker-calendar-client';
import { PageHeader } from '@/components/page-header';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function BrokerCalendarPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <PageHeader
        eyebrow="Time Series"
        title="Broker Calendar"
        description="Masukkan broker dan emiten untuk melihat net lot harian pada kalender."
        icon={<Calendar className="h-6 w-6 text-primary" />}
        className="mb-6"
      />
      <BrokerCalendarClient />
    </main>
  );
}
