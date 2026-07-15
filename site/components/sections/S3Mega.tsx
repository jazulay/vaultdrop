"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStats, PRELAUNCH, FIRST_DRAW_DATE } from "@/lib/api";
import LiveSlot from "@/components/LiveSlot";
import Countdown from "@/components/Countdown";
import VideoLoop from "@/components/VideoLoop";

gsap.registerPlugin(ScrollTrigger);

/**
 * S3 — THE MEGA VAULT. Full-bleed gold-on-ink poster scene, pinned while the
 * odometer and rule line reveal. This is the screenshot people share.
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

  const megaValue =
    state === "live" && stats
      ? stats.mega_balance_sol.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : null;

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      <VideoLoop name="vaultdrop-megavault-sun-loop" className="vignette absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/50 to-transparent" />

      <div className="mega-inner relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-24">
        <div className="text-xs uppercase tracking-[0.35em] text-gold">The Mega Vault</div>

        <div className="mt-6 font-display text-6xl font-semibold tracking-tight text-gold sm:text-8xl lg:text-9xl">
          <LiveSlot
            state={state}
            value={megaValue}
            prelaunchText={PRELAUNCH.mega(FIRST_DRAW_DATE)}
            odometer
            className="tabular-nums"
            prelaunchClassName="block max-w-3xl text-3xl leading-tight sm:text-5xl lg:text-6xl"
          />
          {state === "live" && <span className="ml-4 text-3xl text-gold/70 sm:text-5xl">SOL</span>}
        </div>

        <p className="mt-8 max-w-xl text-xl leading-snug text-bone/90 sm:text-2xl">
          Every week it doesn&apos;t hit, it grows.
        </p>
        <p className="mt-3 font-mono text-sm text-bone/60">
          1-in-26 each week · rolls until it hits
        </p>

        <div className="mt-12 inline-flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-[0.25em] text-bone/50">
            Next draw · Sunday 18:00 UTC
          </span>
          <Countdown
            targetUtc={state === "live" && stats ? stats.next_draw_utc : null}
            fallback={state === "prelaunch" ? "First draw TBA" : "—"}
            className="text-lg text-bone"
          />
        </div>
      </div>
    </section>
  );
}
