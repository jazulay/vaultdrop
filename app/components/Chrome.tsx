"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SCENARIOS } from "@/lib/devstate";
import { Suspense } from "react";

/** Env badge — permanently visible (app prompt §0). Mainnet only at P3 gate. */
export function EnvBadge() {
  return (
    <span className="rounded-md border border-signal/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-signal">
      Devnet
    </span>
  );
}

/** Mandatory pre-launch banner, verbatim per handoff §0. */
export function PrelaunchBanner() {
  return (
    <div className="w-full bg-fail/15 px-4 py-1.5 text-center font-mono text-[11px] tracking-[0.12em] text-fail">
      PRE-LAUNCH — DEVNET / TEST ONLY. NO DEPOSITS.
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
        <span className="font-mono text-xs text-bone/50">7xKX…9fRw</span>
      </div>
      <Suspense>
        <NavInner />
      </Suspense>
    </header>
  );
}

/** WS0 dev harness: scenario switcher. Removed at WS1 (real data replaces fixtures). */
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
  return (
    <Suspense>
      <StateSwitcherInner />
    </Suspense>
  );
}
