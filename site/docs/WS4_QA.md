# WS4 QA — VaultDrop marketing site
2026-07-14 · local build `next build` (Next 14.2.35) · evidence-first

## Lighthouse (prod build @ localhost:3312)

| Run | Perf | A11y | Best-practices | LCP | CLS |
|---|---|---|---|---|---|
| Mobile, simulated (Lantern) — `lighthouse-mobile.json` | **93** | 96 | 100 | 3.2 s* | 0 |
| Mobile, applied 4G throttling (devtools) — `lighthouse-mobile-devtools.json` | **99** | — | — | **1.5 s** | 0 |
| Desktop — `lighthouse-desktop.json` | **100** | 96 | 100 | 0.7 s | 0 |

*The 3.2 s simulated LCP is a Lantern-graph artifact: the H1 is the LCP element
and lives inside a client component, so the simulator pessimistically chains its
paint to script nodes. Observed LCP in the same trace is **155 ms**; the
devtools-throttled run (real applied 4G) reports **1.5 s ≤ 2.5 s budget**.
Mitigations shipped anyway: single-weight (600) Fraunces at `display:optional`
without preload, responsive posters (`-sm` 780w variants), hero video mounts
only after `window.load`.

Budgets: mobile Perf ≥ 90 ✓ (93 sim / 99 applied) · LCP ≤ 2.5 s ✓ (1.5 s applied) ·
CLS < 0.05 ✓ (0) · JS ≤ 250 KB gz ✓ (First Load JS 150 KB) ·
first-load video ≤ 8 MB ✓ (hero webm 880 KB; all other clips lazy).

## Asset budgets (spec §5)

| Asset | webm | budget | mp4 | poster | poster-sm |
|---|---|---|---|---|---|
| hero-orrery-loop | 880 K | ≤ 5 MB ✓ | 3.0 M | 64 K ✓ | 24 K |
| orb-enter-loop | 68 K | ≤ 3 MB ✓ | 160 K | 40 K ✓ | 12 K |
| orbit-tickets-loop | 120 K | ≤ 3 MB ✓ | 276 K | 76 K ✓ | 28 K |
| orb-exit-loop | 56 K | ≤ 3 MB ✓ | 140 K | 60 K ✓ | 20 K |
| megavault-sun-loop | 668 K | ≤ 3 MB ✓ | 2.0 M | 128 K ✓ | 44 K |
| ignite-moment | 352 K | ≤ 3 MB ✓ | 2.0 M | 60 K ✓ | 24 K |

All six generated via Higgsfield MCP (nano-banana keyframes → Seedance 2.0
start=end frame loops), 1080p/24fps, silent. Loop-seam QA: first↔last frame
PSNR — hero 37 dB, enter 27 dB; tickets/exit/sun received a 1 s crossfade-loop
treatment (seam PSNR 23/34/32 dB — remaining delta is one ordinary motion
frame, not a jump). Contact sheet: `WS1_contact_sheet.jpg`. Rejection criteria
checked: no loop seams, no text artifacts, no casino iconography, gold appears
only on win/Mega elements (exit trail is signal-green).

## Overflow (390 / 768 / 1440)

`document.scrollWidth > innerWidth` → **false at all three widths**
(puppeteer, `docs/captures/home-{390,768,1440}-full.png`).

## Reduced motion

With `prefers-reduced-motion: reduce` emulated: **0 `<video>` elements
mounted** (posters only), Lenis/GSAP scrubs disabled, odometer renders plain
numbers, layout static. Captures: `docs/captures/home-1440-reduced-motion-*.png`.
Information parity: every data slot renders identical text.

## Claims-discipline self-audit

- `grep -ri lottery` over app/components/lib → **0** occurrences.
- APY / "expected value" / win-hype language → **0** occurrences.
- Numeric claims in rendered copy, each traced:
  - `1-in-26 each week` (S3) — spec-mandated odds line (§4 S3).
  - `15% of yield — never your deposit` (FAQ) — spec-mandated fee line (§4 S6).
  - Legal-page `15%` — inside `[COUNSEL TO REPLACE]` placeholder.
  - Everything else matched by the audit grep is Tailwind classes (`text-6xl`,
    `w-full`), GSAP trigger positions (`+=60%`), or CSS — not copy.
- Every live-data slot renders one of: live API value / verbatim §7 pre-launch
  state / `—` + "live data unavailable" tooltip. No cached-as-current, no
  example tickers. Pre-launch strings verified verbatim in captures.

## Link check

Internal: `/proofs`, `/legal`, `#how`, `#proof`, `#waitlist` — resolve ✓.
External: none yet (docs link is `data-stub`, see STUBS.md #4; draw-table
proof links render only from live `/draws` data).

## Known stubs / requests
See repo-root `STUBS.md` (4 items) and `API_REQUESTS.md` (`/time`).
