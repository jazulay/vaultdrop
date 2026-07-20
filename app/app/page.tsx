"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useVaultData } from "@/lib/vaultData";
import { Drum, Dash, Mono, DegradedBanner, OrreryHud } from "@/components/Bits";

function Countdown({ target }: { target: string | null }) {
  // WS0 fixture: static render of the server-time countdown slot.
  if (!target) return <Dash />;
  return <Mono className="text-bone">4d 06:12:44</Mono>;
}

function HomeInner() {
  const { fx } = useVaultData();
  const empty = fx.balanceSol === 0;

  return (
    <div className="flex flex-col gap-4">
      {fx.degraded && <DegradedBanner />}

      {/* Balance */}
      <section className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-bone/50">My balance</div>
        {fx.balanceSol === null ? (
          <div className="mt-2 text-4xl"><Dash /></div>
        ) : empty ? (
          <div className="mt-3">
            <p className="max-w-sm text-lg leading-snug text-bone/90">
              Deposit SOL. Your balance becomes weekly draw entries.
              Withdraw everything, anytime — principal never plays.
            </p>
            <Link
              href="/deposit"
              className="mt-4 inline-block rounded-full bg-gold px-7 py-3 font-medium text-ink"
            >
              Deposit
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-1 font-display text-5xl font-semibold text-bone">
              <Drum value={fx.balanceSol.toLocaleString("en-US", { minimumFractionDigits: 2 })} />
              <span className="ml-2 text-2xl text-bone/60">SOL</span>
            </div>
            <div className="mt-1 font-mono text-xs text-bone/50">
              = {fx.balanceJito?.toLocaleString("en-US", { minimumFractionDigits: 2 })} JitoSOL at r ={" "}
              {fx.rate}
            </div>
          </>
        )}
      </section>

      {/* This week's draw */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] uppercase tracking-[0.2em] text-bone/50">
            This week&apos;s draw
          </div>
          <Countdown target={fx.nextDrawUtc} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-bone/40">Prize pool</div>
            <div className="mt-0.5 font-mono text-xl text-bone">
              {fx.poolSol === null ? <Dash /> : `${fx.poolSol} SOL`}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-bone/40">My odds share</div>
            <div className="mt-0.5 font-mono text-xl text-bone">
              {fx.twabShare === null ? (
                <Dash />
              ) : (
                `${(fx.twabShare * 100).toFixed(2)}%`
              )}
            </div>
            {fx.twabShare !== null && fx.twabShare > 0 && (
              <div className="mt-0.5 font-mono text-[10px] text-bone/45">
                ESTIMATE — final at Sunday 18:00 UTC snapshot
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mega Vault */}
      <section className="glass rounded-2xl border-gold/25 p-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-gold/80">Mega Vault</div>
        <div className="mt-1 font-display text-4xl font-semibold text-gold">
          {fx.megaSol === null ? (
            <Dash />
          ) : (
            <>
              <Drum value={fx.megaSol.toLocaleString("en-US")} />
              <span className="ml-2 text-xl text-gold/60">SOL</span>
            </>
          )}
        </div>
        <div className="mt-2 font-mono text-xs text-bone/55">
          1-in-26 each week · rolls until it hits
        </div>
      </section>

      <OrreryHud balanceSol={fx.balanceSol} flare={fx.megaWon} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
