// Worked example — build fails if the math drifts. Aligned 2026-07-20 to the
// LOCKED protocol spec (Hermes handoff v1.2): gross split 70/15/15, tiers
// 1×50%+5×5%+25×1% (= 31 winners), Mega 1-in-26.
// D=25, T=100,000, apy=7% (illustrative), fee=15% → apyNet=5.95%.
import assert from "node:assert/strict";

// keep in sync with lib/calc.ts (plain JS mirror — lib is TS)
const PARAMS = { stakingApy: 0.07, protocolFee: 0.15, megaShare: 0.15 / 0.85, winnersPerDraw: 31 };
function calc(D, T, p = PARAMS) {
  const apyNet = p.stakingApy * (1 - p.protocolFee);
  const routedYearly = D * apyNet;
  const weeklyPool = (T * apyNet) / 52 * (1 - p.megaShare);
  const avgPrize = weeklyPool / p.winnersPerDraw;
  const share = D / T;
  const pWeek = 1 - Math.pow(1 - share, p.winnersPerDraw);
  const pYear = 1 - Math.pow(1 - pWeek, 52);
  const megaAvgAtHit = T * apyNet * p.megaShare * (26 / 52);
  return { apyNet, routedYearly, weeklyPool, avgPrize, share, pWeek, pYear, megaAvgAtHit };
}

const r = calc(25, 100_000);
const close = (a, b, tol) => Math.abs(a - b) <= tol;

assert.ok(close(r.apyNet, 0.0595, 1e-9), `apyNet ${r.apyNet}`);
assert.ok(close(r.routedYearly, 1.4875, 1e-6), `routedYearly ${r.routedYearly}`);
// weekly pool = gross yield × 70% / 52 = 7,000 × 0.70 / 52
assert.ok(close(r.weeklyPool, 94.23, 0.05), `weeklyPool ${r.weeklyPool}`);
assert.ok(close(r.avgPrize, 3.04, 0.005), `avgPrize ${r.avgPrize}`);
assert.ok(close(r.share, 0.00025, 1e-9), `share ${r.share}`);
assert.ok(close(r.pWeek, 0.007721, 0.00001), `pWeek ${r.pWeek}`);
assert.ok(close(1 / r.pWeek, 129.5, 1), `oneInN ${1 / r.pWeek}`);
assert.ok(close(r.pYear, 0.332, 0.002), `pYear ${r.pYear}`);
// mega at hit = gross yield × 15% × half-year average streak
assert.ok(close(r.megaAvgAtHit, 525, 0.5), `megaAvgAtHit ${r.megaAvgAtHit}`);

// Tier structure (locked): shares sum to 100% of the pool across 31 slots.
const TIERS = [
  { count: 1, poolShare: 0.5 },
  { count: 5, poolShare: 0.05 },
  { count: 25, poolShare: 0.01 },
];
assert.equal(
  TIERS.reduce((a, t) => a + t.count, 0),
  PARAMS.winnersPerDraw,
  "tier counts must sum to winnersPerDraw",
);
assert.ok(
  close(TIERS.reduce((a, t) => a + t.count * t.poolShare, 0), 1, 1e-9),
  "tier shares must sum to 100% of the pool",
);

// --- Pass 5 §3.1, settled: EV including EVERY prize chance is D × apyNet ---
// in every configuration — the pot is a closed system funded entirely by
// depositors' yield, so redistribution cannot manufacture expectation. EV vs
// plain staking is therefore DOWN by exactly the fee. This lockdown exists so
// no future surface can claim (or imply) prize chances improve expected value.
for (const [D, T, p] of [
  [25, 100_000, PARAMS],
  [25, 25_000, PARAMS],
  [25, 500_000, PARAMS],
  [1000, 100_000, PARAMS],
  [0.5, 25_000, PARAMS],
  [25, 100_000, { ...PARAMS, megaShare: 0.5 }],
  [25, 100_000, { ...PARAMS, winnersPerDraw: 5 }],
  [25, 100_000, { ...PARAMS, protocolFee: 0 }], // §4.2: zero fee ⇒ EV equals staking exactly
]) {
  const c = calc(D, T, p);
  // Route 1 — follow the money: your weight share of everything routed to prizes.
  const route1 = (D / T) * T * c.apyNet;
  // Route 2 — odds × payouts (megaAvgAtHit × 2 hits/yr × your share; weekly
  // pool share is exact via share×pool, pWeek×avgPrize is the ≈ form).
  const route2 = 52 * c.share * c.weeklyPool + 2 * c.share * c.megaAvgAtHit;
  const staking = D * p.stakingApy;
  assert.ok(close(route1, D * c.apyNet, 1e-9), `route1 ${route1} != D·apyNet`);
  assert.ok(close(route2, D * c.apyNet, D * c.apyNet * 0.001), `route2 ${route2} disagrees`);
  assert.ok(route1 <= staking + 1e-12, `EV ${route1} may never exceed staking ${staking}`);
  assert.ok(
    close(staking - route1, D * p.stakingApy * p.protocolFee, 1e-9),
    "the EV gap must be exactly the fee",
  );
}
// The worked numbers: 1.4875 vs 1.750 SOL — down 15.0%, exactly the fee.
assert.ok(close(calc(25, 100_000).routedYearly, 1.4875, 1e-6));
assert.ok(close(25 * PARAMS.stakingApy, 1.75, 1e-9));

console.log("calc.test: all assertions pass", {
  routedYearly: r.routedYearly.toFixed(3),
  weeklyPool: r.weeklyPool.toFixed(1),
  avgPrize: r.avgPrize.toFixed(2),
  pWeek: (r.pWeek * 100).toFixed(4) + "%",
  pYear: (r.pYear * 100).toFixed(1) + "%",
  megaAvgAtHit: r.megaAvgAtHit.toFixed(0),
});
