"use client";

/**
 * Live SOL/USD via Pyth (pass 5 §3.5) — Solana-native, on-brand for a protocol
 * whose entire pitch is proofs. Served by Pyth's public price API at
 * hermes.pyth.network (Pyth's own hosted service, no relation to our Hermes
 * agent). Feed id is the canonical Crypto.SOL/USD feed from pyth.network/feeds.
 *
 * HONESTY RAIL: a wrong dollar figure is a lie with a decimal point. On feed
 * failure or staleness the hook returns usd:null and every dollar surface
 * HIDES rather than showing a stale number. All dollar figures on the page
 * derive from PARAMS × this one price — single source of truth, still.
 */

import { useSyncExternalStore } from "react";

const SOL_USD_FEED =
  "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
const ENDPOINT = `https://hermes.pyth.network/v2/updates/price/latest?parsed=true&ids[]=0x${SOL_USD_FEED}`;

const POLL_MS = 60_000;
/** Beyond this, a cached price is stale — hide dollars rather than lie. */
const MAX_AGE_MS = 10 * 60_000;

export interface SolPrice {
  /** USD per SOL, or null when the feed is down/stale (dollars hidden). */
  usd: number | null;
  /** Publish time of the price, for the `live · 14:32 UTC` label. */
  publishMs: number | null;
}

let state: SolPrice = { usd: null, publishMs: null };
const listeners = new Set<() => void>();
let started = false;

function emit(next: SolPrice) {
  state = next;
  listeners.forEach((l) => l());
}

async function poll() {
  try {
    const res = await fetch(ENDPOINT, { cache: "no-store" });
    if (!res.ok) throw new Error(`pyth ${res.status}`);
    const body = await res.json();
    const p = body?.parsed?.[0]?.price;
    const usd = Number(p?.price) * Math.pow(10, Number(p?.expo));
    const publishMs = Number(p?.publish_time) * 1000;
    if (!isFinite(usd) || usd <= 0 || !isFinite(publishMs)) throw new Error("pyth shape");
    if (Date.now() - publishMs > MAX_AGE_MS) throw new Error("pyth stale");
    emit({ usd, publishMs });
  } catch {
    // Feed down: expire the cache rather than serve it stale.
    if (state.publishMs !== null && Date.now() - state.publishMs > MAX_AGE_MS) {
      emit({ usd: null, publishMs: null });
    }
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  poll();
  window.setInterval(poll, POLL_MS);
}

const getSnapshot = () => state;
const serverSnapshot: SolPrice = { usd: null, publishMs: null };
const getServerSnapshot = () => serverSnapshot;
const subscribe = (l: () => void) => {
  start();
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSolPrice(): SolPrice {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** `14:32 UTC` from a publish timestamp. */
export function priceTimeUtc(publishMs: number): string {
  const d = new Date(publishMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/** Dollar formatter — whole dollars above $10, cents below. */
export function fmtUsd(n: number): string {
  const opts =
    Math.abs(n) >= 10
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `$${n.toLocaleString("en-US", opts)}`;
}
