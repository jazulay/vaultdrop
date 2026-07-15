// Worked example from the audit handoff §7.2 — build fails if the math drifts.
// D=25, T=100,000, apy=7%, fee=10% → apyNet=6.3%, winners=20, megaShare=30%
import assert from "node:assert/strict";

// keep in sync with lib/calc.ts (plain JS mirror — lib is TS)
const PARAMS = { stakingApy: 0.07, protocolFee: 0.1, megaShare: 0.3, winnersPerDraw: 20 };
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

assert.ok(close(r.apyNet, 0.063, 1e-9), `apyNet ${r.apyNet}`);
assert.ok(close(r.routedYearly, 1.575, 1e-6), `routedYearly ${r.routedYearly}`);
assert.ok(close(r.weeklyPool, 84.8, 0.05), `weeklyPool ${r.weeklyPool}`);
assert.ok(close(r.avgPrize, 4.24, 0.005), `avgPrize ${r.avgPrize}`);
assert.ok(close(r.share, 0.00025, 1e-9), `share ${r.share}`);
assert.ok(close(r.pWeek, 0.004988, 0.00001), `pWeek ${r.pWeek}`);
assert.ok(close(1 / r.pWeek, 200, 1), `oneInN ${1 / r.pWeek}`);
assert.ok(close(r.pYear, 0.229, 0.002), `pYear ${r.pYear}`);
assert.ok(close(r.megaAvgAtHit, 945, 0.5), `megaAvgAtHit ${r.megaAvgAtHit}`);

console.log("calc.test: all assertions pass", {
  routedYearly: r.routedYearly.toFixed(3),
  weeklyPool: r.weeklyPool.toFixed(1),
  avgPrize: r.avgPrize.toFixed(2),
  pWeek: (r.pWeek * 100).toFixed(4) + "%",
  pYear: (r.pYear * 100).toFixed(1) + "%",
  megaAvgAtHit: r.megaAvgAtHit.toFixed(0),
});
