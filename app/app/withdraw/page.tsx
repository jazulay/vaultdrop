"use client";

import { Suspense, useState } from "react";
import { useDevState } from "@/lib/devstate";
import { Mono, DegradedBanner, OrreryHud } from "@/components/Bits";

/**
 * C. Withdraw flow — amount/MAX → quote (0% exit fee) → optional Jupiter leg.
 * Copy stays proud: one neutral line, no dark patterns.
 * Degraded pro-rata variant: verbatim banner + labeled pro-rata formula.
 */
function WithdrawInner() {
  const fx = useDevState();
  const [amount, setAmount] = useState("10");
  const [toSol, setToSol] = useState(false);
  const amt = parseFloat(amount) || 0;
  const receives = (amt / fx.rate).toFixed(4);
  const proRataRate = 0.9862; // fixture: post-loss proportional rate

  return (
    <div className="flex flex-col gap-4">
      {fx.degraded && <DegradedBanner />}
      <h1 className="font-display text-3xl font-semibold">Withdraw</h1>

      <section className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-bone/50">Amount</div>
        <div className="mt-3 flex items-center gap-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={fx.apiDown}
            inputMode="decimal"
            className="glass w-40 rounded-xl px-4 py-3 font-mono text-xl text-bone outline-none focus:border-signal/50 disabled:opacity-40"
          />
          <span className="font-mono text-bone/60">SOL-value</span>
          <button
            onClick={() => fx.balanceSol && setAmount(String(fx.balanceSol))}
            className="rounded-full border border-signal/40 px-4 py-1.5 font-mono text-xs text-signal"
          >
            MAX
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm text-bone/90">
          {fx.degraded ? (
            <>
              <p>
                You receive <Mono className="text-bone">{(amt * proRataRate / fx.rate).toFixed(4)}</Mono>{" "}
                JitoSOL — <span className="font-mono text-xs text-fail">PRO-RATA RATE</span>
              </p>
              <p className="font-mono text-[11px] leading-relaxed text-bone/55">
                pro-rata formula: amount × (vault assets ÷ total jpSOL liabilities) ={" "}
                {amt} × {proRataRate} — the same proportional rate for every withdrawal.
              </p>
            </>
          ) : (
            <p>
              You receive <Mono className="text-bone">{receives}</Mono> JitoSOL — 0% exit fee
            </p>
          )}
        </div>

        <label className="mt-4 flex items-center gap-2 font-mono text-xs text-bone/60">
          <input type="checkbox" checked={toSol} onChange={(e) => setToSol(e.target.checked)} />
          Also swap JitoSOL → SOL (Jupiter — second transaction, second signature)
        </label>

        <button
          disabled={fx.apiDown || amt <= 0}
          className="mt-5 w-full rounded-full bg-signal py-3.5 font-medium text-ink transition disabled:cursor-not-allowed disabled:opacity-30"
        >
          {toSol ? "Sign step 1 of 2 — withdraw" : "Sign withdrawal"}
        </button>

        <p className="mt-3 font-mono text-[11px] leading-relaxed text-bone/50">
          Withdrawing ends your entries in future draws. Your prizes already won remain
          claimable.
        </p>
      </section>

      <OrreryHud balanceSol={fx.balanceSol} />
    </div>
  );
}

export default function WithdrawPage() {
  return (
    <Suspense>
      <WithdrawInner />
    </Suspense>
  );
}
