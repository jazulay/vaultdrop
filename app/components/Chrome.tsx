"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SCENARIOS } from "@/lib/devstate";
import { CLUSTER, DATA_LIVE, LIVE, TX_READY } from "@/lib/config";
import { WalletButton } from "@/components/Wallet";
import { Suspense } from "react";

/** Env badge — derives from runtime config; disappears only when truly live. */
export function EnvBadge() {
  if (LIVE) return null;
  return (
    <span className="rounded-md border border-signal/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-signal">
      {CLUSTER === "mainnet-beta" ? "Mainnet · pre-launch" : "Devnet"}
    </span>
  );
}

/**
 * Test-only banner — derives from config, not code: the moment the cluster is
 * mainnet and the program + API exist (env), this renders nothing and the
 * build IS the live product. Until then it tells the exact truth about which
 * pieces are live.
 */
export function PrelaunchBanner() {
  if (LIVE) return null;
  const missing = [
    !TX_READY && "program",
    !DATA_LIVE && "live data",
    CLUSTER !== "mainnet-beta" && "mainnet",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="w-full bg-fail/15 px-4 py-1.5 text-center font-mono text-[11px] tracking-[0.12em] text-fail">
      TEST BUILD — NO REAL DEPOSITS YET. Wallet connect is live; pending: {missing}.
    </div>
  );
}

const NAV = [
  { href: "/", label: "Vault" },
  { href: "/deposit", label: "Deposit" },
  { href: "/withdraw", label: "Withdraw" },
  { href: "/prizes", label: "Prizes" },
  { href: "/draws", label: "Draws" },
  { href: "/transfer", label: "Transfer" },
];

function NavInner() {
  const pathname = usePathname();
  const params = useSearchParams();
  const state = params.get("state");
  const qs = state ? `?state=${state}` : "";
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={`${n.href}${qs}`}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
            pathname === n.href
              ? "bg-steel text-bone"
              : "text-bone/60 hover:text-bone"
          }`}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pb-2 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-semibold tracking-tight">VaultDrop</span>
          <EnvBadge />
        </div>
        {/* Real wallet connection — replaces the WS0 hardcoded chip. */}
        <WalletButton />
      </div>
      <Suspense>
        <NavInner />
      </Suspense>
    </header>
  );
}

/** Dev harness: scenario switcher — hidden automatically once live data exists. */
function StateSwitcherInner() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("state") || "funded";
  return (
    <details className="fixed bottom-3 left-3 z-50 max-w-[220px]">
      <summary className="glass cursor-pointer rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-bone/60">
        WS0 state: {current}
      </summary>
      <div className="glass mt-1 flex max-h-72 flex-col overflow-y-auto rounded-lg p-1">
        {SCENARIOS.map((s) => (
          <a
            key={s}
            href={`${pathname}?state=${s}`}
            className={`rounded px-2 py-1 font-mono text-[11px] ${
              s === current ? "bg-gold/20 text-gold" : "text-bone/70 hover:bg-steel"
            }`}
          >
            {s}
          </a>
        ))}
      </div>
    </details>
  );
}

export function StateSwitcher() {
  if (DATA_LIVE) return null; // real data replaces the harness, automatically
  return (
    <Suspense>
      <StateSwitcherInner />
    </Suspense>
  );
}
