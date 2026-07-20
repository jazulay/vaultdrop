# Pass 6 — the self-audit (2026-07-19)

Joseph asked for a first-time-user audit of the site with everything on the
table ("make this an incredible product and site"). This pass was run
differently: a fresh evidence pack (33 captures, desktop+mobile, every section
and state, `docs/pass6/` + facts) was walked by **nine independent audit
lenses** — cold-open visitor, story editor, game designer, fintech product
designer, rugged-twice skeptic, mobile reviewer, design-systems reviewer, CRO
specialist, creative director — synthesized into 22 ranked candidates and 6
big swings, then each candidate was verified against the actual source before
being built. Verification and implementation below; measurements on the prod
build via Playwright.

## The headline the lenses agreed on

Top-percentile, genuinely honest pre-launch site — **whose loose screws sat
exactly where the money changes hands.** The funnel was broken at intake (the
mobile stage bar buried both hero CTAs under the SIMULATION pill), mid-page
(no join affordance for ~8,000px), and at the close (the sole conversion
button rendered as a three-line gold blob, above a form that failed only
*after* the visitor typed their email). And the audit's sharpest irony: it was
specifically the **honesty apparatus** failing — /legal said the fee was 15%
while PARAMS says 10%; the Mega row read as personal odds of $18k; the
miss-history receipt was gold-on-gold illegible; the proof table clipped its
own "not a real draw" disclaimer; the only present-tense trust claims ("open
source", "published in the docs") dead-ended at `href="#"`. Every fix below
makes the site *more* honest, not more cautious.

## Shipped this pass (candidate # from the synthesis)

**The funnel**
- **#1 Mobile fold un-buried** — the stage bar publishes its real height as
  `--stage-h` (ResizeObserver); the hero copy reserves exactly that; the
  SIMULATION badge is the bar's own first row on phones (floating chip on
  sm+); the settle receipt positions off the same var. Measured at 390×844,
  spectating AND joined: both CTAs fully on-screen, `coveredByBar: false`.
- **#2 Waitlist button** — root cause was `shrink-0` on the button while the
  squeezed flex child was the Magnetic wrapper; Magnetic now takes a
  className, wrapper gets `shrink-0`, label gets `whitespace-nowrap`. One line
  at every width.
- **#3 Waitlist gated pre-effort** — with `NEXT_PUBLIC_WAITLIST_URL` unset the
  form no longer renders at all; an honest plate explains the pre-launch build
  *before* anyone types. Every waitlist outcome now fires analytics
  (`waitlist_submit`/`waitlist_result`) — the site's sole KPI was invisible.
- **#9/#13/#15 A path to the waitlist from everywhere** — header returns on
  scroll-up (new `SiteHeader`); the PiP carries "Join epoch 1 →"; the Mega
  section's "date announced to the waitlist first" is now a link; the year-sim
  payoff and the epoch-1 note carry inline CTAs; the close's subline now asks
  with the page's own honest hooks ("Epoch 1 is the smallest the vault will
  ever be… The date goes to the waitlist first."), and success links onward to
  Proof. Distinct `cta` values throughout.

**The honesty apparatus**
- **#4 Fee contradiction killed** — /legal no longer hard-codes any fee
  number; the exact percentage ships with the Terms. (The FAQ/calculator
  derive from PARAMS, as before.)
- **#5 Mega row reference class named** — "The vault's Mega — lands ≈ 1 Sunday
  in 26" with an explicit share line ("your ticket's share of winning it ≈
  1-in-{TVL/deposit}") and the fee copy rewritten to match. It can no longer
  read as personal odds of the jackpot.
- **#8 Trust surfaces truth-up** — no present-tense claims that can't be
  shown: "programs are open source" → published-before-deposits phrasing;
  dead `Docs` anchors replaced with dated text until a URL exists; a single
  accountable **"Before deposits open, this page will show"** checklist on
  /legal, mirrored in Safety — six scattered promises become one dated
  commitment that turns into receipts at launch.
- **#14 FAQ "No." rescoped** — "Not from the draws…" keeps the strong true
  claim, drops the false absolute, and re-syncs with Safety (this string ships
  into Google via FAQPage JSON-LD).
- **#10 Mega receipt survives the sun** — ink plates + blur behind every
  miss-history chip and the ledger caption; extra mobile scrim; "takes it."
  no longer orphans.
- **#11 Sample HUD** — right-anchors instead of clipping at wide viewports,
  reads "…demo depositors", bumped to legible contrast.
- **#12 Proof table** — empty state + "not a real draw" disclaimer moved out
  of the scrolling table (they clipped mid-word on phones); right-edge fade as
  scroll affordance; preview proof/tx are explicit placeholders, not fake
  links; "on-chain." no longer breaks.
- **#16 Year sim agrees with itself** — Mega-landing weeks keep their ember
  mark even on win cells; extremes relabeled "Best/Worst *possible* week"
  (bounds, not outcomes); the finished year states the staking counterfactual
  ("certain, and capped there") — EV-down stays visible at the moment of
  maximum excitement.

