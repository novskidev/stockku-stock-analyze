import { Activity, ArrowRight, Network, PieChart, Rocket } from "lucide-react";

const features = [
  {
    title: "Whale Detector",
    description:
      "Track large volume movements in real time. Visualize accumulation and distribution before the price moves.",
    icon: Activity,
  },
  {
    title: "Correlation Matrix",
    description:
      "Discover hidden relationships between assets. Optimize diversification with heat-map visualization.",
    icon: Network,
  },
  {
    title: "Broker Summary",
    description:
      "Deep dive into broker activities. See who is accumulating and who is dumping instantly.",
    icon: PieChart,
  },
  {
    title: "IPO Momentum",
    description:
      "Identify high-potential IPOs early. Analyze underwriter track records and momentum.",
    icon: Rocket,
  },
];

export function LandingFeatures() {
  return (
    <section className="relative border-t border-border/60 bg-background py-20">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-12 px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">Advanced Trading Tools</h2>
            <p className="mt-4 text-muted-foreground">
              Gain an edge with professional-grade data visualization and analysis tools designed for the modern trader.
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition-all hover:gap-3"
          >
            View All Features
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
