/**
 * Ticket-calculator math (audit §7.2). Pure functions — unit-tested against the
 * worked example in scripts/calc.test.mjs.
 *
 * Every protocol parameter lives in PARAMS and is a PLACEHOLDER until the
 * program team confirms (Appendix B Q1). The calculator UI labels itself
 * "illustrative" until then.
 */

export const PARAMS = {
  stakingApy: 0.07, // PLACEHOLDER — CONFIRM WITH PROGRAM (later: live Jito APY feed)
  protocolFee: 0.1, // PLACEHOLDER — CONFIRM WITH PROGRAM
  megaShare: 0.3, // PLACEHOLDER — CONFIRM WITH PROGRAM
  winnersPerDraw: 20, // PLACEHOLDER — CONFIRM WITH PROGRAM
  megaOddsPerWeek: 1 / 26, // from live copy — confirm
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
