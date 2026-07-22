"use client";

/**
 * THE ONE DEMO LEDGER (pass 4 B3) — a single module-level history of the demo
 * vault's Mega pot, driven exclusively by the hero draw loop and read by every
 * surface that mentions it (hero ticker, rollover strip, Mega section, PiP).
 * Two simulations may never disagree about the same fictional vault: equality
 * across surfaces is by construction, not by coincidence.
 */

import { useSyncExternalStore } from "react";
import { DEMO_VAULT_SOL, megaWeeklyAccrual, oneIn } from "./draw";
import { PARAMS } from "./calc";

export interface DemoLedger {
  /** Current demo Mega pot in SOL. */
  pot: number;
  /** Consecutive miss-weeks since the last (simulated) hit. */
  missWeeks: number;
  /**
   * Pass 7 C3: running practice-draw counter, positive and human ("practice
   * draw №4,301"). Replaces the old negative counter that read as a bug to
   * first-time visitors. Never claims to be a real epoch.
   */
  drawNo: number;
  /** Weekly accrual per miss — the "+36.3" figure, from PARAMS. */
  accrual: number;
  initialized: boolean;
}

const accrual = megaWeeklyAccrual(DEMO_VAULT_SOL);

let state: DemoLedger = { pot: 0, missWeeks: 0, drawNo: 1, accrual, initialized: false };
const listeners = new Set<() => void>();

/* Pass 6 big-swing: the demo world REMEMBERS. "It grows until someone takes
 * it" must be true of the demo across visits — so the ledger persists, and a
 * return visit advances the elapsed 30s draws through the same true-odds
 * sampling. Same simulation, continued; nothing fabricated. */
const STORE_KEY = "vd-demo-ledger-v1";
const DRAW_MS = 30_000;
const MAX_CATCHUP = 100_000; // ~35 days of draws; beyond that, resample fresh

export interface AwayReport {
  draws: number;
  grown: number;
  hits: number;
}
let awayReport: AwayReport | null = null;
export function getAwayReport(): AwayReport | null {
  return awayReport;
}

function persist() {
  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ pot: state.pot, missWeeks: state.missWeeks, drawNo: state.drawNo, savedAt: Date.now() }),
    );
  } catch {}
}

function emit(next: Partial<DemoLedger>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
  if (state.initialized) persist();
}

/**
 * Client-side init. First visit: sample the streak-so-far once with true
 * 1-in-26 survival per week (geometric, capped at 78 for display sanity,
 * floored at half the expected streak). Return visit: restore the saved
 * ledger and roll the elapsed draws at the same true odds — the pot the
 * visitor left really did keep living.
 */
export function initLedger(): void {
  if (state.initialized) return;
  const n = Math.round(1 / PARAMS.megaOddsPerWeek);

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as {
        pot: number;
        missWeeks: number;
        drawNo?: number;
        epoch?: number; // pre-pass-7 saves
        savedAt: number;
      };
      const elapsed = Math.floor((Date.now() - saved.savedAt) / DRAW_MS);
      if (
        isFinite(saved.pot) &&
        saved.pot >= 0 &&
        elapsed >= 0 &&
        elapsed <= MAX_CATCHUP
      ) {
        let { pot, missWeeks } = saved;
        // Migration: old saves carried a negative epoch; seed the counter from
        // the world's real age (it has run at least missWeeks draws).
        let drawNo = saved.drawNo ?? Math.max(1, saved.missWeeks);
        let hits = 0;
        for (let i = 0; i < elapsed; i++) {
          if (oneIn(n)) {
            pot = 0;
            missWeeks = 0;
            hits++;
          } else {
            pot += accrual;
            missWeeks++;
          }
          drawNo++;
        }
        if (elapsed > 0) {
          awayReport = { draws: elapsed, grown: Math.max(0, pot - saved.pot), hits };
        }
        emit({ pot, missWeeks, drawNo, initialized: true });
        return;
      }
    }
  } catch {}

  let weeks = 0;
  while (weeks < 78 && !oneIn(n)) weeks++;
  weeks = Math.max(weeks, Math.round(n / 2));
  emit({ pot: weeks * accrual, missWeeks: weeks, drawNo: weeks, initialized: true });
}

/** A demo draw missed the Mega: pot accrues one week. */
export function ledgerMiss(): void {
  emit({
    pot: state.pot + accrual,
    missWeeks: state.missWeeks + 1,
    drawNo: state.drawNo + 1,
  });
}

/** The Mega landed: returns the pot that was hit; history restarts. */
export function ledgerHit(): number {
  const hit = state.pot;
  emit({ pot: 0, missWeeks: 0, drawNo: state.drawNo + 1 });
  return hit;
}

/** Non-reactive read for event handlers (result lines, banners). */
export function getLedgerState(): DemoLedger {
  return state;
}

const getSnapshot = () => state;
const serverSnapshot: DemoLedger = { pot: 0, missWeeks: 0, drawNo: 1, accrual, initialized: false };
const getServerSnapshot = () => serverSnapshot;
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useDemoLedger(): DemoLedger {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
