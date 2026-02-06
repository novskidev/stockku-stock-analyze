import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

const dailyNetLots = [
  {
    date: "Feb 10",
    totalNetLot: "+1,240,500",
    totalValue: "IDR 615B",
    brokers: [
      { code: "YP", netLot: "+420,000", avgPrice: "9,120", netValue: "IDR 192B" },
      { code: "CC", netLot: "+310,500", avgPrice: "9,115", netValue: "IDR 141B" },
      { code: "BQ", netLot: "+205,000", avgPrice: "9,090", netValue: "IDR 93B" },
      { code: "PD", netLot: "+180,000", avgPrice: "9,080", netValue: "IDR 82B" },
      { code: "BK", netLot: "+125,000", avgPrice: "9,075", netValue: "IDR 57B" },
    ],
  },
  {
    date: "Feb 11",
    totalNetLot: "+980,200",
    totalValue: "IDR 498B",
    brokers: [
      { code: "YP", netLot: "+280,000", avgPrice: "9,140", netValue: "IDR 128B" },
      { code: "DR", netLot: "+240,200", avgPrice: "9,130", netValue: "IDR 110B" },
      { code: "CC", netLot: "+190,000", avgPrice: "9,120", netValue: "IDR 87B" },
      { code: "BK", netLot: "+160,000", avgPrice: "9,100", netValue: "IDR 73B" },
      { code: "BQ", netLot: "+110,000", avgPrice: "9,090", netValue: "IDR 50B" },
    ],
  },
  {
    date: "Feb 12",
    totalNetLot: "+1,540,000",
    totalValue: "IDR 804B",
    brokers: [
      { code: "CC", netLot: "+520,000", avgPrice: "9,160", netValue: "IDR 238B" },
      { code: "YP", netLot: "+430,000", avgPrice: "9,155", netValue: "IDR 197B" },
      { code: "BQ", netLot: "+280,000", avgPrice: "9,140", netValue: "IDR 128B" },
      { code: "DR", netLot: "+190,000", avgPrice: "9,135", netValue: "IDR 87B" },
      { code: "BK", netLot: "+120,000", avgPrice: "9,120", netValue: "IDR 54B" },
    ],
  },
];

export function LandingBrokerCalendar() {
  return (
    <section className="relative border-t border-border/60 bg-background py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="rounded-2xl border border-border/60 bg-secondary p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <CalendarDays className="h-4 w-4" />
                Net Lot Calendar
              </div>
              <h3 className="mt-4 text-3xl font-bold text-foreground">Calendar pembelian net lot per emiten.</h3>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Rangkaian aktivitas broker harian untuk satu emiten. Lihat akumulasi bersih, harga rata-rata, dan nilai
                transaksi per broker.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-foreground/80">
                <span className="rounded-full border border-border/60 bg-background px-3 py-1">Emiten: BBRI</span>
                <span className="rounded-full border border-border/60 bg-background px-3 py-1">Periode: 3 hari</span>
                <span className="rounded-full border border-border/60 bg-background px-3 py-1">T+0 data</span>
              </div>
            </div>
            <Link
              href="/broker-calendar"
              className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Open Calendar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 space-y-6">
            {dailyNetLots.map((day) => (
              <div key={day.date} className="rounded-2xl border border-border/60 bg-background p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/80">{day.date}</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">Net buy summary</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="rounded-lg border border-border/60 bg-muted px-3 py-2">
                      <p className="text-xs text-muted-foreground/80">Total Net Lot</p>
                      <p className="text-sm font-bold text-primary">{day.totalNetLot}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted px-3 py-2">
                      <p className="text-xs text-muted-foreground/80">Net Value</p>
                      <p className="text-sm font-bold text-foreground">{day.totalValue}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
                  <div className="grid grid-cols-4 gap-4 bg-muted px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                    <span>Broker</span>
                    <span>Net Lot</span>
                    <span>Avg Price</span>
                    <span>Net Value</span>
                  </div>
                  {day.brokers.map((broker) => (
                    <div
                      key={`${day.date}-${broker.code}`}
                      className="grid grid-cols-4 gap-4 border-t border-border/50 px-4 py-3 text-sm text-foreground/80"
                    >
                      <span className="font-semibold text-foreground">{broker.code}</span>
                      <span className="font-mono text-primary">{broker.netLot}</span>
                      <span className="font-mono">{broker.avgPrice}</span>
                      <span className="font-mono">{broker.netValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
