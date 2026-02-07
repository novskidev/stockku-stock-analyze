import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

const trustLogos = ["MANDIRI", "BCA", "BNI", "AJAIB"];

const dashboardImage = "/images/landing-dashboard.jpg";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Live Market Data
            </span>
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-7xl">
              Master the
              <br />
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Market with
              </span>
              <br />
              <span className="text-primary">IDX Intel</span>
            </h1>
            <p className="max-w-xl text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
              Institutional-grade analytics for the retail investor. Track
              whales, analyze sentiment, and spot IPO momentum in real time with
              our advanced Bloomberg-style terminal.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-primary-foreground transition-all hover:scale-[1.02] hover:bg-primary/90 sm:w-auto"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border/70 px-8 text-base font-medium text-foreground transition-all hover:bg-foreground/5 sm:w-auto">
              <PlayCircle className="h-5 w-5" />
              Watch Demo
            </button>
          </div>

          <div className="border-t border-border/50 pt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/80">
              Trusted by traders from
            </p>
            <div className="mt-4 flex flex-wrap gap-6 text-xl font-bold text-foreground/40 grayscale">
              {trustLogos.map((logo) => (
                <span key={logo}>{logo}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative h-[360px] w-full sm:h-[480px] lg:col-span-6 lg:h-[620px] [perspective:1000px]">
          <div className="absolute inset-0 transition-transform duration-700 hover:[transform:rotateY(2deg)_scale(1.02)]">
            <div className="landing-card h-full w-full overflow-hidden rounded-2xl border border-border/60 shadow-2xl">
              <div className="flex h-8 items-center gap-2 border-b border-border/50 bg-secondary/80 px-4">
                <span className="h-3 w-3 rounded-full bg-red-500/50" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/50" />
                <span className="h-3 w-3 rounded-full bg-green-500/50" />
              </div>
              <div className="relative h-full w-full">
                <Image
                  src={dashboardImage}
                  alt="Stock market dashboard interface in dark mode"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-background/25 backdrop-brightness-75" />
                <div className="landing-panel absolute right-6 top-6 rounded-lg border border-primary/20 p-4 shadow-lg">
                  <div className="text-xs text-muted-foreground">Vol Spikes</div>
                  <div className="mt-1 text-xl font-bold text-primary">
                    GOTO +18%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-panel landing-float absolute -left-4 bottom-10 hidden w-56 rounded-lg border border-primary/30 p-4 shadow-xl sm:block sm:w-64 sm:-left-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/20 px-2 py-1 text-xs font-bold text-primary">
                  Whale Alert
                </span>
                <span className="text-xs font-semibold text-foreground">
                  BBRI.JK
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                2m ago
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/80">BUY</span>
                <span className="font-bold text-primary">1.2M Lots</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[85%] bg-primary" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Value: 650B IDR</span>
                <span>Accumulating</span>
              </div>
            </div>
          </div>

          <div className="landing-panel landing-float-slow absolute right-0 top-24 hidden w-56 rounded-lg border border-destructive/30 p-4 shadow-xl md:block md:-right-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Tech Sector</span>
              <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                Risk-Off
              </span>
            </div>
            <div className="text-2xl font-black text-foreground">-2.4%</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Heavy sell-off detected in early trading session.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
