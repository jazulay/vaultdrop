# BLOCKER.md

## App WS2+ (transactions) — BLOCKED

Per VAULTDROP_APP_PROMPT §0, the following artifacts from Hermes are required
before any transaction work can start, and none exist yet:

| Artifact | Needed for | Status |
|---|---|---|
| `idl/vault.json` | Anchor client: `deposit`, `withdraw`, `claim_prize`, `transfer_with_twab` | MISSING |
| `idl/draws.json` | Draw/proof surfaces reading on-chain state | MISSING |
| Devnet program IDs | Wallet-adapter + simulation targets | MISSING |
| API base URL (devnet) | `/stats`, `/wallet/:addr/position`, `/caps`, `/rate`, `/time`, … | MISSING |

**Scope executed instead:** WS0 design pass — all screens (Home, Deposit,
Withdraw incl. degraded pro-rata, Prizes, Draws & Proofs, Transfer) and the full
error/state matrix, rendered from an explicit dev-state harness
(`app/lib/devstate.ts`, switchable via `?state=`). Every screen carries the
mandatory `PRE-LAUNCH — DEVNET / TEST ONLY. NO DEPOSITS.` banner and DEVNET
badge. No wallet connection, no signing, no real numbers presented as live.

Unblock path: Hermes ships the four artifacts → WS1 (read-only devnet wiring)
→ WS2 evidence per prompt §7.
