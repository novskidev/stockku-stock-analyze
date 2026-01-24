'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Rocket, Activity, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/retail-opportunity', label: 'Retail Opportunity', icon: Rocket },
  { href: '/movers', label: 'Movers', icon: Activity },
  { href: '/ipo-momentum', label: 'IPO Momentum', icon: Rocket },
  { href: '/whale-transactions', label: 'Whale Detector', icon: Users },
  { href: '/broker-summary', label: 'Broker Summary', icon: Shield },
  { href: '/broker-calendar', label: 'Broker Calendar', icon: Shield },
  { href: '/market-sentiment', label: 'Market Sentiment', icon: Shield },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">IDX Market Intelligence</p>
            <p className="text-lg font-bold leading-tight">StockAnalyzer</p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className="whitespace-nowrap"
              >
                <Link href={item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
