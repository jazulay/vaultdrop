"use client";

import useSWR from "swr";

/**
 * Read-only contract with the Hermes API (VAULTDROP_FABLE_SITE_PROMPT §7).
 * Endpoints: /stats, /draws, /winners/:epoch, /health
 *
 * Data states, in claims-discipline order:
 *  - "live"        — API reachable, real numbers. Render them.
 *  - "prelaunch"   — no API base configured yet (Hermes not deployed).
 *                    Render the mandatory verbatim pre-launch states.
 *  - "unavailable" — API base configured but unreachable/erroring.
 *                    Render "—" with a "live data unavailable" tooltip.
 *                    NEVER a cached number presented as current. NEVER a fake.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? null;

/** First-draw / vault-open date. Supplied by Joseph; TBA until then (STUBS.md #3). */
export const FIRST_DRAW_DATE: string | null =
  process.env.NEXT_PUBLIC_FIRST_DRAW_DATE ?? null;

export type DataState = "live" | "prelaunch" | "unavailable";

export interface Stats {
  tvl_sol: number;
  mega_balance_sol: number;
  next_draw_utc: string;
}

export interface Draw {
  epoch: number;
  pool_sol: number;
  winners_count: number;
  vrf_proof_url: string;
  settle_tx_url: string;
  settled_utc: string;
}

async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export function useStats(): { state: DataState; stats: Stats | null } {
  const { data, error } = useSWR<Stats>(
    API_BASE ? "/stats" : null,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false },
  );
  if (!API_BASE) return { state: "prelaunch", stats: null };
  if (error) return { state: "unavailable", stats: null };
  if (!data) return { state: "unavailable", stats: null };
  return { state: "live", stats: data };
}

export function useDraws(): { state: DataState; draws: Draw[] | null } {
  const { data, error } = useSWR<Draw[]>(
    API_BASE ? "/draws" : null,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false },
  );
  if (!API_BASE) return { state: "prelaunch", draws: null };
  if (error) return { state: "unavailable", draws: null };
  if (!data) return { state: "unavailable", draws: null };
  return { state: "live", draws: data };
}

/* Mandatory verbatim pre-launch strings (§7) */
export const PRELAUNCH = {
  mega: (date: string | null) => `SEEDING — first draw ${date ?? "TBA"}`,
  tvl: (date: string | null) => `Vault opens ${date ?? "TBA"}`,
  draws:
    "Draw history will appear here after epoch 1. Every draw ships with its proof.",
} as const;

export const UNAVAILABLE_TOOLTIP = "live data unavailable";
