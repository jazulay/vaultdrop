/**
 * DAY-ONE RUNTIME CONFIG (2026-07-20 pivot: no waitlist — the app ships
 * launch-ready and flips live via env, not code changes).
 *
 * Readiness model:
 * - Wallet connect: ALWAYS real (wallet-adapter, no env needed).
 * - Data: live API when NEXT_PUBLIC_API_BASE is set; otherwise the WS0
 *   fixture harness renders, clearly labeled.
 * - Transactions: fully wired signing machinery (lib/tx.ts); instruction
 *   encoding activates when NEXT_PUBLIC_VAULT_PROGRAM_ID + the IDL land
 *   (BLOCKER.md — the launch-gating list owned by Hermes).
 * - The TEST-ONLY banner and cluster badge derive from this file: when the
 *   cluster is mainnet-beta AND program + API are set, the banner is gone and
 *   the build is the live product. Same code, day one.
 */

export type Cluster = "devnet" | "mainnet-beta";

export const CLUSTER: Cluster =
  process.env.NEXT_PUBLIC_CLUSTER === "mainnet-beta" ? "mainnet-beta" : "devnet";

/** Custom RPC (recommended for launch); falls back to public cluster RPC. */
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || null;

/** Hermes API base — live data switches on when this exists. */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || null;

/** Vault program id — transaction building switches on when this exists. */
export const VAULT_PROGRAM_ID = process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID || null;

export const DATA_LIVE = API_BASE !== null;
export const TX_READY = VAULT_PROGRAM_ID !== null;

/** The day-one condition: mainnet + program + API ⇒ no banner, real money. */
export const LIVE = CLUSTER === "mainnet-beta" && DATA_LIVE && TX_READY;

export function explorerTx(sig: string): string {
  const suffix = CLUSTER === "mainnet-beta" ? "" : `?cluster=${CLUSTER}`;
  return `https://solscan.io/tx/${sig}${suffix}`;
}
