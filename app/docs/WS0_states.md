# WS0 — Design pass evidence · VaultDrop app
2026-07-15 · `next build` clean (First Load JS ≤ 99 KB ≤ 520 KB budget) · all captures in `docs/captures/`

**Harness:** every screen renders from `lib/devstate.ts` fixtures selected via
`?state=` (switcher bottom-left in every capture). Nothing is presented as live;
the `PRE-LAUNCH — DEVNET / TEST ONLY. NO DEPOSITS.` banner and DEVNET badge are
permanently visible. WS1 replaces fixtures with the devnet API (BLOCKER.md).

## Error/state matrix (app prompt §7 WS0)

| State | Screen(s) | Behavior shown | Capture |
|---|---|---|---|
| empty | Home | three-line pitch + Deposit CTA | `home-empty-390.png` |
| funded | all | balance + JitoSOL equivalent, odds `ESTIMATE — final at Sunday 18:00 UTC snapshot`, Mega drum | `home-funded-{390,1440}.png` |
| api-down | Home, Deposit | `—` slots + "live data unavailable", money inputs disabled | `home-api-down-390.png` |
| cap-hit | Deposit | per-wallet cap preflight error, `{n} of 500 SOL-value used` | `deposit-cap-hit-390.png` |
| tvl-full | Deposit | vault headroom preflight error | `deposit-tvl-full-390.png` |
| below-min | Deposit | min 0.1 SOL-value error | `deposit-below-min-390.png` |
| paused | Deposit | deposits-paused error | `deposit-paused-390.png` |
| degraded | Home, Deposit, Withdraw | verbatim `VAULT IN PRO-RATA MODE…` banner; withdraw quote switches to labeled pro-rata formula; deposits paused | `withdraw-degraded-390.png`, `home-degraded-390.png` |
| pending | Deposit | bone 60% + spinner + short-hash | `deposit-pending-390.png` |
| confirmed | Deposit | green + explorer link | `deposit-confirmed-390.png` |
| failed | Deposit | red + decoded program error | `deposit-failed-390.png` |
| swap-partial | Deposit | `swap succeeded, deposit pending — your JitoSOL is in your wallet, resume anytime` + resume CTA | `deposit-swap-partial-390.png` |
| wallet-reject | Deposit | "rejected in wallet — nothing was sent" | `deposit-wallet-reject-390.png` |
| sim-fail | Deposit | simulation failure surfaced before send | `deposit-sim-fail-390.png` |
| prize-claimable | Prizes | gold amounts, expiry + Mega-rollover line, claim per prize | `prizes-prize-claimable-{390,1440}.png` |
| mega-won | Prizes, HUD | composed won-Mega card; orrery HUD flares gold | `prizes-mega-won-{390,1440}.png` |

Also: Draws & Proofs (`draws-funded-*.png`) — TWAB, winners, tiers `1×50% · 5×5% · 25×1%`,
VRF request/result links, leaf-set download, recompute-it-yourself steps.
Transfer (`transfer-funded-390.png`) — `transfer_with_twab` note verbatim.

## Checks

- Overflow 390/768/1440: **0 violations** (script-verified during capture).
- Lexicon grep: "lottery" → 0 · APY/EV/projected-winnings → 0.
- Fee/split line on deposit review, verbatim: `All yield funds prizes: 70% weekly draws · 15% Mega Vault · 15% protocol.`
- Verbatim review lines 1–3 present (`app/deposit/page.tsx`).
- Two-leg flows always two explicit steps ("Sign step 1 of 2 — swap").
- Green (#3BD08F) only on principal-safe actions; gold only on wins/Mega/prizes.

## Deferred to WS1/WS2 (BLOCKER.md)

Wallet-adapter, Anchor client, Jupiter SDK, real countdown from `/time`,
SWR wiring, double-tap protection at the tx layer, real signatures/explorer links.
