"use client";

/**
 * Pass 7 B1 — tiny mirror of the visitor's demo stake for surfaces that live
 * OUTSIDE the DemoDraw provider tree (the world layer's companion orb). Write
 * side: the provider's join/leave. Read side: useWorldDeposit.
 */

import { useSyncExternalStore } from "react";

let deposit: number | null = null;
const listeners = new Set<() => void>();

export function setWorldDeposit(d: number | null): void {
  deposit = d;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => deposit;
const getServerSnapshot = () => null;

export function useWorldDeposit(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
