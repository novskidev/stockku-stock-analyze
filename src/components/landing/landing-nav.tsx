import Link from "next/link";
import { ArrowRight, BarChart3, Menu } from "lucide-react";

const navLinks = [
  { href: "/retail-opportunity", label: "Retail Opps" },
  { href: "/movers", label: "Movers" },
  { href: "/whale-transactions", label: "Whale Detector" },
  { href: "/correlation-matrix", label: "Correlation" },
  { href: "/market-sentiment", label: "Sentiment" },
];

export function LandingNav() {
  return (
    <header className="sticky top-10 z-40 w-full border-b border-[#28392e] bg-[#0b0f14]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#13ec5b]/10 text-[#13ec5b]">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div className="text-white">
            <p className="text-lg font-bold tracking-tight">Stockku<span className="text-[#13ec5b]">.</span></p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">IDX Intel</p>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-[#13ec5b]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button className="text-slate-300 transition hover:text-white lg:hidden" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <a
            href="#cta"
            className="hidden h-9 items-center justify-center rounded-lg bg-[#13ec5b] px-4 text-sm font-bold text-[#0B0E14] transition hover:bg-[#0fd651] lg:flex"
          >
            Get Access
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
