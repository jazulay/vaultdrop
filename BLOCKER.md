# BLOCKER.md — the launch-gating list

> Full artifact shapes + endpoint contract:
> `VAULTDROP_FRONTEND_INTEGRATION_HANDOFF_v1_1.md` (repo root; delivered to
> `~/.hermes/work/vaultdrop/docs/` 2026-07-20, superseding v1.0).

**Day-one pivot (2026-07-20, Joseph): there is no waitlist. The full
experience — gameplay, deposits, wallet signing — must be live from day one.**

The frontend side of that is DONE and deployed:

- **App** (`app/`, Railway service `app`, https://app-production-c038.up.railway.app):
  real wallet connect (wallet-adapter: Phantom/Solflare/wallet-standard,
  autoConnect), complete transaction machinery (blockhash → simulate-first →
  sign → send → confirm → explorer receipt, with the full WS0 error-state
  matrix as the runtime state machine), live-data client polling the API
  contract with labeled fixture fallback, and a truth banner that derives from
  runtime config — the SAME build flips to the live product via env, zero code
  changes.
- **Site** (`site/`): waitlist removed everywhere; every CTA routes to the app.

## What Hermes must ship for day one (in dependency order)

| # | Artifact | Unblocks | Env/where it lands |
|---|----------|----------|--------------------|
| 1 | `idl/vault.json` (+ `idl/draws.json`) | Instruction encoding in `app/lib/tx.ts` (`buildDepositIx` / `buildWithdrawIx` / `buildClaimIx` — the ONLY unimplemented functions; everything downstream already works) | committed to repo |
| 2 | Program IDs (devnet, then mainnet) | Transactions build + simulate | `NEXT_PUBLIC_VAULT_PROGRAM_ID` on the `app` service |
| 3 | API base URL serving `/stats`, `/rate`, `/caps`, `/wallet/:addr/position`, `/wallet/:addr/prizes`, `/draws`, `/time` | Live data replaces fixtures automatically (`app/lib/vaultData.ts` maps these; add `paused`/`degraded`/`pool_sol`/`tvl_cap_sol` flags to `/stats`) | `NEXT_PUBLIC_API_BASE` on both services |
| 4 | Production RPC URL | Reliable mainnet reads/sends (public RPC won't survive launch traffic) | `NEXT_PUBLIC_RPC_URL` on the `app` service |
| 5 | `NEXT_PUBLIC_CLUSTER=mainnet-beta` flip | The truth banner disappears and the build IS the live product | `app` service env |

The frontend gate is mechanical: **LIVE = mainnet-beta ∧ program id ∧ API
base** (`app/lib/config.ts`). Until all three are true the app shows exactly
which pieces are pending — honest by construction, launch-ready by env flip.

## Not frontend, still launch-gating (owner)

Final PARAMS · VRF provider + proof links · audit publication · counsel items
(legal pages, regions, the banned-lexicon decision) · docs URL. The site's
"before deposits open, this page will show" checklist (Safety + /legal) is the
public commitment these fill.
