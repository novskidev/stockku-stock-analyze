# Stockku Landing Page Design

## Goal
Create a new marketing landing page at `/` that mirrors the provided dark, glassmorphism-heavy theme while keeping the existing app dashboard accessible at `/dashboard`. The landing should feel premium, data-driven, and IDX-focused, with sections that match the reference layout.

## Structure
- **Root layout** remains for fonts and global styling.
- **App layout** is moved into a route group `(app)` to keep `SiteNav` and the dashboard experience isolated from the landing.
- **Landing components** live in `src/components/landing/*` and are composed by `src/app/page.tsx`.

## Sections
1. Ticker bar (looping market items, paused on hover)
2. Sticky navbar (brand, nav links, CTA)
3. Hero (headline, CTAs, mock dashboard preview, floating cards)
4. Feature grid (4 key modules)
5. Global map + regional indices panel
6. CTA banner
7. Footer (platform/resources/company links)

## Styling
- Dark base `#0B0E14`, neon green accent `#13ec5b`, red accent `#fa5538`.
- Glass panels via `.landing-panel` and `.landing-card` utility classes.
- Background grid and glow orbs for depth.
- Lightweight CSS animations for ticker and floating cards, disabled for reduced motion.
