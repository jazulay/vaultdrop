"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStats } from "@/lib/api";
import { LAUNCHED, EPOCH1_UTC } from "@/lib/launch";
import { nextSunday18UTC } from "@/lib/format";
import Odometer from "@/components/Odometer";
import Countdown from "@/components/Countdown";
import VideoLoop from "@/components/VideoLoop";

gsap.registerPlugin(ScrollTrigger);

/**
 * S3 — THE MEGA VAULT. Status lives in a small chip (audit P2-14); the
 * headline slot carries the live pot number or the promise.
 */
export default function S3Mega() {
  const ref = useRef<HTMLElement>(null);
  const { state, stats } = useStats();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const inner = el.querySelector(".mega-inner");
      gsap.fromTo(
        inner,
        { opacity: 0.3, scale: 0.96 },
        {
          opacity: 1,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "+=60%",
            scrub: true,
            pin: true,
          },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  const live = state === "live" && stats;
  const megaValue = live
    ? stats.mega_balance_sol.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : null;
  const countdownTarget = live
    ? stats.next_draw_utc
    : LAUNCHED
      ? nextSunday18UTC(new Date()).toISOString()
      : EPOCH1_UTC;

  return (
    <section id="mega" ref={ref} className="relative min-h-screen overflow-hidden">
      <VideoLoop
        name="vaultdrop-megavault-sun-loop"
        className="vignette absolute inset-0"
        alt="Molten gold sphere flaring — the Mega Vault jackpot growing"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/50 to-transparent" />

      <div className="mega-inner relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-24">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.35em] text-gold">The Mega Vault</span>
          <span className="rounded-md border border-gold/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-gold/90">
            {LAUNCHED ? "Live" : "Seeding · epoch 1 soon"}
          </span>
        </div>

        <div className="mt-6 font-display font-semibold tracking-tight text-gold">
          {megaValue ? (
            <span className="text-6xl sm:text-8xl lg:text-9xl">
              <Odometer value={megaValue} className="tabular-nums" />
              <span className="ml-4 text-3xl text-gold/70 sm:text-5xl">SOL</span>
            </span>
          ) : (
            <span className="block max-w-3xl text-4xl leading-tight sm:text-6xl lg:text-7xl">
              It grows until someone takes it.
            </span>
          )}
        </div>

        <p className="mt-8 max-w-xl text-xl leading-snug text-bone/90 sm:text-2xl">
          Every week it doesn&apos;t hit, it grows.
        </p>
        <p className="mt-3 max-w-xl text-base text-bone/65">
          1-in-26 every Sunday. Misses roll over. On average it lands about
          twice a year.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <span className="text-[11px] uppercase tracking-[0.25em] text-bone/50">
            {LAUNCHED ? "Next draw · Sunday 18:00 UTC" : "Epoch 1 opens"}
          </span>
          <Countdown
            targetUtc={countdownTarget}
            fallback="date announced to the waitlist first"
            className="text-lg text-bone"
          />
        </div>
      </div>
    </section>
  );
}
