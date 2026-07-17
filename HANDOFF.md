# HANDOFF — VaultDrop frontend (read this first)

Last updated 2026-07-17, after audit pass 4. If you're a fresh agent picking
up this repo on the Mac mini, this file + `CLAUDE.md` (auto-loaded) are your
map. `README.md` wins on commands/paths if anything here drifts.

## Current state — one sentence

The `site/` marketing site is built through **four audit passes**, live on
Railway, and its centerpiece is an honestly-labeled **demo draw** that runs in
the hero at true odds. Nothing is blocked on the frontend; the open items are
owner answers and Hermes-side wiring (below).

## Where everything lives

- **This machine (Mac mini) is the source of truth.** Repo at
  `~/Projects/vaultdrop`, remote `github.com/jazulay/vaultdrop` (private). `gh`
  is authed as `jazulay` over HTTPS — clone/push just work, no SSH key needed.
  The old MacBook clone is stale; ignore it.
- **Two halves of the product:**
  - `site/` + `app/` here = **Fable-owned** frontend (Next.js 14).
  - `~/.hermes/work/vaultdrop` = **Hermes-owned** Rust/Anchor protocol/API.
    Not in this repo, no web server there. "Wire, don't redesign" is the
    prime directive to Hermes.

## Run it

```bash
cd ~/Projects/vaultdrop/site
npm install                 # first time
npx next dev -p 3311        # dev — Joseph's chosen port (3000/3100 are taken)
# or, to match what audits test:
npm run build && npx next start -p 3311   # prod build + serve
```

- `npm test` = calculator math check **and** the demo-draw statistical
  self-test (10k draws within binomial CI). Both must stay green.
- `npm run build` runs `check-stubs.mjs`: fails the build on any placeholder or
  banned term in emitted HTML **or** in `components/`/`lib/` sources.
- Env vars (all optional; unset → honest pre-launch states): `NEXT_PUBLIC_API_BASE`,
  `NEXT_PUBLIC_LAUNCHED`, `NEXT_PUBLIC_EPOCH1_UTC`, `NEXT_PUBLIC_WAITLIST_URL`,
  `NEXT_PUBLIC_SITE_ORIGIN`. Full descriptions in `README.md`. They are
  **build-time** — rebuild after changing one.

## Deploy it (Railway)

Live at **https://site-production-3cea.up.railway.app**. Project `vaultdrop`
(`9458f655-91ea-4fe9-b849-4b79e020af48`), service `site`, root directory `/site`.

```bash
cd ~/Projects/vaultdrop/site
railway up --detach --service site -m "<summary>"
```

CLI-only — no GitHub auto-deploy is connected. **Read the gotchas below before
your first deploy** — there are three that cost real time.

## Architecture map (the load-bearing files)

- `lib/calc.ts` — `PARAMS` is the **single source of truth for all math**
  (fee, APY, Mega share, winners, odds). Everything — calculator, FAQ fee line,
  demo draw — derives from it. Placeholder until the program team confirms.
- `lib/draw.ts` — demo-draw **engine**: crypto RNG, rejection-sampled 1-in-26,
  pWeek personal odds. Zero rigging. Tested by `scripts/draw.test.mjs`.
- `lib/demoLedger.ts` — **THE one demo-Mega history** (pass 4 B3). The hero
  ticker, the Mega-section numeral, the rollover strip, and the PiP all
  subscribe to this. **Never render a demo-Mega figure from anywhere else** —
  that reintroduces the honesty defect two surfaces disagreeing.
- `components/DemoDraw.tsx` — the hero game: provider + stage (orbs, four-layer
  resolve, stage bar) + morphing CTA + PiP info. Composited over the orrery
  video in `components/HeroOrrery.tsx`.
- `lib/analytics.ts` — events to `window.dataLayer` only (no provider wired).
- `components/sections/*` — one file per page section (S2How, Calculator,
  S3Mega, S4Proof, Safety, S6Faq, S7Cta, Reframe).

## Hard rules (kill-on-violation — Joseph's, non-negotiable)

