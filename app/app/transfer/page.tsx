"use client";

import { Suspense, useState } from "react";
import { useDevState } from "@/lib/devstate";
import { OrreryHud } from "@/components/Bits";

/**
 * F. Transfer — jpSOL moves only via the program's transfer_with_twab in v1.
 */
function TransferInner() {
  const fx = useDevState();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Transfer</h1>

      <section className="glass rounded-2xl p-5">
        <label className="text-[11px] uppercase tracking-[0.2em] text-bone/50">Recipient</label>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="wallet address"
          className="glass mt-2 w-full rounded-xl px-4 py-3 font-mono text-sm text-bone outline-none placeholder:text-bone/30 focus:border-gold/50"
        />
        <label className="mt-4 block text-[11px] uppercase tracking-[0.2em] text-bone/50">
          Amount
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.0"
            className="glass w-40 rounded-xl px-4 py-3 font-mono text-xl text-bone outline-none placeholder:text-bone/30 focus:border-gold/50"
          />
          <span className="font-mono text-bone/60">jpSOL</span>
        </div>

        <button
          disabled={!to || !amount || fx.apiDown}
          className="mt-5 w-full rounded-full bg-steel py-3.5 font-medium text-bone transition disabled:cursor-not-allowed disabled:opacity-30"
        >
          Sign transfer
        </button>

        <p className="mt-3 font-mono text-[11px] leading-relaxed text-bone/50">
          Transfers go through the vault program so draw weights stay exact.
          Wallet-to-wallet jpSOL transfers arrive after the v2 upgrade.
        </p>
      </section>

      <OrreryHud balanceSol={fx.balanceSol} />
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense>
      <TransferInner />
    </Suspense>
  );
}
