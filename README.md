# VaultDrop

Non-custodial prize-linked savings on Solana. **"Never lose. Sometimes win big."**

| Deliverable | Path | Status |
|---|---|---|
| Marketing site (VAULTDROP_FABLE_SITE_PROMPT v1.1) | `site/` | Built — WS0–WS4 evidence in `site/docs/` |
| Vault app (VAULTDROP_APP_PROMPT v1.0) | `app/` | WS0 design pass; WS2+ blocked on Hermes IDLs (`BLOCKER.md`) |

## Site

```bash
cd site && npm install && npm run dev
```

- `NEXT_PUBLIC_API_BASE` — Hermes API base URL. Unset → verbatim pre-launch states.
- `NEXT_PUBLIC_LAUNCHED` — `1` flips every CTA to "Deposit" and live scoreboard (audit P0-2 gate).
- `NEXT_PUBLIC_EPOCH1_UTC` — epoch-1 open, UTC ISO (e.g. `2026-08-02T18:00:00Z`). Drives all pre-launch countdowns; unset → seeding chip, no countdown.
- `NEXT_PUBLIC_WAITLIST_URL` — POST target for waitlist emails. Unset → honest "not connected" state.
- `NEXT_PUBLIC_SITE_ORIGIN` — production origin for `metadataBase`/`rel=canonical` (audit pass 2 NF-4). Unset → `http://localhost:3311` so local builds stay auditable.

`npm run build` runs the placeholder CI guard (`scripts/check-stubs.mjs`);
`npm test` checks the calculator against the audit's worked example.

Higgsfield assets live in `site/public/higgsfield/{video,poster}` (committed).
Raw generations in `assets/raw/` (tracked); keyframes in `assets/keyframes/`.

**Note for Hermes (prime directive): wire, don't redesign.** The three integration
points are `lib/api.ts` (`/stats`, `/draws` polling), the countdown target, and the
waitlist POST. Everything else is Fable's.

## Deployment (Railway)

Live at **https://site-production-3cea.up.railway.app** — project `vaultdrop`
(id `9458f655-91ea-4fe9-b849-4b79e020af48`), service `site`, root directory `/site`.

```bash
cd site && railway up --detach --service site -m "<summary>"
```

- Deploys are CLI-only (`railway up`) — no GitHub auto-deploy is connected.
- `railway up` archives the **repo root** regardless of cwd; the root
  `.railwayignore` keeps the upload small (excludes `assets/`, `site/docs/`,
  `app/`, `node_modules/`, `.next/`). Don't delete it — uploads 413 without it.
- `NEXT_PUBLIC_SITE_ORIGIN` is set on the service (canonical/OG base). Other
  `NEXT_PUBLIC_*` vars are intentionally unset pre-launch (honest states).
  They're build-time: after changing one, redeploy.

## Governance files

- `STUBS.md` — everything stubbed, and what replaces it
- `API_REQUESTS.md` — endpoints requested from Hermes
- `BLOCKER.md` — hard blocks (app WS2+)
