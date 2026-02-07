import Link from "next/link";
import { BarChart3 } from "lucide-react";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Whale Detector", href: "/whale-transactions" },
      { label: "Screener", href: "/movers" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Learning Center", href: "#" },
      { label: "Market Blog", href: "#" },
      { label: "API Docs", href: "#" },
      { label: "Community", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-background px-4 pb-8 pt-16 sm:px-6">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-2 lg:col-span-2">
            <div className="mb-6 flex items-center gap-2 text-foreground">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Stockku.</span>
            </div>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              The ultimate market intelligence platform for the modern retail investor. Data provided by IDX and
              global exchanges.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">Twitter</a>
              <a href="#" className="transition-colors hover:text-foreground">LinkedIn</a>
              <a href="#" className="transition-colors hover:text-foreground">Instagram</a>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="mb-6 font-bold text-foreground">{section.title}</h4>
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                {section.links.map((link) => {
                  const isPlaceholder = link.href.startsWith("#");
                  const className = "transition-colors hover:text-primary";
                  return (
                    <li key={link.label}>
                      {isPlaceholder ? (
                        <a href={link.href} className={className}>
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className={className}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground/70 md:flex-row md:items-center md:justify-between">
          <p>(c) 2026 Stockku Intelligence. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="transition-colors hover:text-muted-foreground">Terms of Service</a>
            <a href="#" className="transition-colors hover:text-muted-foreground">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-muted-foreground">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
