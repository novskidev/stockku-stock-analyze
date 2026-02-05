import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

const trustLogos = ["MANDIRI", "BCA", "BNI", "AJAIB"];

const dashboardImage = "/images/landing-dashboard.jpg";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 lg:pb-32 lg:pt-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#13ec5b]/30 bg-[#13ec5b]/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-[#13ec5b] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#13ec5b]">Live Market Data</span>
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Master the<br />
              <span className="bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                Market with
              </span>
              <br />
              <span className="text-[#13ec5b]">IDX Intel</span>
            </h1>
            <p className="max-w-xl text-base font-light leading-relaxed text-slate-400 sm:text-lg">
              Institutional-grade analytics for the retail investor. Track whales, analyze sentiment, and
              spot IPO momentum in real time with our advanced Bloomberg-style terminal.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#13ec5b] px-8 text-base font-bold text-[#0B0E14] transition-all hover:scale-[1.02] hover:bg-[#0fd651]"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-600 px-8 text-base font-medium text-white transition-all hover:bg-white/5">
              <PlayCircle className="h-5 w-5" />
              Watch Demo
            </button>
          </div>

          <div className="border-t border-white/10 pt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Trusted by traders from</p>
            <div className="mt-4 flex flex-wrap gap-6 text-xl font-bold text-white/40 grayscale">
              {trustLogos.map((logo) => (
                <span key={logo}>{logo}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative h-[520px] w-full lg:col-span-6 lg:h-[620px] [perspective:1000px]">
          <div className="absolute inset-0 transition-transform duration-700 hover:[transform:rotateY(2deg)_scale(1.02)]">
            <div className="landing-card h-full w-full overflow-hidden rounded-2xl border border-[#2a343c] shadow-2xl">
              <div className="flex h-8 items-center gap-2 border-b border-[#1f2a33] bg-[#0d1116] px-4">
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
                <div className="absolute inset-0 bg-[#0B0E14]/25 backdrop-brightness-75" />
                <div className="landing-panel absolute right-6 top-6 rounded-lg border border-[#13ec5b]/20 p-4 shadow-lg">
                  <div className="text-xs text-slate-400">Vol Spikes</div>
                  <div className="mt-1 text-xl font-bold text-[#13ec5b]">GOTO +18%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-panel landing-float absolute -left-6 bottom-12 w-64 rounded-lg border border-[#13ec5b]/30 p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#13ec5b]/20 px-2 py-1 text-xs font-bold text-[#13ec5b]">Whale Alert</span>
                <span className="text-xs font-semibold text-white">BBRI.JK</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">2m ago</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">BUY</span>
                <span className="font-bold text-[#13ec5b]">1.2M Lots</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                <div className="h-full w-[85%] bg-[#13ec5b]" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Value: 650B IDR</span>
                <span>Accumulating</span>
              </div>
            </div>
          </div>

          <div className="landing-panel landing-float-slow absolute -right-3 top-24 w-56 rounded-lg border border-[#fa5538]/30 p-4 shadow-xl">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-bold text-white">Tech Sector</span>
              <span className="rounded-full bg-[#fa5538]/15 px-2 py-0.5 text-[10px] font-semibold text-[#fa5538]">
                Risk-Off
              </span>
            </div>
            <div className="text-2xl font-black text-white">-2.4%</div>
            <p className="mt-1 text-xs text-slate-400">
              Heavy sell-off detected in early trading session.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
