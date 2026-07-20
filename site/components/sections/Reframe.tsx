"use client";

import VideoLoop from "@/components/VideoLoop";
import { PARAMS } from "@/lib/calc";
import { useSolPrice, fmtUsd } from "@/lib/price";

/**
 * REFRAME (audit §6.2, new) — names the enemy: yield you can't feel.
 * Sits directly after the hero, filling the former dead scroll zone (P0-3 ③).
 *
 * Pass 5 §3.5: the headline is RECONCILED with the live price — it derives
 * from the same PARAMS × Pyth feed as the panel beneath it, so the page can
 * never contradict itself about its own most important argument. Feed down →
 * the no-dollar phrasing (never a stale figure).
 */

/** The worked example the section speaks in — the calculator's default. */
const EXAMPLE_SOL = 25;

export default function Reframe() {
  const price = useSolPrice();
  const apyPct = (PARAMS.stakingApy * 100).toFixed(0);
  const dailySol = (EXAMPLE_SOL * PARAMS.stakingApy) / 365;
  const dailyUsd = price.usd !== null ? dailySol * price.usd : null;

  return (
    /* Pass 6 #7: shorter top padding — the hero's chapter card hands off to
       this section's eyebrow, so the gap must read as one beat, not a trench. */
    <section className="relative bg-ink pb-24 pt-14 sm:pb-32 sm:pt-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone/60">
          The problem with {apyPct}%
        </div>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          {dailyUsd !== null ? (
            <>
              Staking {EXAMPLE_SOL} SOL pays you about {fmtUsd(dailyUsd)} a day.
              Feel anything?
            </>
          ) : (
            <>Staking pays you cents a day. Feel anything?</>
          )}
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone/75">
          Seven percent a year is good math and terrible television. VaultDrop
          routes the same yield you already earn into something with a pulse:
          every week, your balance is a stack of tickets in a draw you can
          verify. Win, and it&apos;s real SOL in your wallet. Don&apos;t, and
          you&apos;ve lost exactly nothing — your deposit never left your reach.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {/* LEFT — dim, quiet */}
          <figure className="relative overflow-hidden rounded-2xl border border-bone/10">
            <div className="relative aspect-[16/10]">
              <VideoLoop
                name="vaultdrop-reframe-drip-loop"
                className="absolute inset-0 opacity-80 saturate-50 max-md:origin-bottom max-md:scale-[1.5]"
                alt="A single grey droplet falling into black stillness — yield as a silent drip"
              />
              <div className="absolute inset-0 bg-ink/30" />
              {/* Audit pass 2 NF-6: at narrow widths the clip's crop exposes
                  domestic shapes above the droplet — sink them into ink. */}
              <div className="absolute inset-x-0 top-0 h-[72%] bg-gradient-to-b from-ink from-30% via-ink/80 via-60% to-transparent md:hidden" />
            </div>
            <figcaption className="space-y-1.5 p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-bone/55">
                Staking
              </div>
              <div className="font-mono text-lg text-bone/60 tabular-nums">
                {EXAMPLE_SOL} SOL → +
                {dailySol.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL
                {dailyUsd !== null && <> ({fmtUsd(dailyUsd)})</>}{" "}
                · every day · forever
              </div>
              <div className="text-sm italic text-bone/55">certain. silent.</div>
            </figcaption>
          </figure>

          {/* RIGHT — gold, alive */}
          <figure className="relative overflow-hidden rounded-2xl border border-gold/30">
            <div className="relative aspect-[16/10]">
              <VideoLoop
                name="vaultdrop-reframe-constellation-loop"
                className="absolute inset-0"
                alt="Dozens of glowing glass orbs streaming along gold rings toward a golden core — yield becoming tickets"
              />
            </div>
            <figcaption className="space-y-1.5 p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold/80">
                VaultDrop
              </div>
              <div className="font-mono text-lg text-gold">
                52 draws a year + one rolling Mega Vault
              </div>
              <div className="text-sm italic text-bone/60">same yield. different physics.</div>
            </figcaption>
          </figure>
        </div>

        <a
          href="#calculator"
          className="link-quiet mt-8 inline-block text-lg text-bone/80"
        >
          See your odds →
        </a>
      </div>
    </section>
  );
}
