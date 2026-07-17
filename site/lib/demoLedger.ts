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
  /** Demo epoch counter (negative pre-launch; never claims a real epoch). */
  epoch: number;
  /** Weekly accrual per miss — the "+36.3" figure, from PARAMS. */
  accrual: number;
  initialized: boolean;
}

const accrual = megaWeeklyAccrual(DEMO_VAULT_SOL);

let state: DemoLedger = { pot: 0, missWeeks: 0, epoch: -52, accrual, initialized: false };
const listeners = new Set<() => void>();

function emit(next: Partial<DemoLedger>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

/**
 * Client-side init: sample the streak-so-far once with true 1-in-26 survival
 * per week (geometric, capped at 78 for display sanity, floored at half the
 * expected streak so a fresh pot doesn't read as broken). Sampled, not chosen.
 */
export function initLedger(): void {
  if (state.initialized) return;
  const n = Math.round(1 / PARAMS.megaOddsPerWeek);
  let weeks = 0;
  while (weeks < 78 && !oneIn(n)) weeks++;
  weeks = Math.max(weeks, Math.round(n / 2));
  emit({ pot: weeks * accrual, missWeeks: weeks, initialized: true });
}

/** A demo draw missed the Mega: pot accrues one week. */
export function ledgerMiss(): void {
  emit({
    pot: state.pot + accrual,
    missWeeks: state.missWeeks + 1,
    epoch: state.epoch >= -1 ? -52 : state.epoch + 1,
  });
}

/** The Mega landed: returns the pot that was hit; history restarts. */
export function ledgerHit(): number {
  const hit = state.pot;
  emit({ pot: 0, missWeeks: 0, epoch: state.epoch >= -1 ? -52 : state.epoch + 1 });
  return hit;
}

/** Non-reactive read for event handlers (result lines, banners). */
export function getLedgerState(): DemoLedger {
  return state;
}

const getSnapshot = () => state;
const serverSnapshot: DemoLedger = { pot: 0, missWeeks: 0, epoch: -52, accrual, initialized: false };
const getServerSnapshot = () => serverSnapshot;
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useDemoLedger(): DemoLedger {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
