# Pass 3 response — the adrenaline layer (2026-07-16)

Response to `vaultdrop-adrenaline-handoff.md`. Built and verified on the
production build at localhost:3311 (Playwright, captures in `docs/pass3/`).

## Built

**§4 — Hero = the demo draw.** `lib/draw.ts` (engine) + `components/DemoDraw.tsx`
(provider/stage/join/CTA) composited over the existing orrery loop inside the
shrinking hero frame. 30s ORBIT→CHARGE→RESOLVE→SETTLE cycle; DOM orbs
(22 desktop / 12 mobile) on three elliptical rings via one rAF loop, transforms
only; HUD with ticking countdown, demo pool, Mega pot, SIMULATION chip;
"Drop your orb in" chips (2 taps to be in the next draw, 44px targets on
mobile); YOU orb in signal-teal; session tally; settle line with "odds
honored ✓"; CTA morphs once after the first participated resolution. Mega
ignition at true 1-in-26 uses the existing `ignite-moment` clip full-screen +
CSS bloom (dedicated `mega-ignition-fullbleed` asset logged in STUBS #14).

**Honesty rails (§4.4).** All figures derive from `PARAMS` via `lib/calc.ts` —
the handoff's illustrative "+2.3" Mega growth doesn't derive from PARAMS, so
the true figure (+36.3/week at the 100k demo vault) is displayed instead, per
§8 ("every simulated figure derives from PARAMS"). RNG is
`crypto.getRandomValues` (incl. rejection-sampled 1-in-26 mirroring the
program's no-modulo-bias rule). Zero rigging code paths. Statistical self-test
(`scripts/draw.test.mjs`, in `npm test`): 10k draws per chip within 3σ binomial
CI of pWeek, mega frequency, sampler uniformity, year-sim mean — all PASS.

**§5.** Calculator: "Simulate my year" (52 cells, ~6s fill, honest variance,
inherits slider/chip state, repeatable; personal-Mega cell in signal if it ever
lands) + CountUp on all result numerals. Mega: 15 code embers, heartbeat scale
(1.00→1.015/3s), rollover strip (W1…W8 +36.3 → "next: Sunday") on
scroll-into-view. How-cards: hover/focus-to-play on fine pointers, in-view on
touch (`VideoLoop playMode="hover"`, preload none). Reframe loops already
autoplay in-view (verified — the "lobotomy" claim didn't reproduce; posters are
initial-only). Preview row settles once (odometer + stamp-in). Magnetic hover +
press-ripple on hero/footer CTAs; FAQ chevron spring; footer ignite verified
firing in-view.

**§6 contrast doctrine.** Proof/Safety/FAQ untouched beyond the one-time
preview settle.

**§11 analytics.** `lib/analytics.ts` → `window.dataLayer` (no provider wired,
STUBS #13): demo_draw_watched, demo_orb_added, demo_personal_win,
mega_ignition_seen, year_sim_run, cta_click{post_participation}. Verified
firing in order at runtime.

**§8 guardrails.** Reduced-motion: no autoplaying animation of any kind; "Run
one draw" renders a static result card; CTA morph still works (agency without
motion) — captured in `pass3/p3-reduced.png`. aria-live polite announcements
outside any aria-hidden subtree; keyboard-complete participation; labeled
countdown (`role="timer"`). Banned-terms sweep now also greps
components/lib sources (client-only surfaces never reach emitted HTML) and
includes lottery/sweepstakes/raffle — CI-enforced.

## Measurements (prod build)

- Route JS: **158 KB encoded** total for `/` (was ~151 KB pre-pass-3 → the
  entire adrenaline layer costs ~7 KB; hero-layer budget ≤150 KB gz easily met).
- Initial transfer unchanged in character: hero webm 879 KB dominates; no new
  media loads initially (ignition reuses cached ignite clip; year-sim/embers/
  strip are code).

## Not built (logged)

- Sound layer (§5.7) — optional; no audio assets exist (STUBS #15).
- `mega-ignition-fullbleed` + `reframe-drip-loop` v2 Higgsfield assets (§10) —
  interim: CSS-scaled ignite clip; drip's mobile crop fix from pass 2 stands.
- `draw-charge-transition` (§10.3) — CSS/rAF acceleration sells it; not needed.

## Acceptance criteria not independently verifiable here

60fps on mid-tier mobile hardware (code follows the budget: transforms only,
one rAF, orb-count degradation, off-screen/hidden-tab pause) and Lighthouse —
next audit pass should measure on device.
