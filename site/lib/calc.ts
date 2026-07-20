/**
 * Ticket-calculator math (audit §7.2). Pure functions — unit-tested against the
 * worked example in scripts/calc.test.mjs.
 *
 * Every protocol parameter lives in PARAMS and is a PLACEHOLDER until the
 * program team confirms (Appendix B Q1). The calculator UI labels itself
 * "illustrative" until then.
 */

/**
 * ALIGNED TO THE LOCKED PROTOCOL SPEC (2026-07-20): Hermes handoff v1.2
 * locks the gross yield split at 70% weekly / 15% Mega / 15% protocol fee,
 * weekly prize tiers 1×50% + 5×5% + 25×1% of the pool (= 31 winners,
 * slots 0..=30), Mega 1-in-26 (conditional slot 31). Only stakingApy remains
 * illustrative (live Jito feed at launch). Frozen until Hermes P4 review.
 */
export const PARAMS = {
  stakingApy: 0.07, // ILLUSTRATIVE — live Jito APY feed at launch
  protocolFee: 0.15, // LOCKED — 15% of gross yield
  megaShare: 0.15 / 0.85, // LOCKED — 15% of gross = this share of net (70/15/15)
  winnersPerDraw: 31, // LOCKED — 1×50% + 5×5% + 25×1% tiers
  prizeTiers: [
    { count: 1, poolShare: 0.5 },
    { count: 5, poolShare: 0.05 },
    { count: 25, poolShare: 0.01 },
  ],
  megaOddsPerWeek: 1 / 26, // LOCKED
  tvlScenarios: [25_000, 100_000, 500_000], // SOL — chips pre-launch; live TVL post-launch
} as const;

export interface CalcResult {
  apyNet: number;
  routedYearly: number;
  weeklyPool: number;
  avgPrize: number;
  share: number;
  pWeek: number;
  oneInN: number;
  pYear: number;
  megaAvgAtHit: number;
}

export function calc(depositSol: number, tvlSol: number, p = PARAMS): CalcResult {
  const apyNet = p.stakingApy * (1 - p.protocolFee);
  const routedYearly = depositSol * apyNet;
  const weeklyPool = (tvlSol * apyNet) / 52 * (1 - p.megaShare);
  const avgPrize = weeklyPool / p.winnersPerDraw;
  const share = Math.min(depositSol / tvlSol, 1);
  const pWeek = 1 - Math.pow(1 - share, p.winnersPerDraw);
  const oneInN = pWeek > 0 ? 1 / pWeek : Infinity;
  const pYear = 1 - Math.pow(1 - pWeek, 52);
  const megaAvgAtHit = tvlSol * apyNet * p.megaShare * (26 / 52);
  return { apyNet, routedYearly, weeklyPool, avgPrize, share, pWeek, oneInN, pYear, megaAvgAtHit };
}
