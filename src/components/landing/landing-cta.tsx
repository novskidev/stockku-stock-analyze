import { LineChart } from "lucide-react";

export function LandingCta() {
  return (
    <section id="cta" className="relative px-4 py-16 sm:px-6 sm:py-20">
      <div className="absolute inset-0 bg-gradient-to-t from-background to-secondary" />
      <div className="relative z-10 mx-auto max-w-[960px] text-center">
        <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <LineChart className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Ready to see what the<br />institutions see?
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Join 15,000+ retail investors using Stockku to level the playing field. Start your free 14-day trial today.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <button className="h-14 w-full rounded-xl bg-primary px-10 text-lg font-bold text-primary-foreground shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_35%,transparent)] transition-all hover:-translate-y-1 hover:bg-primary/90 sm:w-auto">
            Get Market Access
          </button>
          <button className="h-14 w-full rounded-xl border border-border/70 bg-secondary px-10 text-lg font-bold text-foreground transition-all hover:border-foreground/70 hover:bg-foreground/5 sm:w-auto">
            View Pricing
          </button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground/80">No credit card required for trial.</p>
      </div>
    </section>
  );
}
