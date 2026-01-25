'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, Rocket, Activity, Users, Shield, Network, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/retail-opportunity', label: 'Retail Opportunity', icon: Rocket },
  { href: '/movers', label: 'Movers', icon: Activity },
  { href: '/ipo-momentum', label: 'IPO Momentum', icon: Rocket },
  { href: '/whale-transactions', label: 'Whale Detector', icon: Users },
  { href: '/correlation-matrix', label: 'Correlation Matrix', icon: Network },
  { href: '/broker-summary', label: 'Broker Summary', icon: Shield },
  { href: '/broker-calendar', label: 'Broker Calendar', icon: Shield },
  { href: '/market-sentiment', label: 'Market Sentiment', icon: Shield },
];

export function SiteNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('sidebar-collapsed') : null;
    if (stored === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sidebar-collapsed', String(collapsed));
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/70 via-primary/20 to-chart-2/30 blur-md opacity-70 transition group-hover:opacity-100" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-card/80 shadow-sm">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">IDX Intel</p>
              <p className="text-base font-semibold font-display tracking-tight">Stockku</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/70 text-muted-foreground transition hover:text-foreground hover:border-border"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[85%] max-w-[320px] border-r border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col gap-6 px-4 py-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="group flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <div className="relative h-11 w-11">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/70 via-primary/20 to-chart-2/30 blur-md opacity-70 transition group-hover:opacity-100" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-card/80 shadow-sm">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">IDX Intel</p>
                  <p className="text-lg font-semibold font-display tracking-tight">Stockku</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/70 text-muted-foreground transition hover:text-foreground hover:border-border"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition",
                        isActive
                          ? "border-primary/50 bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:border-border/60 hover:bg-secondary/60 hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 flex-none",
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </aside>
      </div>

      <aside
        className={cn(
          "hidden lg:flex sticky top-0 z-40 h-screen shrink-0 border-r border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 transition-[width] duration-200",
          collapsed ? "w-20" : "w-20 sm:w-24 lg:w-64"
        )}
      >
        <div className="relative flex h-full flex-col gap-6 px-3 py-6 sm:px-4">
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/70 via-primary/20 to-chart-2/30 blur-md opacity-70 transition group-hover:opacity-100" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-card/80 shadow-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className={cn("hidden lg:block", collapsed && "lg:hidden")}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">IDX Intel</p>
                <p className="text-lg font-semibold font-display tracking-tight">Stockku</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card/70 text-muted-foreground transition hover:text-foreground hover:border-border"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition",
                      isActive
                        ? "border-primary/50 bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:border-border/60 hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 flex-none",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className={cn("hidden lg:inline", collapsed && "lg:hidden")}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className={cn("hidden lg:block rounded-2xl border border-border/60 bg-card/60 p-4 text-xs text-muted-foreground", collapsed && "lg:hidden")}>
            <p className="uppercase tracking-[0.3em]">Market Pulse</p>
            <p className="mt-2 text-sm text-foreground">Stay adaptive. Track flow + volatility.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