1. **No fabricated data, ever.** No invented winners, TVL, APY, testimonials,
   wallets, or names. Live slots render verbatim pre-launch states or `—`.
2. **The words "lottery", "sweepstakes", "raffle" never appear** (pending
   counsel). CI-enforced in sources now. Use "prize savings", "draws",
   "weekly tickets".
3. **No silent stubs / invented endpoints.** Log every placeholder in
   `STUBS.md`, every endpoint you need from Hermes in `API_REQUESTS.md`, every
   hard block in `BLOCKER.md`.
4. **Every demo/simulated figure derives from `PARAMS`.** No outcome may ever
   be prettier than it is true. Keep the statistical self-test green; never add
   first-win bias, pity timers, or any luck adjustment.
5. **Evidence per work package** — see the `PASS*_RESPONSE.md` pattern and
   `docs/pass3` / `docs/pass4` captures. Measure acceptance, don't eyeball it.

## Gotchas (learned the hard way — save yourself the loop)

- **`railway up` archives the REPO ROOT** regardless of the directory you run
  it from. The root `.railwayignore` (excludes `assets/`, `site/docs/`,
  `/app/`, `node_modules/`, `.next/`) is what keeps the upload from 413-ing at
  360 MB. Don't delete it. Its patterns are **anchored** (`/app/` not `app/`)
  so they don't also match `site/app` — an unanchored `app/` breaks the build
  ("couldn't find pages or app directory").
- **The use-railway skill's `railway-api.sh` is broken on Railway CLI v5** — it
  reads `user.token` but v5 stores the token at `user.accessToken` in
  `~/.railway/config.json`. For raw GraphQL, `curl` `backboard.railway.com/graphql/v2`
  with `Authorization: Bearer <accessToken>` directly.
- **The Railway MCP tools auth separately from the CLI** and were stale this
  session. If MCP calls 401, use the CLI (`railway ...`) instead.
- **Do not measure motion/fps in the embedded Browser pane** on this site — it
  serves stale frames below the fold (Lenis smooth-scroll + frame starvation).
  Use Playwright. It's not a repo dependency; it was installed ad hoc in the
  session scratchpad. If you need it, `npm i playwright` somewhere outside the
  repo (don't add it to `site/`), or reuse the harness scripts if the
  scratchpad still exists.

## The paper trail (audits + responses)

Each audit came in as a handoff `.md` in `~/Downloads`; each response lives in
the repo:

- Pass 1 (psychology/structure) → `site/docs/AUDIT_RESPONSE.md`
- Pass 2 (verification, NF-1…NF-6) → `site/docs/AUDIT_PASS2_RESPONSE.md`
- Pass 3 (the adrenaline layer — built the demo draw) → `site/docs/PASS3_RESPONSE.md`
- Pass 4 (the volume pass — amplitude + 6 bugs) → `site/docs/PASS4_RESPONSE.md`
- Captures: `site/docs/pass3/`, `site/docs/pass4/`.

**The next audit (pass 5) will land as a new `.md` in `~/Downloads`.** Read the
matching-named response docs first to see what each earlier pass already
settled before you touch anything.

## Open items (not frontend blocks — don't "fix" these blind)

- **Owner answers** (Joseph): epoch-1 date, VRF provider/program/audit links,
  social + docs URLs, final `PARAMS`, waitlist endpoint, Mega seed decision.
- **Higgsfield assets** (`STUBS.md` #14): `mega-ignition-fullbleed` and
  `reframe-drip-loop` v2. Interim treatments are in place and look right.
- **Deferred** (`STUBS.md` #13, #15): analytics provider (events fire to
  dataLayer only); optional sound layer (not built).
- **For the next audit to measure on device:** 60fps on mid-tier mobile and
  Lighthouse on the prod build — neither is testable over the local bridge.

## Working rhythm that's worked

Commit + push only when Joseph says. Deploy to Railway when a pass lands, with
weight numbers attached. Keep `STUBS.md` / `API_REQUESTS.md` / `BLOCKER.md`
current as you go — they're how Hermes and the auditor stay in sync with you.
