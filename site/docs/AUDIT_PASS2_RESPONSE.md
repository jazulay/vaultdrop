# Audit pass 2 response — NF-1…NF-6 (2026-07-16)

Response to `vaultdrop-audit-pass2.md`. All six findings addressed; verified on the
**production build** (`next build && next start -p 3311`), not dev.

## Fixes

- **NF-1 (fee contradiction)** — `lib/faq.ts` now imports `PARAMS` from `lib/calc.ts`
  and renders the fee line from `PARAMS.protocolFee` (single source of truth).
  Rendered page + FAQPage JSON-LD both say "We take 10% of yield"; when Q1 lands,
  changing the constant updates FAQ and calculator together.
- **NF-2 (dev vs prod)** — port 3311 now serves the production build. Verified: no
  `react-dom.development` in loaded resources.
- **NF-3 (lexicon)** — "lottery" removed from hero subline (`HeroOrrery.tsx`) and
  og/twitter descriptions (`layout.tsx`) using the audit's drop-ins. Rendered-page
  grep for `lottery|sweepstakes|raffle`: **0**. STUBS.md #12 updated to REVERTED,
  banned list extended, counsel may re-approve.
- **NF-4 (canonical)** — `metadataBase` + `alternates.canonical` added to
  `layout.tsx`, driven by `NEXT_PUBLIC_SITE_ORIGIN` (documented in root README;
  falls back to `http://localhost:3311` so local builds stay auditable). STUBS.md #9 updated.
- **NF-5 (skip link)** — target changed `#how` → `#content`, a `tabIndex={-1}`
  anchor placed directly after the header nav and before the hero, so keyboard
  users skip only the nav, not Reframe.
- **NF-6 (drip crop)** — mobile-only (`max-md`) treatment on the Reframe drip
  figure: video/poster scaled 1.5× from bottom origin (crops the domestic shapes
  out of frame) + top gradient overlay (`from-ink 30% → ink/80 60% → transparent`,
  72% height). Screenshot-verified at 375px: droplet + ripple on void, no
  faucet/appliance read. Desktop (≥768px) verified untouched: no transform,
  overlay `display:none`.

## Prod weight (NF-2 re-measure, encodedBodySize, first load, cold)

24 requests, **~1.18 MB** total: 879 KB hero webm · 151 KB JS · 76 KB woff2 ·
59 KB jpg posters · 11 KB HTML (gzip) · 6 KB CSS. No dev-mode JS. Under the
1.4 MB estimate cited in pass 2.

## Gates

`npm test` (calc worked example) PASS · `npm run build` + `check-stubs` clean
(guard also confirms no banned terms in emitted HTML) · rendered-page checks above.

## Still open (owner answers, unchanged)

Epoch-1 date · VRF provider/program/audit link · socials/docs URL · final params
(NF-1 constant awaits Q1) · waitlist endpoint · Mega seed decision.
Lighthouse + reduced-motion numbers: to be attached by next audit pass against
this prod serve (out of scope for this fix batch).
