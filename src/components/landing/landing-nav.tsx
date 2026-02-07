"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Menu, X } from "lucide-react";

const navLinks = [
  { href: "/retail-opportunity", label: "Retail Opps" },
  { href: "/movers", label: "Movers" },
  { href: "/whale-transactions", label: "Whale Detector" },
  { href: "/correlation-matrix", label: "Correlation" },
  { href: "/market-sentiment", label: "Sentiment" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-10 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-10">
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

        <nav className="hidden md:flex items-center gap-6">
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
            className="text-foreground/80 transition hover:text-foreground md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <a
            href="/dashboard"
            className="hidden h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 md:flex"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border/60 bg-background/95 md:hidden">
          <nav className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
