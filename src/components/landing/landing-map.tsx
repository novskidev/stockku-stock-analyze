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
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-[#1c242c]/50" />
      <div className="relative z-10 mx-auto max-w-[1280px] px-6">
        <div className="rounded-2xl border border-[#28392e] bg-[#10151c] p-8 lg:p-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#13ec5b]/30 bg-[#13ec5b]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#13ec5b]">
                <Sparkles className="h-4 w-4" />
                Signal Command Center
              </div>
              <h3 className="mt-4 text-3xl font-bold text-white md:text-4xl">
                See the market the way desks do.
              </h3>
              <p className="mt-3 text-slate-400">
                Layer real-time signals, confirmations, and alerts into a single command view. Spot intent early, act with
                confidence.
              </p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#13ec5b] px-5 py-2 text-sm font-bold text-[#13ec5b] transition-colors hover:bg-[#13ec5b] hover:text-[#0B0E14]">
              Open Live Console
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
            <div className="rounded-2xl border border-[#28392e] bg-[#141a22] p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Radar className="h-4 w-4 text-[#13ec5b]" />
                Signal Radar
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {signals.map((signal) => (
                  <div
                    key={signal.title}
                    className="rounded-xl border border-[#28392e] bg-[#0B0E14] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{signal.title}</p>
                        <p className="mt-1 text-lg font-bold text-white">{signal.symbol}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                          signal.tone === "positive"
                            ? "bg-[#13ec5b]/15 text-[#13ec5b]"
                            : "bg-[#fa5538]/15 text-[#fa5538]"
                        }`}
                      >
                        {signal.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                      <span>{signal.detail}</span>
                      <span className="font-mono">{signal.strength}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full ${signal.tone === "positive" ? "bg-[#13ec5b]" : "bg-[#fa5538]"}`}
                        style={{ width: `${signal.strength}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-[#28392e] bg-[#141a22] p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Activity className="h-4 w-4 text-[#13ec5b]" />
                  Confirmation Stack
                </div>
                <div className="space-y-4">
                  {confirmations.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{item.label}</span>
                        <span className="font-mono text-white">{item.value}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full bg-gradient-to-r from-[#13ec5b] to-[#2dff87]" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#28392e] bg-[#141a22] p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <AlertTriangle className="h-4 w-4 text-[#fa5538]" />
                  Live Alerts
                </div>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.title} className="rounded-lg border border-[#1f2a33] bg-[#0B0E14] p-3">
                      <p className="text-sm font-semibold text-white">{alert.title}</p>
                      <p className="text-xs text-slate-400">{alert.note}</p>
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
