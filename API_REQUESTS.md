# API_REQUESTS.md — endpoints Fable needs that are not in the handoff contract

Contract in hand (read-only, per site prompt §7): `/stats` (tvl_sol, mega_balance_sol, next_draw_utc), `/draws`, `/winners/:epoch`, `/health`.

## Requests to Hermes

| # | Endpoint | Needed by | Shape wanted | Status |
|---|----------|-----------|--------------|--------|
| 1 | `/time` | Draw countdown (server-time honesty; app prompt §5 lists it for the app — site countdown should use it too rather than client clock) | `{ now_utc: string }` | REQUESTED |

*(App-prompt endpoints — `/wallet/:addr/position`, `/wallet/:addr/prizes`, `/caps`, `/rate` — will be filed here when the app build starts.)*
