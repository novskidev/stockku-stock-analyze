import { Activity, AlertTriangle, BarChart3, Radar, Sparkles } from "lucide-react";

const signals = [
  {
    title: "Whale Flow Spike",
    symbol: "BBRI",
    detail: "+1.2M lots",
    status: "Accumulating",
    tone: "positive",
    strength: 86,
  },
  {
    title: "Momentum Break",
    symbol: "GOTO",
    detail: "+12.4%",
    status: "Breakout",
    tone: "positive",
    strength: 74,
  },
  {
    title: "Sentiment Shift",
    symbol: "TLKM",
    detail: "Bearish",
    status: "Risk-Off",
    tone: "negative",
    strength: 63,
  },
  {
    title: "Broker Rotation",
    symbol: "ASII",
    detail: "Net buy",
    status: "Rotation",
    tone: "positive",
    strength: 58,
  },
];

const confirmations = [
  { label: "Liquidity", value: 82 },
  { label: "Volume", value: 67 },
  { label: "Sentiment", value: 54 },
  { label: "Flow", value: 73 },
];

const alerts = [
  { title: "Early IPO Pulse", note: "Demand heat up 3 days before listing" },
  { title: "Cross-Asset Divergence", note: "IDX vs. regional tech gap widening" },
  { title: "Broker Accumulation", note: "Top 3 houses building quietly" },
];

export function LandingMap() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="absolute inset-0 bg-muted/60" />
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 lg:p-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-4 w-4" />
                Signal Command Center
              </div>
              <h3 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">
                See the market the way desks do.
              </h3>
              <p className="mt-3 text-muted-foreground">
                Layer real-time signals, confirmations, and alerts into a single command view. Spot intent early, act with
                confidence.
              </p>
            </div>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-5 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:w-auto">
              Open Live Console
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.9fr]">
            <div className="rounded-2xl border border-border/60 bg-secondary p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground/80">
                <Radar className="h-4 w-4 text-primary" />
                Signal Radar
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {signals.map((signal) => (
                  <div
                    key={signal.title}
                    className="rounded-xl border border-border/60 bg-background p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">{signal.title}</p>
                        <p className="mt-1 text-lg font-bold text-foreground">{signal.symbol}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                          signal.tone === "positive"
                            ? "bg-primary/15 text-primary"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {signal.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-foreground/80">
                      <span>{signal.detail}</span>
                      <span className="font-mono">{signal.strength}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${signal.tone === "positive" ? "bg-primary" : "bg-destructive"}`}
                        style={{ width: `${signal.strength}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-border/60 bg-secondary p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground/80">
                  <Activity className="h-4 w-4 text-primary" />
                  Confirmation Stack
                </div>
                <div className="space-y-4">
                  {confirmations.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.label}</span>
                        <span className="font-mono text-foreground">{item.value}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-gradient-to-r from-primary to-primary/60" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-secondary p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground/80">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Live Alerts
                </div>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.title} className="rounded-lg border border-border/60 bg-background p-3">
                      <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
