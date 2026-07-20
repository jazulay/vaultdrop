"use client";

import { Suspense, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useVaultData } from "@/lib/vaultData";
import { runTx, buildClaimIx, type TxLifecycle } from "@/lib/tx";
import { Drum, TxState, DegradedBanner, OrreryHud } from "@/components/Bits";
import { ConnectGate } from "@/components/Wallet";

/**
 * D. Prizes — claimable list (gold), expiry per spec, claim tx per prize.
 * The won-Mega state is composed to be screenshot itself across crypto Twitter.
 */
function PrizesInner() {
  const { fx } = useVaultData();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [life, setLife] = useState<TxLifecycle>({ phase: "idle" });
  const [claiming, setClaiming] = useState<string | null>(null);

  const claim = (prizeId: string) => {
    setClaiming(prizeId);
    return runTx({
      connection,
      wallet,
      build: () => [buildClaimIx(wallet.publicKey!, prizeId)],
      onPhase: setLife,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {fx.degraded && <DegradedBanner />}
      <h1 className="font-display text-3xl font-semibold">Prizes</h1>

      {fx.megaWon && (
        <section className="relative overflow-hidden rounded-2xl border border-gold/60 p-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/higgsfield/poster/vaultdrop-hero-orrery-loop-sm.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
          <div className="relative">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-gold">
              The Mega Vault hit
            </div>
            <div className="mt-3 font-display text-6xl font-semibold text-gold">
              <Drum value={(fx.prizes[0]?.amountSol ?? 0).toLocaleString("en-US")} />
              <span className="ml-2 text-3xl text-gold/70">SOL</span>
            </div>
            <div className="mt-3 font-mono text-xs text-bone/70">
              your orb ignited · epoch 12 · proof on-chain
            </div>
            <button
              onClick={() => claim("mega")}
              className="mt-6 rounded-full bg-gold px-10 py-3.5 font-medium text-ink"
            >
              Claim the Mega Vault
            </button>
          </div>
        </section>
      )}

      <section className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-bone/50">Claimable</div>
        {fx.prizes.length === 0 ? (
          <p className="mt-3 text-sm text-bone/60">
            No unclaimed prizes. Winners appear here after each Sunday draw.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-bone/10">
            {fx.prizes.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-mono text-lg text-gold">{p.amountSol} SOL</div>
                  <div className="font-mono text-[11px] text-bone/50">
                    {p.tier} · expires {p.expires} — 90 days from draw; unclaimed prizes roll
                    into the Mega Vault
                  </div>
                </div>
                <button
                  onClick={() => claim(p.id)}
                  disabled={!wallet.connected}
                  className="shrink-0 rounded-full border border-gold/50 px-5 py-2 text-sm text-gold disabled:opacity-40"
                >
                  Claim
                </button>
              </li>
            ))}
          </ul>
        )}
        {!wallet.connected && fx.prizes.length > 0 && (
          <div className="mt-3">
            <ConnectGate action="claim your prizes" />
          </div>
        )}
        {claiming && life.phase === "program-pending" && (
          <p className="mt-3 font-mono text-xs leading-relaxed text-gold">
            TRANSACTION-READY · PROGRAM PENDING — signing works; the vault
            program isn&apos;t deployed yet. Nothing was sent.
          </p>
        )}
        {claiming && life.phase === "pending" && (
          <div className="mt-3">
            <TxState phase="pending" sig={`${life.sig.slice(0, 4)}…${life.sig.slice(-4)}`} />
          </div>
        )}
        {claiming && life.phase === "confirmed" && (
          <div className="mt-3">
            <TxState phase="prize" />
          </div>
        )}
        {claiming && (life.phase === "failed" || life.phase === "sim-fail") && (
          <div className="mt-3">
            <TxState phase="failed" error={life.error} />
          </div>
        )}
        {claiming && life.phase === "wallet-reject" && (
          <div className="mt-3">
            <TxState phase="failed" error="request rejected in wallet — nothing was sent" />
          </div>
        )}
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-bone/50">History</div>
        <p className="mt-3 font-mono text-sm text-bone/55">
          Claim history will list each prize with its draw link and claim signature.
        </p>
      </section>

      <OrreryHud balanceSol={fx.balanceSol} flare={fx.megaWon} />
    </div>
  );
}

export default function PrizesPage() {
  return (
    <Suspense>
      <PrizesInner />
    </Suspense>
  );
}
