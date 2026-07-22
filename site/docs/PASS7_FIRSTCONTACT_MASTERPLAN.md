# PASS 7 — FIRST-CONTACT AUDIT + THE ONE-WORLD MASTER PLAN

**Method:** prod build at 3311, fresh eyes FIRST — real mouse-wheel walkthrough
at 1440×900 and 390×844 (Playwright; captures in the session scratchpad),
every viewport-step screenshotted and judged before any internal doc was
re-read. Docs reconciled after. Owner's brief: *"judge it harshly as a first
time user… nothing is set and no assets are a must."*

## Verdict up front

The honesty apparatus is world-class and the words are now genuinely good —
but the page **looks like a document that contains a game, not a game that
contains its documents.** Three systemic failures, and every specific finding
below is a symptom of one of them:

1. **Two worlds that never fuse.** A cinematic film (the orrery renders) with
   a debug-grade overlay (thin SVG ring, pea beads, confetti-crumb crowns,
   mono chips) composited on top. The eye always knows which parts are the
   movie and which parts are the spreadsheet.
2. **The film dies at the first scroll.** 100% of the cinema lives in viewport
   1 (and briefly at Mega). Everything between is cards on ink with ~300–500px
   voids — of the 10,800px page, roughly 3,000px is empty. The "scrolling
   experience" is: movie → pamphlet.
3. **The interface speaks operator, not visitor.** "demo epoch −51",
   "W7 +20.2", "odds honored ✓", "SHOWING 16 OF ~4,000 DEMO DEPOSITORS",
   "epoch-1 scale", "SPECTATING". First-contact surfaces are written in the
   builder's dialect.

## Findings (in scroll order, harsh)

- **F1 · The centerpiece looks pasted.** The Draw Ring is a 1px wire with
  4–10px flat beads floating at an angle no ring in the film shares. At
  resolve, crowns are tiny yellow triangles scattered like crumbs — they read
  as a rendering glitch, not 31 winners. The game the whole site exists to
  demo is the least crafted object on the screen.
- **F2 · Corner barnacles.** Four corners + stage bar = six simultaneous info
  clusters before the first scroll (logo/nav, SOUND OFF, SIMULATION chip, ring
  caption, stage bar with five cells). The hero has UI acne.
- **F3 · Scroll step 1 is a rhythm collapse.** Hero → ~500px of void with a
  lone floating "SCROLL" → then copy. Meanwhile TWO leftovers of the hero
  float on screen at once: the GSAP-shrunk mini-hero (top-right, unlabeled)
  and the Mega PiP (bottom-right). Redundant, and both look accidental.
- **F4 · The PiP is a dead clock — bug-read, trust-adjacent.** It says
  "draw in 0:00" frozen on every screen of the journey (the provider pauses
  when the hero docks, but the PiP keeps rendering the corpse). A frozen
  clock advertising a "live" game is worse than no PiP.
- **F5 · Dead voids everywhere.** After Reframe (~300px), after How (~350px),
  right column of the costs card (~700px hole), Mega→Proof (~300px of empty
  sun), above Safety (~250px), FAQ→jpSOL (~400px).
- **F6 · Two Futures: right idea, accountant rendering.** Seven rows + 10px
  fine print + dotted strips; the win line ($59) carries the same visual
  weight as the caveats; "Most weeks $0.00" is the second line under the
  WITH VAULTDROP header. Honesty right, hierarchy self-sabotaging.
- **F7 · The toy is buried.** "Simulate my year" — the most fun object on the
  page — sits under three paragraphs styled like a secondary form button.
- **F8 · The Mega throne is an anticlimax.** Giant "283 SOL" one screen after
  the calculator said "$10,229 Mega ceiling." The demo pot at 100k scale can't
  carry a throne. Strip cells are debug chips ("W7 +20.2").
- **F9 · TWO-TRUTHS DEFECT (honesty class — fix first).** The Proof preview
  row hardcodes **118.4 SOL / 20 winners**; the locked economics everywhere
  else say **31 winners** (1×50% + 5×5% + 25×1%). Same defect class as
  pass-4 B3, sitting inside the trust section itself.
- **F10 · The site disagrees about what NOW is.** Hero: "Open the vault"
  (open). Mega: "SEEDING · EPOCH 1 SOON … be in orbit when it opens" (not
  open). Final: "Enter the vault" (open). Pick one truth about today.
- **F11 · Mobile hero is a UI wall.** Wordmark and headline collide at the
  top; the stage bar + two rows of chips + tally consume ~45% of the first
  viewport; the film is a sliver behind text.
- **F12 · Drip panel reads as a failed image load** at desktop sizes —
  near-black poster on ink with a barely-visible droplet.
- **What's genuinely right (protect):** the final CTA section ("Your money,
  in orbit." + honest epoch-1 line), What-can-go-wrong candor, dollarized
  copy throughout, the costs card's bravery, the engine + self-tests, the
  check-stubs CI, ledger unification, sound off-by-default.

## THE MASTER PLAN — "One World"

**Thesis: stop compositing UI on top of a movie. Build ONE owned, code-rendered
scene that the entire page happens inside.** The film becomes texture and
lighting reference, not the source of truth for the game's geometry. Code-first
— no asset is required for any phase (optional regens listed last).

