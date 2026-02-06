import { LandingBackground } from "@/components/landing/landing-background";
import { LandingTicker } from "@/components/landing/landing-ticker";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingMap } from "@/components/landing/landing-map";
import { LandingBrokerCalendar } from "@/components/landing/landing-broker-calendar";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export function LandingPage() {
  return (
    <div className="landing min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <div className="relative">
        <LandingBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          <LandingTicker />
          <LandingNav />
          <main className="flex-1">
            <LandingHero />
            <LandingFeatures />
            <LandingMap />
            <LandingBrokerCalendar />
            <LandingCta />
          </main>
          <LandingFooter />
        </div>
      </div>
    </div>
  );
}
