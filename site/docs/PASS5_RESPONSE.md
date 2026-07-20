# Pass 5 response — the ring, the money, the hit (2026-07-17)

Response to `vaultdrop-pass5-handoff.md`. Measured on the prod build at 3311
via Playwright (never the embedded pane); captures in `docs/pass5/`; every §9
acceptance item instrumented, not eyeballed. `npm test` green (calc + EV
lockdown + statistical self-test + new ring geometry test); `npm run build`
green (banned-terms sweep clean).

## §1–2 THE DRAW RING — built as specced, geometry derived not hardcoded

- **The architectural move landed**: the orrery video is demoted to the set
  (`.hero-set`: `blur(2px) brightness(0.75)`, measured on the live DOM) and the
  orbs ride ONE owned ellipse (`lib/ring.ts`), rendered as a sharp 2px
  brass-gold SVG stroke, brighter on the front arc.
- **Geometry is derived from the measured layout every second**, not fixed:
  wide copy blocks push the ring's top down, column blocks push it right;
  mobile gets the band above the bottom-anchored copy. At the audited
  1264×820 the derivation lands at **cx 912, cy 492, a 304, b 120** — within a
  few px of §2.2's hand-computed (910, 495, 340, 135), from live rects.
- **Text-safe rect enforced three ways**: computed clearance in `lib/ring.ts`
  (accounts for the largest 72px orb), a dev-mode DOM patrol in `DemoDraw.tsx`
  (`data-ring-violations`, loud `console.error`), and `scripts/ring.test.mjs`
  in CI (720-point sweep at both audited viewports + depth invariants).
- **Depth from θ (§2.3)**: scale 0.55→1.0, opacity 0.55→0.95 (**never 0** —
  band-asserted in CI), z-flip **behind the stroke on the back arc (z-2 < z-4)
  and in front on the front arc (z-6 > z-4)**, back arc sweeps faster
  (integrated against depth each frame). 16 orbs desktop / 10 mobile, two 40px
  whales, rest 16–24px.
- **Measured on the prod build, 22 samples over ~22s (desktop) + 8 (mobile):**
  `violations 0 · zeroOpacity 0 · offCanvas 0 · minOpacity 0.55 · zFlip true`
  on both. The pass-5 diagnosis (19/22 samples under the text column) is dead.

### §2.4–2.6 the YOU orb

- Front-arc-constrained oscillation (`youTheta`), z-7, tethered 11px `YOU`
  pill with a 12px leader line, billboarded upright. **Measured 20/20 samples:
  visible, full opacity, never in text, never off-canvas.**
- **Entry**: arcs in from the tapped chip's real screen position, 700ms cubic
  ease-out, gold ripple where it joins; **exit** detaches, drops, fades. Light
  haptic (`navigator.vibrate(8)`) on tap. ≤2 taps to be in the next draw (1).
- **Size = stake × time-weight (§2.5 + §2.6, merged)**: full-size px by chip
  5→32 / 25→48 / 100→58 / 1,000→72, scaled by held fraction of the 30s cycle
  (0.45→1.0). Measured: 23.6px at ~2s held → 35px at ~15s → 53px on the
  1,000-SOL chip. *Deviation, flagged*: §2.5's literal 18/26/36px table
  conflicts with §2.4's/§9's "YOU orb 48px" — resolved toward the acceptance
  criterion (25-SOL default = 48px at full weight) while keeping the
  unmistakable swell.
- **§2.6 is honest end-to-end, not cosmetic**: the draw resolves at the
  time-weighted stake (`drawOnce(deposit × heldFraction)`), and the odds line
  says why while it accrues — measured live:
  `≈ 1-in-398 — you've held 15 of 30s`, ripening to `your shot ≈ 1-in-200`.
  Reduced motion has no cycle (draws are user-triggered), so weight is full
  there: `your shot ≈ 1-in-200` (measured).

### §2.7 the draw, honestly sampled

- HUD reads **`showing 16 of ~4,000 depositors`** (100k demo vault / 25-SOL
  average, constant documented in source), positioned on the ring's upper-right
  shoulder clear of all copy rects (measured, no intersection).
- **Crowns bloom around the CORE, never on sampled orbs**: 20 crowns +
  `20 winners · 4.24 SOL each` plate, staggered 45ms, 4 prize pops — measured
  20 + label at resolve. YOUR orb crowns only on a real personal win at true
  odds. The pool figure **drains to 0 at resolve and re-seeds on orbit**
  (measured `demo pool ≈ 0 SOL` during resolve).
