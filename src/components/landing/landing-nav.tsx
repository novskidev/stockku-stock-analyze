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
    <header className="sticky top-10 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div className="text-foreground">
            <p className="text-lg font-bold tracking-tight">
              Stockku<span className="text-primary">.</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              IDX Intel
            </p>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            className="text-foreground/80 transition hover:text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <a
            href="/dashboard"
            className="hidden h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 lg:flex"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
