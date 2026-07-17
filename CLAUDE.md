# CLAUDE.md — VaultDrop working context

Carried over from Claude Code's session memory on Joseph's MacBook (exported 2026-07-16).
This file is the working-relationship context; `README.md` is the source of truth for
commands, env vars, and paths — if they conflict, README wins.

> **New here? Read [`HANDOFF.md`](HANDOFF.md) first** — it's the current map
> (run/deploy, architecture, gotchas, the audit paper trail) as of pass 4.

## Project

VaultDrop: non-custodial prize-linked savings on Solana. "Never lose. Sometimes win big."

## Division of labor (two AI roles)

- **Fable owns frontend/design** — the `site/` marketing site and `app/` vault app UI.
  Sessions in this repo default to the Fable role unless Joseph says otherwise.
- **Hermes owns protocol/API/deploy** — separate handoff doc; deploys to Railway.
  Prime directive to Hermes: **wire, don't redesign.** Integration points are
  `site/lib/api.ts` (`/stats`, `/draws` polling), the countdown target, and the waitlist POST.

## Hard rules from Joseph (kill-on-violation)

- **No fabricated data, ever**: no invented winners, TVL, APY, or testimonials.
  Live slots render verbatim pre-launch states or an honest `—`.
- **The word "lottery" never appears.** Use "prize savings", "draws",
  "prizes funded by yield".
- **No silent stubs or invented endpoints.** Governance files at repo root:
  `STUBS.md` (every placeholder logged), `API_REQUESTS.md` (endpoints Fable needs
  from Hermes), `BLOCKER.md` (what's gated on Hermes).
- **Evidence artifacts required per work package** — see `site/docs/` for the
  pattern (captures at 390/768/1440, reduced-motion audit, claims audit).

## Status (updated 2026-07-17, after pass 4)

- `site/` — live on Railway through **4 audit passes**. Pass 3 built the hero
  **demo draw** (30s cycle at true odds, `lib/draw.ts` + `components/DemoDraw.tsx`);
  pass 4 amplified it (stage bar, one demo ledger in `lib/demoLedger.ts`,
  four-layer resolve, 6s year-sim) and fixed 6 play-test bugs. See
  `HANDOFF.md` and `site/docs/PASS{3,4}_RESPONSE.md`.
- `app/` — WS0 design pass done via `lib/devstate.ts` `?state=` fixture harness.
  **WS2+ blocked on Hermes IDLs / devnet API — see `BLOCKER.md`.**
- Deploy: `cd site && railway up --detach --service site` (root `.railwayignore`
  is required — see HANDOFF gotchas).

## Asset pipeline that worked (Higgsfield MCP)

1. nano-banana keyframe stills — generate a style anchor first, then reference it
   in subsequent frames (keyframes in `assets/keyframes/`).
2. Seedance 2.0 video with `start_image=end_image` for seamless loops.
3. ffmpeg (**ffmpeg-static npm package — no Homebrew on Joseph's Macs**) for
   crossfade-loop fixes on drifty clips + SVT-AV1 webm / H.264 mp4 / posters.
   Raw generations live in `assets/raw/` (tracked in git as of 2026-07-16);
   final encodes in `site/public/higgsfield/{video,poster}`.

## Machines

Primary dev machine is Joseph's **Mac mini** (as of 2026-07-16). The MacBook Pro
clone may go stale — `git pull` before touching it there. Remote:
`git@github.com:jazulay/vaultdrop.git` (private).