**The decision tool**
- **#17 A number can dominate** — three-figure decision strip in display type
  under the Two Futures cards: the weekly cost · the chance of ≥1 win this
  year · the Mega ceiling (with your share stated beside it). Deposit echo
  demoted; all values derived live.
- **#18 The slider visibly responds** — "Your shot each Sunday — 1 in N"
  (CountUp) is the right card's first gold value; it moves when the slider
  moves.
- **#19 Rows re-stack at 390px** — labels take a full line below `sm`; the
  "1 Sunday in / 26 ← the / Mega Vault" shatter is gone (and the pointing "←"
  annotations died with it).

**The game**
- **#6 First resolve at ~7s** (measured 7.4s; was ~26s) — first orbit is
  compressed to 4s, presentation only; odds and RNG untouched.
- **#20 Ritual legibility** — the clock speaks through the whole cycle
  (countdown → DRAWING → PAID ✓, no more frozen 0:00); every chip states its
  per-draw odds (`≈1-in-200`); a one-time "your turn" nudge after the first
  witnessed resolve; the YOU orb rides the charge (gold glow ramp + sweep
  follows the field's acceleration).
- **#21 Entries lock at CHARGE** — a join after the lock shows "Locked — your
  orb rides the next draw" and resolves next cycle at real weight, instead of
  resolving seconds later at dust weight (honest math that felt rigged). The
  ritual gains its bets-closed beat. Measured live.
- **#7 The void is dead** — hero tightened to 140vh, copy holds until 45%, and
  a **chapter card** ("The problem with 7%") rises as the frame docks, handing
  off to Reframe's eyebrow (whose top padding tightened to match). Measured: a
  14-position scroll sweep over the transition finds **zero** content-free
  viewports (was a full ink frame at the page's most likely desktop bounce
  point).
- **#22 dvh units** on the sticky hero so iOS Safari's URL bar can't push the
  chips below the visible fold.

**Two big swings**
- **The demo world remembers** — `demoLedger` persists; a return visit rolls
  the elapsed 30s draws through the same true-odds 1-in-26 sampling and greets
  honestly: measured "while you were away: 360 demo draws · the Mega hit 14×
  and is rebuilding" after a simulated 3-hour absence (~13.8 hits expected at
  true odds — the catch-up is the same simulation, continued). "It grows until
  someone takes it" is now true of the demo across visits.
- **The sound layer** (STUBS #15 closed) — the ritual, scored: synthesized
  Web Audio only (charge riser locked to the 3s ramp, struck-bell resolve,
  pentatonic crown shimmer at the 45ms stagger, sub-boom ignition, win chime,
  chip ticks). Zero asset files. OFF by default, persisted, hard-muted on
  hidden tabs, pill next to the SIMULATION badge on desktop and inside the
  bar's first row on mobile.

## Measured (prod build, Playwright)

- Mobile 390×844, spectating + joined: hero CTAs `coveredByBar:false`,
  fully on-screen; badge inside bar. First resolve **7.4s**. Clock shows
  `DRAWING` at resolve. Locked-entry line renders on a charge-window join.
  Scroll sweep 0→2600px: **0 dead viewports**. Header returns fixed at top on
  scroll-up mid-page. Decision strip / shot row / vault-Mega label / share
  line / possible-week bounds / negative fee / both calc CTAs: all present.
  Year-sim counterfactual + CTA present. Waitlist renders the honest gate (no
  input) on this unwired build. /legal has no fee number and carries the
  checklist; Safety carries its mirror; no "open source" present-tense claim
  remains; FAQ leads "Not from the draws". Away-report and sound pill render.
- `npm test` green (calc + EV lockdown + draw statistics + ring geometry);
  `npm run build` + banned-terms sweep clean.

## Verified but deliberately NOT shipped (roadmap, in rough priority)

1. **Share loop** — canvas-export of the year-sim strip and the win plate as
   labeled SIMULATION images (`navigator.share`), then next/og dynamic cards
   and seeded sim permalinks (`?run=` re-derives the exact strip). The
   distribution engine; wants a focused pass.
2. **Openable RNG receipts** — surface each demo draw's actual rolls behind
   "odds honored ✓", teaching what the VRF proof will mean. Touches
   `draw.ts`'s return shape; wants its own careful pass.
3. **Twin-worlds year sim** — 25k vs 500k side-by-side to dramatize "epoch 1
   only exists once".
4. **Visual-system tokenization sweep** — the micro-type band (5 sizes/7
   trackings), 13-step bone-opacity ladder, 4 card recipes, wandering left
   rail.
5. Smaller: slider tick labels at true log positions; click-to-type deposit;
   sparkline-as-button; narrative trims (twin Mega headlines, triple-told EV
   coda); "Run it again" out of conversion gold; on-device 60fps/Lighthouse
   (still queued for a device audit).

## Still owner-gated (unchanged)

Epoch-1 date · VRF/program/audit links · socials + real docs URL · final
PARAMS · **waitlist endpoint** (the funnel now ends at an honest gate — wiring
`NEXT_PUBLIC_WAITLIST_URL` is launch-gating and should precede any traffic
push) · counsel strip flag.
