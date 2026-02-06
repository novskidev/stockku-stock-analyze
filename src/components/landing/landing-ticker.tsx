const tickerItems = [
  { label: "IHSG", value: "7,340.12", change: "+0.45%", positive: true },
  { label: "LQ45", value: "982.50", change: "+1.12%", positive: true },
  { label: "GOTO", value: "84", change: "+12.4%", positive: true },
  { label: "BBCA", value: "9,200", change: "-0.25%", positive: false },
  { label: "ASII", value: "5,125", change: "+0.80%", positive: true },
  { label: "TLKM", value: "3,850", change: "-1.05%", positive: false },
  { label: "BMRI", value: "6,400", change: "+2.15%", positive: true },
];

export function LandingTicker() {
  const loopItems = [...tickerItems, ...tickerItems];

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 py-2">
      <div className="overflow-hidden">
        <div className="landing-ticker-track flex w-max items-center gap-8 px-4">
          {loopItems.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-bold text-foreground">{item.value}</span>
              <span className={item.positive ? "text-primary" : "text-destructive"}>
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
