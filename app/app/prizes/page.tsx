"use client";

import { Suspense } from "react";
import { useDevState } from "@/lib/devstate";
import { Drum, DegradedBanner, OrreryHud } from "@/components/Bits";

/**
 * D. Prizes — claimable list (gold), expiry per spec, claim tx per prize.
 * The won-Mega state is composed to be screenshot itself across crypto Twitter.
 */
function PrizesInner() {
  const fx = useDevState();

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
            <button className="mt-6 rounded-full bg-gold px-10 py-3.5 font-medium text-ink">
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
                <button className="shrink-0 rounded-full border border-gold/50 px-5 py-2 text-sm text-gold">
                  Claim
                </button>
              </li>
            ))}
          </ul>
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