- During the capture run a true 1-in-26 Mega landed on camera
  (`p5-resolve-crowns.png`): fullbleed ignition at **509 SOL — identical to
  the stage-bar ledger figure**, one demo history across surfaces (B3 intact).
- CHARGE: ring stroke brightens (`.ring-charging`), rotation 1×→3×, trails,
  clock pulse (`p5-charge.png` vs `p5-orbit.png`).

### §2.8 build notes honored

DOM orbs kept, one rAF loop, transforms/opacity/filter only, paused on
`document.hidden` + out-of-view + docked. Reduced motion: static ring, orbs
parked on the front arc with depth styling, YOU orb parked and labeled, static
draw card on demand (all measured — `p5-reduced-motion.png`).

## §3 THE CALCULATOR — Two Futures, live dollars, the settled frame

- **`lib/price.ts`**: Pyth SOL/USD (`hermes.pyth.network` — Pyth's own hosted
  service, no relation to our Hermes), 60s poll, 10-min staleness ceiling.
  **On failure/staleness dollars HIDE everywhere** — the label flips to
  "SOL price feed unavailable — dollar figures hidden". Label when live:
  `SOL $75 · live · 19:51 UTC · Pyth` (measured).
- **Dollar figures are all derived** from PARAMS × the live price — nothing
  hardcoded. The audit's worked examples assumed $150; SOL printed $75 during
  verification and every surface (headline included) stayed self-consistent.
  That is the point of §3.5.
- **Two Futures (§3.2)** shipped: left column grey/flat/desaturated with the
  52-identical-bars flatline; right column gold with `Most weeks $0`,
  `1 week in N`, `1 Sunday in 26 ← the Mega Vault`, and the aligned
  **best/worst week ever rows** (measured 2 + 2). Right sparkline is **one
  actual `simulateYear` run at true odds** — never a drawn picture — and says
  so, including "This one hit nothing. That happens." when it misses.
- **Honest ledger (§3.3)**: staking pays / routes to prizes / difference rows,
  the difference rendered **negative in both units** (`−0.175 SOL −$13`
  measured); "X a week is the whole price of the game… 52 shots at… ~2 shots
  at…" all derived. The §3.1 closer ("no amount of 7% will ever change your
  life") included. Existing honesty line + Illustrative disclaimer kept
  verbatim, extended with the Pyth note.
- **§3.1 is locked in CI**: `scripts/calc.test.mjs` now asserts, across 8
  configurations (every TVL, extreme deposits, changed megaShare/winners, zero
  fee), that total EV including every prize chance equals `D × apyNet` by two
  independent routes, **never exceeds staking**, and that the gap is exactly
  the fee. No surface can claim otherwise without failing the build.
- **§3.4 counsel gate**: the Powerball strip exists behind
  `NEXT_PUBLIC_COUNSEL_STRIP=approved` (build-time env, default absent =
  **off**; measured off). It cannot ship "temporarily".
- **Reframe reconciled (§3.5)**: headline now derives from the live price —
  measured `Staking 25 SOL pays you about $0.36 a day. Feel anything?` — with
  a no-dollar fallback ("cents a day") on feed failure. The panel figure
  derives from PARAMS (`25 SOL → +0.0048 SOL a day`), replacing the stale
  hardcoded 0.0038, and the eyebrow now derives (`The problem with 7%`, was a
  self-contradicting "8%").

## §4 vault size — an honest trade

- **Default TVL chip is 25,000 SOL, labeled `epoch-1 scale`** (measured
  `aria-pressed` on load). 100k and 500k remain.
