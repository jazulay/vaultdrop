# VAULTDROP — FRONTEND INTEGRATION HANDOFF v1.1 (Fable → Hermes)

- **From:** Fable (frontend owner: `site/` + `app/` in `github.com/jazulay/vaultdrop`)
- **Date:** 2026-07-20 (v1.1 same day: §5 PARAMS conflict RESOLVED — frontends
  aligned to the locked v1.2 economics; §1 claim contract pinned to spec v1.3
  §9 `claim_prize(slot, leaf, merkle_sum_proof)`)
- **Context:** Joseph's day-one directive: *"there is no waitlist. the site is
  live and ready from day one … full gameplay, full deposit, wallet signing
  etc."* The frontend half is deployed and transaction-ready; this document is
  the exact contract for the backend artifacts that make it live. It requests
  artifacts and specifies shapes; it approves nothing and claims no authority
  over locked backend clauses.

## 0. Deployed state (verify yourself)

| Surface | URL | State |
|---|---|---|
| Site | https://site-production-3cea.up.railway.app | Live; every CTA routes to the app; zero waitlist references |
| App | https://app-production-c038.up.railway.app | Live; real wallet connect (Phantom/Solflare/wallet-standard); tx machinery wired; truth banner lists exactly what's pending |

QA harness: append `?state=<scenario>` on any app screen (e.g. `/deposit?state=degraded`)
to render the full WS0 error/state matrix. It auto-disables once
`NEXT_PUBLIC_API_BASE` is set.

The app's readiness gate is mechanical (`app/lib/config.ts`):
`LIVE = NEXT_PUBLIC_CLUSTER === "mainnet-beta" && NEXT_PUBLIC_VAULT_PROGRAM_ID && NEXT_PUBLIC_API_BASE`.
Until LIVE, a banner states which pieces are pending. **Launch is an env flip,
not a frontend release.**

## 1. Artifact 1 — IDLs (highest priority)

Commit `idl/vault.json` (+ `idl/draws.json` if separate) to the repo. The
ONLY unimplemented functions in the entire deposit/withdraw/claim flow are
three builders in `app/lib/tx.ts`:

```ts
buildDepositIx(owner: PublicKey, amountLamports: bigint): TransactionInstruction
buildWithdrawIx(owner: PublicKey, amountLamports: bigint): TransactionInstruction
buildClaimIx(owner: PublicKey, prizeId: string): TransactionInstruction
```

Everything downstream of them — blockhash, **simulation-first** (program
errors surface before the wallet opens), signature, send, confirmation,
explorer receipt, and the full error-state UI — already works. Alongside the
IDL, please state per instruction: required accounts/PDAs and how the client
derives them, and unit conventions (lamports vs SOL-value; jpSOL decimals).

Claims are pinned to your own spec v1.3 §9: the instruction is
`claim_prize(slot, leaf, merkle_sum_proof)`. The frontend treats the claim
payload as **opaque pass-through**: `/wallet/:addr/prizes` returns, per
claimable prize, the exact `slot`, the exact `leaf` bytes, the exact
`merkle_sum_proof`, and the `draw_state` pubkey (the client derives the
`ClaimReceipt` PDA from `(draw_state, slot)` per v1.3 §7). The client encodes
them into the instruction verbatim, verifies the program id, simulates first,
and signs. Serialize `leaf` and proof nodes as base64 in the JSON; nothing
else is interpreted client-side. This closes the claim contract — no frontend
decision remains.

## 2. Artifact 2 — Program IDs

Devnet first, then mainnet. Land as `NEXT_PUBLIC_VAULT_PROGRAM_ID` on the
Railway `app` service. The moment a devnet id + IDL exist, deposits/withdraws
run end-to-end against devnet with the banner still honest about mainnet.

## 3. Artifact 3 — API base + endpoint shapes

Set `NEXT_PUBLIC_API_BASE` on both services. The app polls every 15s
(`app/lib/vaultData.ts`); the site reads `/stats` + `/draws` (`site/lib/api.ts`).
Exact fields consumed (snake_case as shown):

```
GET /stats     → { tvl_sol, tvl_cap_sol, mega_balance_sol, pool_sol,
                   next_draw_utc, paused?, degraded? }
                 (paused/degraded/pool_sol/tvl_cap_sol are additions requested
                  by this handoff — they drive the app's pause/pro-rata UI)
GET /rate      → { rate }                       // jpSOL → SOL-value program rate
GET /caps      → { wallet_cap_sol }
GET /wallet/:addr/position
               → { balance_sol, balance_jito, twab_share, wallet_cap_used_sol }
GET /wallet/:addr/prizes
               → [{ id: "<epoch>:<slot>", epoch, slot, tier, amount_sol,
                    amount_lamports, expires_utc, mega?,
                    claim: { draw_state: <pubkey>,
                             leaf: <base64, exact claim_prize leaf bytes>,
                             merkle_sum_proof: [<base64 node>, …] } }]
GET /draws     → [{ epoch, pool_sol, winners_count, vrf_proof_url, settle_tx_url }]
GET /time      → { now_utc }                    // API_REQUESTS #1, for countdowns
```

Field-name changes are fine — say the word and we remap `vaultData.ts`; the
list above is what renders today.

## 4. Artifact 4 — Production RPC

`NEXT_PUBLIC_RPC_URL` on the `app` service (public RPC will not survive
launch traffic; the client falls back to `clusterApiUrl` otherwise).

## 5. PARAMS — RESOLVED (v1.1): frontends aligned to your locked economics

No action needed. As of 2026-07-20 both frontends derive from the v1.2-locked
values: gross split **70% weekly / 15% Mega / 15% protocol fee**
(`YIELD_SPLIT_*`), tiers **1×50% + 5×5% + 25×1%** of the pool (= 31 winners,
slots 0..=30), **Mega 1-in-26** (conditional slot 31), 90-day claims from
settlement. `site/lib/calc.ts` `PARAMS` is the single frontend constant set;
the demo draw and year-sim now tier-sample prizes at true slot odds. Staking
APY remains illustrative at 7% until the live Jito feed. If P4 review changes
any locked value, changing `PARAMS` propagates everywhere.

## 6. Non-artifact notes

- The site's public commitment ("before deposits open, this page will show:"
  on /legal + Safety) enumerates: program addresses + source, audit status,
  upgrade authority + multisig, docs, final parameters, draw rules +
  withdrawal mechanics + regions. Those are the owner/Hermes items that turn
  it into receipts.
- Transfer screen assumes program-mediated jpSOL movement (matches Token-2022
  NonTransferable + atomic burn/mint in CR-002). Shape TBD with its IDL.
- Frontend repo state: all of the above is committed on `main`
  (`site/` passes 5–6 + day-one pivot). `BLOCKER.md` in the repo mirrors this
  document's artifact list in dependency order.

## 7. Verification offer

When each artifact lands, Fable will run and publish (in `site/docs/`):
devnet end-to-end deposit/withdraw/claim evidence with signatures, the
live-data swap-over check (fixtures → API), and the LIVE-gate flip rehearsal.
Wire, don't redesign — the UI contract above is what Joseph has approved
visually; if any shape can't be met, flag it here rather than adapting the
program to the UI.

— Fable
