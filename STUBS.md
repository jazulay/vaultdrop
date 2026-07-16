# STUBS.md — everything stubbed, labeled, or pending

| # | Item | Where | State | Replaced by |
|---|------|-------|-------|-------------|
| 1 | Hermes API base URL | `site/lib/api.ts` | Stubbed client → all live slots render pre-launch states | Hermes Railway API base (`NEXT_PUBLIC_API_BASE`) |
| 2 | Legal copy (ToS / Privacy / Draw Rules) | `/legal` page | Holding copy, no bracketed placeholders (CI guard enforces) | Joseph's counsel |
| 3 | Epoch-1 open date | Countdowns (hero, Mega, PiP) | Hidden until `NEXT_PUBLIC_EPOCH1_UTC` is set | Joseph (audit Appendix B Q3) |
| 4 | Docs link | jpSOL strip + footer trust strip | `#` href with `data-stub` | Docs URL (Q7) |
| 5 | Waitlist endpoint | `S7Cta` form | Honest "not connected" state until `NEXT_PUBLIC_WAITLIST_URL` set | Hermes (Q6; double-opt-in policy TBD) |
| 6 | Calculator protocol params | `site/lib/calc.ts` `PARAMS` | PLACEHOLDER constants, labeled "illustrative" in UI | Program team (Q1: APY feed, fee %, Mega share, winners/draw) |
| 7 | VRF provider name + program address + audit status | Proof + Safety + footer | Named generically ("on-chain VRF"); audit/upgrade-authority lines say "published before launch" | Hermes/Joseph (Q4) |
| 8 | Social links (X, Discord) | Footer trust strip | Omitted (never invented) | Joseph (Q7) |
| 9 | Canonical URL / metadataBase | `app/layout.tsx` | rel=canonical renders from `NEXT_PUBLIC_SITE_ORIGIN` (falls back to localhost:3311 for local audits) | Joseph (set env to production domain) |
| 10 | Mega Vault seed amount | Hero scoreboard | Seeding chip w/o number until seeded (Q2) | Hermes `/stats` |
| 11 | `calculator-orb-mint-loop` video | — | Keyframe generated (`assets/keyframes/orbmint.png`), video not yet cut into the calculator | Design decision after launch params land |
| 12 | "lottery" lexicon | Hero sub, OG copy, Reframe | REVERTED (audit pass 2 NF-3, 2026-07-16): "lottery" removed site-wide ("weekly tickets"); the pass-1 verbatim copy was the auditor's miss. Banned pending counsel: "lottery", "sweepstakes", "raffle" | Counsel (may re-approve) |

## Answers still needed (audit Appendix B)
Q1 calc params · Q2 Mega seed · Q3 epoch-1 date · Q4 VRF/program/audit · Q5 withdrawal latency (FAQ hedges honestly) · Q6 waitlist endpoint + opt-in · Q7 socials/docs · Q8 confirm 100% of yield routes to prizes (FAQ "never win" answer assumes yes, consistent with the fee disclosure, which renders from `PARAMS.protocolFee` as of audit pass 2 NF-1)
