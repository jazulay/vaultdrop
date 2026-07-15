"use client";

import { useSearchParams } from "next/navigation";

/**
 * WS0 DESIGN-PASS HARNESS — not live data. (BLOCKER.md: IDLs + devnet API
 * pending from Hermes.) Every number below is a design fixture rendered inside
 * screens that permanently carry the PRE-LAUNCH / DEVNET banner; nothing here
 * is presented as live. Switch scenarios with `?state=<name>`.
 *
 * The scenario list IS the app-prompt §7 error/state matrix.
 */

export type Scenario =
  | "empty"
  | "funded"
  | "pending"
  | "confirmed"
  | "failed"
  | "cap-hit"
  | "tvl-full"
  | "below-min"
  | "paused"
  | "degraded"
  | "swap-partial"
  | "wallet-reject"
  | "sim-fail"
  | "prize-claimable"
  | "mega-won"
  | "api-down";

export const SCENARIOS: Scenario[] = [
  "empty",
  "funded",
  "pending",
  "confirmed",
  "failed",
  "cap-hit",
  "tvl-full",
  "below-min",
  "paused",
  "degraded",
  "swap-partial",
  "wallet-reject",
  "sim-fail",
  "prize-claimable",
  "mega-won",
  "api-down",
];

export interface Fixture {
  scenario: Scenario;
  apiDown: boolean;
  degraded: boolean;
  paused: boolean;
  balanceSol: number | null; // jpSOL shown as SOL value
  balanceJito: number | null;
  rate: number; // r
  twabShare: number | null; // 0..1
  poolSol: number | null;
  megaSol: number | null;
  nextDrawUtc: string | null;
  walletCapUsedSol: number;
  walletCapSol: number;
  tvlSol: number;
  tvlCapSol: number;
  prizes: { id: string; tier: string; amountSol: number; expires: string }[];
  megaWon: boolean;
}

const BASE: Fixture = {
  scenario: "funded",
  apiDown: false,
  degraded: false,
  paused: false,
  balanceSol: 42.31,
  balanceJito: 36.62,
  rate: 1.1554,
  twabShare: 0.0042,
  poolSol: 118.4,
  megaSol: 3120,
  nextDrawUtc: "2026-07-19T18:00:00Z",
  walletCapUsedSol: 42.31,
  walletCapSol: 500,
  tvlSol: 9870,
  tvlCapSol: 11600,
  prizes: [],
  megaWon: false,
};

export function fixtureFor(s: Scenario): Fixture {
  switch (s) {
    case "empty":
      return { ...BASE, scenario: s, balanceSol: 0, balanceJito: 0, twabShare: 0, walletCapUsedSol: 0 };
    case "api-down":
      return { ...BASE, scenario: s, apiDown: true, balanceSol: null, balanceJito: null, twabShare: null, poolSol: null, megaSol: null, nextDrawUtc: null };
    case "degraded":
      return { ...BASE, scenario: s, degraded: true, paused: true };
    case "paused":
      return { ...BASE, scenario: s, paused: true };
    case "cap-hit":
      return { ...BASE, scenario: s, walletCapUsedSol: 496.2 };
    case "tvl-full":
      return { ...BASE, scenario: s, tvlSol: 11600 };
    case "prize-claimable":
      return {
        ...BASE,
        scenario: s,
        prizes: [
          { id: "p1", tier: "Weekly · 5%", amountSol: 5.92, expires: "2026-10-12" },
          { id: "p2", tier: "Weekly · 1%", amountSol: 1.18, expires: "2026-09-28" },
        ],
      };
    case "mega-won":
      return {
        ...BASE,
        scenario: s,
        megaWon: true,
        prizes: [{ id: "mega", tier: "MEGA VAULT", amountSol: 3120, expires: "2026-10-12" }],
      };
    default:
      return { ...BASE, scenario: s };
  }
}

export function useDevState(): Fixture {
  const params = useSearchParams();
  const s = (params.get("state") as Scenario) || "funded";
  return fixtureFor(SCENARIOS.includes(s) ? s : "funded");
}
