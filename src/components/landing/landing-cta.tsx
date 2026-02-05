import { LineChart } from "lucide-react";

export function LandingCta() {
  return (
    <section id="cta" className="relative px-6 py-20">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] to-[#161b22]" />
      <div className="relative z-10 mx-auto max-w-[960px] text-center">
        <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#13ec5b]/10">
          <LineChart className="h-7 w-7 text-[#13ec5b]" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          Ready to see what the<br />institutions see?
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Join 15,000+ retail investors using Stockku to level the playing field. Start your free 14-day trial today.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <button className="h-14 rounded-xl bg-[#13ec5b] px-10 text-lg font-bold text-[#0B0E14] shadow-[0_0_20px_rgba(19,236,91,0.3)] transition-all hover:-translate-y-1 hover:bg-[#0fd651]">
            Get Market Access
          </button>
          <button className="h-14 rounded-xl border border-slate-600 bg-[#1c242c] px-10 text-lg font-bold text-white transition-all hover:border-white hover:bg-white/5">
            View Pricing
          </button>
        </div>
        <p className="mt-6 text-sm text-slate-500">No credit card required for trial.</p>
      </div>
    </section>
  );
}
