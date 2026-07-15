"use client";

import { Suspense, useState } from "react";
import { useDevState } from "@/lib/devstate";
import { Mono, TxState, DegradedBanner, OrreryHud } from "@/components/Bits";

/**
 * B. Deposit flow — asset in → amount (preflights) → review (verbatim lines)
 * → per-leg signing states. WS0: all states rendered from fixtures.
 */
function DepositInner() {
  const fx = useDevState();
  const [asset, setAsset] = useState<"jitosol" | "sol">("jitosol");
  const [amount, setAmount] = useState("10");

  const amt = parseFloat(amount) || 0;
  const belowMin = fx.scenario === "below-min" || (amt > 0 && amt < 0.1);
  const capHit = fx.scenario === "cap-hit" || amt > fx.walletCapSol - fx.walletCapUsedSol;
  const tvlFull = fx.scenario === "tvl-full" || fx.tvlSol + amt > fx.tvlCapSol;
  const paused = fx.paused;
  const blocked = belowMin || capHit || tvlFull || paused || fx.apiDown;
  const receives = (amt / fx.rate).toFixed(4);

  return (
    <div className="flex flex-col gap-4">
      {fx.degraded && <DegradedBanner />}
      <h1 className="font-display text-3xl font-semibold">Deposit</h1>

      {/* 1 — asset in */}
      <section className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-bone/50">1 · Asset in</div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setAsset("jitosol")}
            className={`rounded-full px-5 py-2 text-sm ${asset === "jitosol" ? "bg-steel text-bone" : "border border-bone/20 text-bone/60"}`}
          >
            JitoSOL — direct
          </button>
          <button
            onClick={() => setAsset("sol")}
            className={`rounded-full px-5 py-2 text-sm ${asset === "sol" ? "bg-steel text-bone" : "border border-bone/20 text-bone/60"}`}
          >
            SOL — via Jupiter swap
          </button>
        </div>
        {asset === "sol" && (
          <div className="mt-3 rounded-xl border border-bone/15 p-3 font-mono text-xs leading-relaxed text-bone/70">
            Route: SOL → JitoSOL (Jupiter) · slippage 0.3% · quote expires in 28s
            <br />
            Two transactions, two explicit steps — the swap and the deposit each
            get their own signature.
          </div>
        )}
      </section>

      {/* 2 — amount + preflights */}
      <section className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-bone/50">2 · Amount</div>
        <div className="mt-3 flex items-center gap-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={fx.apiDown}
            inputMode="decimal"
            className="glass w-40 rounded-xl px-4 py-3 font-mono text-xl text-bone outline-none focus:border-gold/50 disabled:opacity-40"
          />
          <span className="font-mono text-bone/60">{asset === "sol" ? "SOL" : "JitoSOL"}</span>
        </div>
        <div className="mt-3 space-y-1 font-mono text-[11px] text-bone/50">
          <div>min 0.1 SOL-value</div>
          <div>
            wallet cap: <Mono>{fx.walletCapUsedSol}</Mono> of <Mono>{fx.walletCapSol}</Mono> SOL-value used
          </div>
          <div>
            vault headroom: <Mono>{fx.tvlSol.toLocaleString()}</Mono> of{" "}
            <Mono>{fx.tvlCapSol.toLocaleString()}</Mono> SOL cap
          </div>
        </div>
        {belowMin && (
          <p className="mt-2 font-mono text-xs text-fail">Minimum deposit is 0.1 SOL-value.</p>
        )}
        {capHit && !belowMin && (
          <p className="mt-2 font-mono text-xs text-fail">
            This exceeds your per-wallet cap ({(fx.walletCapSol - fx.walletCapUsedSol).toFixed(1)}{" "}
            SOL-value remaining).
          </p>
        )}
        {tvlFull && !capHit && !belowMin && (
          <p className="mt-2 font-mono text-xs text-fail">
            The vault is at its TVL cap right now. Deposits reopen as headroom frees up.
          </p>
        )}
        {paused && (
          <p className="mt-2 font-mono text-xs text-fail">
            Deposits are paused{fx.degraded ? " while the vault is in pro-rata mode" : ""}.
          </p>
        )}
        {fx.apiDown && (
          <p className="mt-2 font-mono text-xs text-bone/50">
            Live data unavailable — money inputs are disabled.
          </p>
        )}
      </section>

      {/* 3 — review: verbatim lines */}
      <section className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-bone/50">3 · Review</div>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-bone/90">
          <p>
            You receive <Mono className="text-bone">{receives}</Mono> jpSOL — a SOL-value share,
            redeemable anytime.
          </p>
          <p>All yield funds prizes: 70% weekly draws · 15% Mega Vault · 15% protocol.</p>
          <p>Your principal cannot fund prizes — the program can only move yield.</p>
        </div>
        <div className="mt-2 font-mono text-[11px] text-bone/45">
          r = {fx.rate} — restated at review; if r changes before send, the quote is re-simulated
          and re-presented.
        </div>
        <button
          disabled={blocked || amt <= 0}
          className="mt-4 w-full rounded-full bg-gold py-3.5 font-medium text-ink transition disabled:cursor-not-allowed disabled:opacity-30"
        >
          {asset === "sol" ? "Sign step 1 of 2 — swap" : "Sign deposit"}
        </button>
      </section>

      {/* Post-confirm / per-leg states, scenario-driven */}
      {fx.scenario === "pending" && (
        <section className="glass rounded-2xl p-5"><TxState phase="pending" /></section>
      )}
      {fx.scenario === "confirmed" && (
        <section className="glass rounded-2xl p-5">
          <TxState phase="confirmed" />
          <p className="mt-2 font-mono text-xs text-bone/55">
            Balance updated from API. Your orb is in orbit.
          </p>
        </section>
      )}
      {fx.scenario === "failed" && (
        <section className="glass rounded-2xl p-5"><TxState phase="failed" /></section>
      )}
      {fx.scenario === "wallet-reject" && (
        <section className="glass rounded-2xl p-5">
          <TxState phase="failed" error="request rejected in wallet — nothing was sent" />
        </section>
      )}
      {fx.scenario === "sim-fail" && (
        <section className="glass rounded-2xl p-5">
          <TxState
            phase="failed"
            error="simulation failed before send: custom program error 0x1775: DepositsPaused"
          />
        </section>
      )}
      {fx.scenario === "swap-partial" && (
        <section className="glass rounded-2xl p-5">
          <TxState phase="confirmed" />
          <div className="mt-2 font-mono text-sm text-bone/80">
            swap succeeded, deposit pending — your JitoSOL is in your wallet, resume anytime
          </div>
          <button className="mt-3 rounded-full border border-signal/50 px-6 py-2.5 text-sm text-signal">
            Resume deposit — sign step 2 of 2
          </button>
        </section>
      )}

      <OrreryHud balanceSol={fx.balanceSol} />
    </div>
  );
}

export default function DepositPage() {
  return (
    <Suspense>
      <DepositInner />
    </Suspense>
  );
}