- Framed as the trade, verbatim spirit: "Small vault: you win often, for
  less… Same expected value either way — they're just different games." plus
  the epoch-1 line with **derived** numbers ("every 50 Sundays instead of
  every 200" at 25 SOL — matches §4's table). Never "early is better".
- §4.2 (zero-fee epoch 1): **not built**, per the instruction. Owner decision,
  noted, page ships with the boring-yield frame.

## §5 the hit

- `press-scale` (0.97) + gold `press-ripple` on every button and chip; slider
  fill now tracks the thumb with a glow trail; Magnetic pull on hero CTA and
  "Simulate my year"; chip tap = haptic + orb arc + ripple.
- **Winner moment**: stage freezes 300ms (rAF dt gate) → orb field + ring
  desaturate (`.stage-desat`) → gold vignette pulse → 32px plate holds 5s →
  docks into the tally slot (B2 path unchanged) → `aria-live` announced.
- **Share-card surface built now (§5 post-launch hook)**: the demo plate and
  the launch share card are the same component, `components/WinnerCard.tsx`
  (amount, odds, epoch label, proof href — real cards require a real proof
  link, demo cards always say demo). Export plumbing = STUBS #16 +
  API_REQUESTS entry (winner event + proof URL).
- "Run it again": the strip wipes left→right (`.strip-wipe`) before the 6.0s
  refill. Year-sim cell treatments unchanged from pass 4 (measured then).

## §6 assets — both closed this pass

1. **`mega-ignition-fullbleed`: confirmed absent, so it was generated** —
   nano-banana keyframe from the a6-ignite anchor → Seedance 5s screen-scale
   bloom → SVT-AV1 webm (650 KB) + H.264 mp4 (2.1 MB, mounts only at
   ignition). Wired into the ignition overlay, replacing the scaled
   ignite-moment interim. Keyframe/raws in `assets/`.
2. **`reframe-drip-loop` v2 (NF-6): regenerated on a pure void** — droplet +
   faint ripple only, frame-inspected at 4 points: nothing domestic at any
   crop. Seamless loop (start=end keyframe; seam SSIM 0.996 measured), 17 KB
   webm / 140 KB mp4 + new posters, replacing v1 in place. The mobile
   ink-gradient guard in Reframe is now belt-and-suspenders.

## §7 guardrails

Odds, RNG, PARAMS derivation untouched; statistical self-test green.
SIMULATION chip present; `(demo)` on plates; sample labeling per §2.7; dollars
hide rather than stale; banned-terms sweep green over all new strings; reduced
motion at full information parity; transforms/opacity/filter only.

## §9 acceptance — measured results

| Criterion | Result |
|---|---|
| Zero orbs in text-safe rect, asserted | **0 violations** / 22×16 desktop + 8×10 mobile samples; dev patrol + CI test |
| No opacity 0 / continuous field / on-canvas | **0 / 0 / 0**, min opacity 0.55 |
| YOU orb 100% visible, front arc, 48px, label | **20/20 samples**, z-7, 48px @ 25 SOL full weight |
| Z-flip vs ring stroke | back z-2 < stroke z-4 < front z-6 — **observed both** |
| Radius scales with chip | 35px (25 SOL, mid-weight) → **53px** (1,000 SOL); full-weight 32→72 |
| Chip tap arcs orb from chip + ripple, ≤2 taps | **1 tap**, 700ms arc from measured chip rect |
| Sample HUD + 20 crowns at core + YOU at true odds | `showing 16 of ~4,000 depositors`; **20 crowns + plate** measured |
| Calculator SOL + live dollars, best-week rows | live Pyth $75; rows aligned (`$2.53` vs `$17,755` at live price — $150-assumption figures scale with the feed) |
| Honest ledger: fee stated, EV down, never up | `−0.175 SOL −$13` measured; CI-locked |
| No surface implies prizes improve EV | locked by calc.test.mjs across 8 configs |
| Default 25k `epoch-1 scale`, trade framing | measured on load |
| Pyth live w/ timestamp; dollars hidden on failure | measured live; hide path implemented + labeled |
| Reframe headline reconciled | `about $0.36 a day` at live $75 (derived, not worded around) |
| Powerball strip flagged OFF | measured absent; env-gated |
| Press feedback everywhere; plate 5s; reduced-motion complete | 11 press surfaces measured; RM ring/orbs/YOU/static-draw verified |
| Self-test + banned-terms green | `npm test` + `npm run build` clean |

## Weight

Route JS 167 kB First Load (was ~158 — the ring, price feed, and Two Futures
cost ~9 kB). New media: drip v2 webm **17 KB** (near-black AV1), ignition
fullbleed webm 650 KB / mp4 2.1 MB — the ignition video element mounts only
when a 1-in-26 fires, so it costs nothing at page load.

## Notes for pass 6

- Mobile: the SIMULATION chip can overlap the "How it works" ghost button at
  ~390px (pre-existing bar/copy adjacency, unchanged this pass) — worth a
  look if the mobile pass runs on device.
- On-device 60fps + Lighthouse remain queued for a device audit (unchanged).
- The audit's "take it back on any Monday" phrasing was rendered as "withdraw
  it any time" to stay consistent with the site-wide no-lockup copy.
