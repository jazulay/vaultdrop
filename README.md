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
- `NEXT_PUBLIC_FIRST_DRAW_DATE` — e.g. `Aug 2, 2026`. Unset → `TBA`.
- `NEXT_PUBLIC_WAITLIST_URL` — POST target for waitlist emails. Unset → honest "not connected" state.

Higgsfield assets live in `site/public/higgsfield/{video,poster}` (committed).
Raw generations in `assets/raw/` (gitignored); keyframes in `assets/keyframes/`.

**Note for Hermes (prime directive): wire, don't redesign.** The three integration
points are `lib/api.ts` (`/stats`, `/draws` polling), the countdown target, and the
waitlist POST. Everything else is Fable's.

## Governance files

- `STUBS.md` — everything stubbed, and what replaces it
- `API_REQUESTS.md` — endpoints requested from Hermes
- `BLOCKER.md` — hard blocks (app WS2+)
