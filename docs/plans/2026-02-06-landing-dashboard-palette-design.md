# Landing Palette Alignment With Dashboard Theme

Date: 2026-02-06

## Goal
Make the landing page palette match the dashboard theme by replacing hardcoded colors with global theme tokens. This ensures consistent branding and maintainability across the marketing surface and the app UI.

## Scope
- Replace all hardcoded hex colors in landing components with Tailwind theme tokens that map to CSS variables.
- Update landing-specific CSS utility classes to use theme variables instead of fixed colors.
- No structural/layout changes, no new UI components, no data flow changes.

## Non-Goals
- No changes to typography, spacing, or layout structure.
- No new animations or interactions.
- No backend or API changes.

## Current State
Landing components use many hardcoded colors (e.g., `#0B0E14`, `#13ec5b`, `#fa5538`, `#28392e`, `#10151c`). The dashboard already uses theme tokens defined in `src/app/globals.css` (`--background`, `--primary`, `--destructive`, `--border`, `--card`, etc.).

## Proposed Approach (Selected)
Replace all landing hardcoded colors with theme tokens:
- Base surfaces: `bg-background`, `text-foreground`.
- Primary accents: `text-primary`, `bg-primary`, `border-primary/30`, `ring-primary`.
- Negative accents: `text-destructive`, `bg-destructive/15`, `border-destructive/30`.
- Surfaces: `bg-card`, `bg-secondary`, `bg-muted` based on depth.
- Borders: `border-border/60` (or `/40` where needed for subtlety).
- Secondary text: `text-muted-foreground`.

Update landing CSS utilities in `src/app/globals.css`:
- `.landing-grid` to use `--border`-derived rgba instead of fixed green.
- `.landing-panel` and `.landing-card` to use `--card`, `--border`, and theme-consistent shadow/blur.
- Background gradients in landing sections to use `background`, `muted`, and `accent` colors instead of fixed hex.

## Affected Files
- `src/components/landing/landing-page.tsx`
- `src/components/landing/landing-background.tsx`
- `src/components/landing/landing-hero.tsx`
- `src/components/landing/landing-features.tsx`
- `src/components/landing/landing-map.tsx`
- `src/components/landing/landing-broker-calendar.tsx`
- `src/components/landing/landing-ticker.tsx`
- `src/components/landing/landing-nav.tsx`
- `src/components/landing/landing-cta.tsx`
- `src/components/landing/landing-footer.tsx`
- `src/app/globals.css`

## Accessibility
Theme tokens already satisfy dashboard contrast. Reusing them increases consistency and maintains accessibility. No changes to DOM structure.

## Testing
No new tests required. If visual regression tests exist, expect baseline updates due to palette change only.

## Success Criteria
- No hardcoded color hex values remain in landing components (except for media assets).
- Landing visually matches dashboard palette.
- No layout/behavior regressions.
