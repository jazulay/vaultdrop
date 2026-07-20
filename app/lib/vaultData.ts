"use client";

/**
 * LIVE DATA CLIENT — one shape, two sources. Screens consume the Fixture
 * shape (lib/devstate.ts); this hook fills it from the Hermes API when
 * NEXT_PUBLIC_API_BASE is set (polled), and from the WS0 harness otherwise.
 * `source` labels which world you're looking at — surfaces stay honest.
 *
 * Contract (API_REQUESTS.md / handoff §7): /stats, /wallet/:addr/position,
 * /caps, /rate, /time, /draws, /wallet/:addr/prizes.
 */

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { API_BASE, DATA_LIVE } from "./config";
import { useDevState, fixtureFor, type Fixture } from "./devstate";

const POLL_MS = 15_000;

export type DataSource = "live" | "fixture";

interface LivePayload {
  stats?: {
    tvl_sol: number;
    tvl_cap_sol?: number;
    mega_balance_sol: number;
    pool_sol?: number;
    next_draw_utc: string;
    paused?: boolean;
    degraded?: boolean;
  };
  rate?: { rate: number };
  caps?: { wallet_cap_sol: number };
  position?: {
    balance_sol: number;
    balance_jito: number;
    twab_share: number;
    wallet_cap_used_sol: number;
  };
  prizes?: { id: string; tier: string; amount_sol: number; expires: string; mega?: boolean }[];
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function toFixture(p: LivePayload, connected: boolean): Fixture {
  const base = fixtureFor("empty");
  const apiDown = !p.stats; // /stats is the liveness signal
  const prizes =
    p.prizes?.map((x) => ({
      id: x.id,
      tier: x.tier,
      amountSol: x.amount_sol,
      expires: x.expires,
    })) ?? [];
  return {
    ...base,
    scenario: "funded",
    apiDown,
    degraded: p.stats?.degraded ?? false,
    paused: p.stats?.paused ?? false,
    balanceSol: connected ? (p.position?.balance_sol ?? null) : 0,
    balanceJito: connected ? (p.position?.balance_jito ?? null) : 0,
    rate: p.rate?.rate ?? base.rate,
    twabShare: connected ? (p.position?.twab_share ?? null) : 0,
    poolSol: p.stats?.pool_sol ?? null,
    megaSol: p.stats?.mega_balance_sol ?? null,
    nextDrawUtc: p.stats?.next_draw_utc ?? null,
    walletCapUsedSol: p.position?.wallet_cap_used_sol ?? 0,
    walletCapSol: p.caps?.wallet_cap_sol ?? base.walletCapSol,
    tvlSol: p.stats?.tvl_sol ?? 0,
    tvlCapSol: p.stats?.tvl_cap_sol ?? base.tvlCapSol,
    prizes,
    megaWon: p.prizes?.some((x) => x.mega) ?? false,
  };
}

/** Live vault data when the API exists; labeled fixtures otherwise. */
export function useVaultData(): { fx: Fixture; source: DataSource } {
  const harness = useDevState();
  const { publicKey, connected } = useWallet();
  const [live, setLive] = useState<Fixture | null>(null);

  useEffect(() => {
    if (!DATA_LIVE) return;
    let stop = false;
    const load = async () => {
      const addr = publicKey?.toBase58();
      const [stats, rate, caps, position, prizes] = await Promise.all([
        fetchJson<LivePayload["stats"]>("/stats"),
        fetchJson<LivePayload["rate"]>("/rate"),
        fetchJson<LivePayload["caps"]>("/caps"),
        addr ? fetchJson<LivePayload["position"]>(`/wallet/${addr}/position`) : Promise.resolve(null),
        addr ? fetchJson<LivePayload["prizes"]>(`/wallet/${addr}/prizes`) : Promise.resolve(null),
      ]);
      if (stop) return;
      setLive(
        toFixture(
          {
            stats: stats ?? undefined,
            rate: rate ?? undefined,
            caps: caps ?? undefined,
            position: position ?? undefined,
            prizes: prizes ?? undefined,
          },
          connected,
        ),
      );
    };
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [publicKey, connected]);

  if (DATA_LIVE) {
    return { fx: live ?? { ...fixtureFor("api-down") }, source: "live" };
  }
  return { fx: harness, source: "fixture" };
}