### Phase C first — One Truth (hours, do before anything visual)
1. Preview row renders from `PARAMS` (pool = `weeklyPool` at the reference
   TVL, winners = `PARAMS.winnersPerDraw`); add a CI assertion that no
   pool/winner literal appears in `components/` (extend `check-stubs.mjs`).
2. `LAUNCH_STATE` single source ('demo' | 'open') in `lib/launch.ts`; hero
   CTA, Mega chip, "before deposits" card, final CTA all read from one map.
   Kill every "soon"/"open" contradiction.
3. Language sweep on first-contact surfaces: "demo epoch −51" → "practice
   draw №"; "SPECTATING" → "watching"; "odds honored ✓" → "fair draw
   verified ✓"; "SHOWING 16 OF ~4,000…" → "you're seeing 16 of ~4,000 demo
   savers"; "epoch-1 scale" chip → "launch-day size". Introduce "orb" once,
   deliberately ("drop your orb in — your stake on the table"), then own it.
4. Delete the PiP **and** the GSAP shrink-to-corner (they're both hero
   residue). Replace with one **sticky game strip** that docks under the nav
   when the hero leaves: clock · pot · your status · join — always live,
   never frozen, one component fed by the existing provider (unpause the
   countdown while the strip is visible; draws may resolve quietly off-stage
   — the ledger already handles it).

### Phase A — The Table (hero rebuild)
1. **One ring system, owned and crafted.** Replace the SVG wire with a
   canvas/DOM ring family drawn in the house materials: 3–6px brass-gradient
   strokes with specular hotspots matched to the film's key light, laid on
   the film's actual ellipse angles (`lib/ring.ts` geometry stays — it's the
   *rendering* that's debug-grade, not the math). The film dims 25% behind it
   and becomes set dressing.
2. **Orbs worth betting on:** 24–40px glass spheres (the slider-thumb
   treatment scaled up: highlight dot, inner glow, gold rim), three sizes,
   ≤24 on the ring. YOU at 44px with a label plate. Crowns become **light
   events**: bloom ring + a small gold prize plate ("+2.1") rising off the
   winner — never a glyph.
3. **De-barnacle:** SOUND and SIMULATION fold into the stage bar's ends; ring
   caption becomes the plain-language line; corners return to silence.
4. **Mobile hero = three objects:** headline, clock, one CTA. The game
   surfaces one swipe down as its own full-bleed "table" screen with chips in
   a thumb-reach bottom sheet. Fix the wordmark/headline collision.

### Phase B — The Descent (the scrolling experience)
1. **The world doesn't end — it descends.** One fixed full-viewport canvas
   layer runs the whole page; sections scroll through it. The ring system
   recedes/parallaxes as you leave the hero; a single orb (yours, if joined)
   travels down the page as a companion. At Reframe the drip happens *in the
   world* (the orb drips instead of orbiting); at Mega the core *is* the pot,
   zoomed; at the final CTA your orb docks into the gyroscope. This is the
   thing the page has never had: continuity.
2. **Close every void:** max ~120px between beats; kill the floating
   "SCROLL"; each section enters with a clip-reveal so arrival feels staged,
   not dropped.
3. **Two Futures → three beats:** (a) one sentence in display type —
   "$0.39 a week buys 52 shots at ≈$59 — and a 1-in-1,000 ticket on $10,000+";
   (b) the two cards cut to four lines each, win-line dominant, "most weeks
   $0" as the honest *close* of the card, not its opener; (c) "Show the full
   math" expands the current ledger for the skeptic. **Simulate-my-year
   becomes the section's centerpiece** — a felt-table strip directly under
   the slider, gold primary button, cells ≥28px.
4. **Mega throne leads with the ceiling** ("$10,000+ when it lands — grows
   every miss it doesn't") with the live demo pot as the running line beneath
   ("demo table: 283 SOL and rolling"); the miss-strip becomes a filling
   gold bar, not W-chips.

### Phase D — Amplitude in the owned world
Resolve re-staged with real light (the flash/bloom hit the whole scene
because the scene is ours now); winner orbs leap toward camera at 2.5×;
personal beat as a center-table plate; unified section-enter fabric; sound
stays, docked. Reduced-motion: the static path inherits the same plates and
information (existing pattern).

### Optional asset regens (nothing is a must)
- Darker-graded seamless hero loop (text sits better, ring reads brighter).
- True fullbleed ignition (still open as STUBS #14).
- Drip v2 on pure void with 15% more luminance (F12).

### Acceptance (all measurable)
- No 900px viewport window anywhere on the page with fewer than one visible
  content element ("no dead viewport" scan).
- Preview row === PARAMS; zero pool/winner literals in components (CI).
- One `LAUNCH_STATE`; a grep proves no surface contradicts it.
- Sticky strip clock ticks on every viewport of the journey (no frozen clock
  anywhere, screenshot-verified at three scroll depths).
- Crowned-winner visual footprint ≥40px *and* distinguishable in a 50%-zoom
  screenshot; ring stroke ≥3px.
- Mobile first viewport ≤35% UI chrome by area; no wordmark collision.
- Statistical self-test, ledger equality, banned-terms sweep: green,
  untouched.

**Order: C (truth, ~hours) → A (the table) → B (the descent) → D (amplitude).**
C ships alone same-day; A/B are the big build; D polishes. Every phase keeps
`npm test` + `check-stubs` green — the honesty rails are the one thing this
plan does not renegotiate.
