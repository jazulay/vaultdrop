# Pass 7 response — One World, built (2026-07-21)

Implements `PASS7_FIRSTCONTACT_MASTERPLAN.md`, phases C→A→B→D, one commit per
phase. All measured on the prod build via Playwright; captures in
`docs/pass7/`. `npm test` + `check-stubs` green throughout — no honesty rail
was renegotiated.

## Phase C — One Truth (commit "phase C")

- Preview row derives from PARAMS (pool 94.2 / winners 31); `check-stubs`
  traps the old literal and the retired phrases ("odds honored", the negative
  epoch dialect) as source-level regressions.
- `lib/launch.ts` `NOW` map: hero CTA, Mega chip ("Demo table live · real pot
  at epoch 1"), Mega CTA line ("the vault app is already open — step
  inside →") tell one story about today.
- Language sweep: "practice draw №N · fair draw verified ✓", "watching",
  "you're seeing 16 of ~4,000 demo savers", "launch-day size", "drop your orb
  in — your stake on the table". Ledger's negative epoch counter replaced by a
  persisted positive draw№ (old saves migrate).
- **The follow strip** (`DemoDrawStrip`) replaces BOTH the PiP (frozen-clock
  defect) and the GSAP shrink-to-corner: one slim bottom bar — live clock,
  pot, personal beat, CTA — fed by the provider, which now keeps its
  scheduler running (`running` vs stage-only `active`) whenever any surface
  is visible. Draws resolve mid-scroll; the whole page's ledger moves live.

## Phase A — The Table

- Ring: brass gradient band (5px front / 3px back), blurred underglow,
  hairline inner track; heats up during CHARGE. Same `lib/ring.ts` geometry +
  text-safe CI.
- Orbs 26–56px glass (three whale tiers); YOU 48–72px by stake.
- Resolve pays in receipts: one "+47 SOL" plate (50% tier), a fan of
  "+4.7 SOL" plates (5% tier), burst constellation for the 1% tail — amounts
  are PARAMS tiers × pool.
- De-barnacled: SIMULATION badge + sound pill live in the bar's bottom line.
- Mobile hero: 11vw headline (wordmark collision fixed), three objects,
  chips behind "Play the demo ▸" — first-viewport chrome **45% → 28%**
  (target ≤35%).

## Phase B — The Descent

- `components/WorldLayer.tsx` + `lib/world.ts`: one fixed canvas behind the
  page — receding brass arcs (scroll parallax), ember drift, and the
  visitor's companion YOU-orb riding the right edge, docking at the final
  gyroscope. Proof/Safety/FAQ stay opaque: contrast doctrine by paint order.
- Voids closed page-wide (docHeight 10,798 → 10,033; dead-viewport scan:
  **zero** dead 900px windows, was ~3,000px of void). "Scroll" float removed.
- Two Futures in three beats: decision strip first ($0.39/wk · ≈80% ·
  $10,241), **Simulate-my-year as the gold centerpiece**, cards with the win
  line above and "Most weeks $0" as the honest close, full EV ledger +
  counsel strip behind "Show the full math".
- Mega: miss history is a filling gold bar from the ledger; live Pyth dollars
  under the pot ("≈ $X at today's price — one person takes all of it").

## Phase D — measured acceptance (all pass)

- Dead viewports: **0** across the full page.
- Follow-strip clock live at y=2,000 / 5,000 / 8,500 (caught 0:01→LIVE,
  PAID→0:25 — the ritual is visible at depth).
- One ledger: fill bar = follow strip = Mega numeral (323 = 323 = 323,
  measured simultaneously).
- Contradiction grep: no "seeding", no lexicon terms, no retired dialect in
  rendered text.
- Ring stroke 5px; plates ≥90px footprint; mobile chrome 28%; reduced motion:
  parked orbs + static draw card + step-through verified.

## Still open (unchanged, owner/asset items)

STUBS #13 (analytics provider) · #15 (sound kit is synthesized, optional
asset) · optional regens from the master plan (darker hero grade, drip v2).
On-device 60fps + Lighthouse remain for the next audit pass.
