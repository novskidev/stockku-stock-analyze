import { BrokerCalendarClient } from '@/components/broker-calendar-client';

export const dynamic = 'force-dynamic';

export default function BrokerCalendarPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Broker Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan broker dan emiten untuk melihat net lot harian pada kalender.
        </p>
      </div>
      <BrokerCalendarClient />
    </main>
  );
}
