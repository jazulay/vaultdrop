/**
 * Demo-draw simulation engine (pass 3 §4). Every probability and figure
 * derives from PARAMS via the same formulas as the calculator — single source
 * of truth is structural, not a lint rule.
 *
 * HONESTY RAILS (§4.4, non-negotiable):
 * - RNG is crypto.getRandomValues. No Math.random anywhere in outcomes.
 * - No first-win bias, no pity timers, no rigged outcomes of any kind.
 * - Mega roll uses the program's rejection rule (no modulo bias), at u32 scale.
 * - Statistical self-test in scripts/draw.test.mjs must pass in CI.
 */

import { PARAMS, calc } from "./calc";

/** The demo vault every hero figure derives from (§4.1). */
export const DEMO_VAULT_SOL = 100_000;

/** Demo-draw cycle (§4.2), in ms. */
export const CYCLE = { orbit: 23_000, charge: 3_000, resolve: 2_000, settle: 2_000 } as const;
export const CYCLE_TOTAL = CYCLE.orbit + CYCLE.charge + CYCLE.resolve + CYCLE.settle;

const U32 = 0x1_0000_0000;

function randU32(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

/** Uniform float in [0, 1) from crypto entropy. */
export function randFloat(): number {
  return randU32() / U32;
}

/**
 * Unbiased integer in [0, n) via rejection sampling — the same rule the
 * program applies at u64 scale ("redraw while u ≥ n·⌊2⁶⁴/n⌋"), here at u32.
 */
export function rejectionInt(n: number): number {
  const limit = n * Math.floor(U32 / n);
  let u = randU32();
  while (u >= limit) u = randU32();
  return u % n;
}

/** True 1-in-N roll with the rejection rule (§4.2 mega ignition). */
export function oneIn(n: number): boolean {
  return rejectionInt(n) === 0;
}

/** Weekly Mega Vault accrual for a vault of `tvlSol` — the "+36.4 → rolls" figure. */
export function megaWeeklyAccrual(tvlSol: number): number {
  const apyNet = PARAMS.stakingApy * (1 - PARAMS.protocolFee);
  return (tvlSol * apyNet * PARAMS.megaShare) / 52;
}

export interface DrawOutcome {
  /** Personal result — null when the visitor has no orb in the vault. */
  personalWin: boolean | null;
  /** Prize on a personal win — the calculator's avgPrize for this vault. */
  personalPrize: number;
  /** Vault-level mega ignition, true 1-in-megaOddsPerWeek. */
  megaHit: boolean;
  poolSol: number;
  winners: number;
  megaGrowth: number;
  /** Visitor's per-draw odds, for the HUD ("your shot ≈ 1-in-200"). */
  personalOneInN: number | null;
}

/**
 * Resolve one demo draw. `depositSol` is the visitor's demo orb (null = spectating).
 * Personal win is a single Bernoulli at the calculator's pWeek — exactly the
 * true odds, nothing else.
 */
export function drawOnce(depositSol: number | null, tvlSol: number = DEMO_VAULT_SOL): DrawOutcome {
  const base = calc(depositSol ?? 1, tvlSol);
  const personal = depositSol !== null ? calc(depositSol, tvlSol) : null;
  return {
    personalWin: personal ? randFloat() < personal.pWeek : null,
    personalPrize: base.avgPrize,
    megaHit: oneIn(Math.round(1 / PARAMS.megaOddsPerWeek)),
    poolSol: base.weeklyPool,
    winners: PARAMS.winnersPerDraw,
    megaGrowth: megaWeeklyAccrual(tvlSol),
    personalOneInN: personal ? personal.oneInN : null,
  };
}

/**
 * Starting demo Mega pot: a geometrically-sampled miss streak (true 1-in-26
 * survival per week) × the weekly accrual — "as if the demo vault had been
 * running". Sampled, not chosen; capped at 78 weeks for display sanity.
 */
export function initialDemoMegaPot(tvlSol: number = DEMO_VAULT_SOL): number {
  let weeks = 0;
  const n = Math.round(1 / PARAMS.megaOddsPerWeek);
  while (weeks < 78 && !oneIn(n)) weeks++;
  // A fresh pot reads as broken on the HUD; floor at half the expected streak.
  weeks = Math.max(weeks, Math.round(n / 2));
  return weeks * megaWeeklyAccrual(tvlSol);
}

export interface YearCell {
  week: number;
  win: boolean;
  prize: number;
  megaHit: boolean;
  /** Personal mega win — share-weighted, astronomically rare, never faked. */
  personalMega: boolean;
  megaPotAtHit: number;
}

export interface YearResult {
  cells: YearCell[];
  wins: number;
  totalSol: number;
  megaHits: number;
  personalMegaWin: boolean;
}

/**
 * "Simulate my year" (§5.1): 52 independent weeks at true odds from the
 * current slider/chip state. Re-runs vary honestly.
 */
export function simulateYear(depositSol: number, tvlSol: number): YearResult {
  const r = calc(depositSol, tvlSol);
  const megaN = Math.round(1 / PARAMS.megaOddsPerWeek);
  const accrual = megaWeeklyAccrual(tvlSol);
  let megaPot = 0;
  const cells: YearCell[] = [];
  let wins = 0;
  let totalSol = 0;
  let megaHits = 0;
  let personalMegaWin = false;

  for (let week = 1; week <= 52; week++) {
    megaPot += accrual;
    const win = randFloat() < r.pWeek;
    const megaHit = oneIn(megaN);
    // On a vault-level mega hit, the winner is integral-weighted: your chance
    // is exactly your share. True odds — a hit here is a real jackpot moment.
    const personalMega = megaHit && randFloat() < r.share;
    if (win) {
      wins++;
      totalSol += r.avgPrize;
    }
    if (personalMega) {
      personalMegaWin = true;
      totalSol += megaPot;
    }
    cells.push({ week, win, prize: r.avgPrize, megaHit, personalMega, megaPotAtHit: megaPot });
    if (megaHit) {
      megaHits++;
      megaPot = 0;
    }
  }
  return { cells, wins, totalSol, megaHits, personalMegaWin };
}
