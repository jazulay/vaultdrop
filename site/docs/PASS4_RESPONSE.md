# Pass 4 response — the volume pass (2026-07-17)

Response to `vaultdrop-volume-pass-handoff.md`. Amplitude only — odds, RNG,
PARAMS-derivation, and the statistical self-test are untouched (`npm test`
green). Measured on the prod build at 3311 via Playwright; captures in
`docs/pass4/`; every §7 acceptance item was instrumented, not eyeballed.

## Bugs (§2)

- **B1 CLS** — chips/tally moved into the stage bar with reserved slots
  (tally line has fixed height from first paint; personal slot has
  min-height/width). Measured hero CLS across join+tally mount: **0.002**.
  Real mouse click on "25 SOL" lands and fires `demo_orb_added`.
- **B2 personal beat** — resolve swaps the "your shot" slot to the outcome and
  holds **8s** (measured present at resolve and 6s later). Wins additionally
  get a 32px center plate, `(demo)` on the plate, 5s hold, gold vignette pulse.
- **B3 one ledger** — new `lib/demoLedger.ts` module store; the hero ticker,
  rollover strip ("… N earlier misses … = pot SOL and rolling"), Mega-section
  numeral, and PiP all render from it. Measured all three surfaces
  simultaneously: **691 = 691 = 691**. Equality is by construction.
- **B4** — Mega section displays the demo pot as a giant Odometer numeral
  (headline scale) with a `demo` chip, heartbeat, embers; swaps to the real
  pot at launch by existing LiveSlot logic.
- **B5** — PiP now renders the demo clock + pot from the same provider/ledger.
- **B6** — selected chip is gold fill / ink text; YOU orb keeps teal-white.

## Volume spec (§3)

- **Stage bar** spans the hero's lower third: countdown **48px** desktop /
  **34px** mobile (`role="timer"`), pool · mega (with `+36.3 ▲` slam at the
  1.2s ledger beat) · personal slot · docked chips; SIMULATION chip pinned
  top-right of the bar. Left column = **exactly 4 elements** (measured).
- **Orbs**: 18–28px three-size glass treatment (highlight dot, warm glow, gold
  rim), 24 desktop / 12 mobile, path-locked to two ring ellipses, per-element
  text-exclusion rects (+24px) around the copy blocks — 14/24 visible outside
  text at 1440px. **YOU = 32px** with an 11px label plate.
- **CHARGE**: orb tangent streaks + core brightness ramp + 1Hz clock pulse +
  bar dim (side-by-side captures `p4-charge.png` vs orbit).
- **RESOLVE**: flash (mix-blend screen, full-stage luminance shift —
  `p4-flash-final.png` passes the single-screenshot bar) → bloom (0.8→1.4) →
  **20 crowned orbs at 2× with 48px burst rings** (36–56px footprint) + 16px
  prize pops → mega ticker slam. Ignition banner 28px+, holds 5s, `(demo)` on
  the plate.
- **SETTLE**: receipt at **14px/70%**, types on 400ms, holds 4.4s, slides down
  toward Proof while fading.
- **Year-sim**: **6.016s measured** (52 × 115ms JS-driven reveal — also fixes
  a pass-3 CSS bug where the win cells' animation shorthand collision left
  them at opacity 0), cells 24×32px, WIN = gold fill + ink prize text + 200ms
  burst, vault-Mega weeks ember-orange, personal-Mega signal-teal, summary
  numbers count up. (11 gold cells in the 1,000-SOL verification run.)
- **Rollover strip**: staggered 120ms settle, gold deepens across the
  sequence, running total from the ledger.

## Reduced-motion parity (§5)

No flash/bloom/charge/autoplay; "Run one draw" static card (same information);
year-sim renders its end state instantly **plus a step-through control**
(verified); aria-live announcements **fired** (text read back at runtime, not
assumed).

## Weight

No new media; the pass is CSS + the ledger module. Route JS unchanged at
~158 KB encoded.

## Deferred (unchanged from pass 3, in STUBS)

`mega-ignition-fullbleed` asset (#14) · sound (#15) · analytics provider (#13)
· on-device 60fps + Lighthouse for the next audit.
