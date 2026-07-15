"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStats, PRELAUNCH, FIRST_DRAW_DATE } from "@/lib/api";
import { formatSol } from "@/lib/format";
import LiveSlot from "@/components/LiveSlot";
import Countdown from "@/components/Countdown";

gsap.registerPlugin(ScrollTrigger);

/**
 * S1 — THE ORRERY.
 * A 220vh section. The hero video sits in a sticky 100vh frame; scrolling
 * scrubs it down to a corner-HUD-sized card (and decelerates playback).
 * When the section releases, a fixed HUD takes over at the same coordinates
 * and carries the Mega Vault number through the rest of the page.
 */
export default function HeroOrrery() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);
  const [reduced, setReduced] = useState(false);
  const { state, stats } = useStats();

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(rm);
    if (rm) {
      // Static layout: no scrub; HUD appears once the hero scrolls out.
      const io = new IntersectionObserver(
        (entries) => setDocked(!entries.some((e) => e.isIntersecting)),
        { threshold: 0 },
      );
      if (sectionRef.current) io.observe(sectionRef.current);
      return () => io.disconnect();
    }

    const section = sectionRef.current;
    const frame = frameRef.current;
    if (!section || !frame) return;

    const ctx = gsap.context(() => {
      // HUD geometry: 200x120 card, 24px from bottom-right.
      const hudW = 200;
      const hudH = 120;
      const pad = 24;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (st) => {
            // the orrery visibly decelerates as you begin scrolling
            if (videoRef.current) {
              videoRef.current.playbackRate = Math.max(0.25, 1 - st.progress * 0.75);
            }
            setDocked(st.progress > 0.98);
          },
        },
      });

      tl.to(copyRef.current, { opacity: 0, y: -40, duration: 0.25, ease: "none" }, 0);
      tl.to(
        frame,
        {
          width: () => hudW,
          height: () => hudH,
          top: () => window.innerHeight - hudH - pad,
          left: () => window.innerWidth - hudW - pad,
          borderRadius: 12,
          duration: 0.75,
          ease: "none",
        },
        0.25,
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const megaValue =
    state === "live" && stats ? `${formatSol(stats.mega_balance_sol)} SOL` : null;
  const tvlValue =
    state === "live" && stats ? `${formatSol(stats.tvl_sol)} SOL` : null;
  const nextDraw = state === "live" && stats ? stats.next_draw_utc : null;

  return (
    <>
      <section ref={sectionRef} className={reduced ? "relative h-screen" : "relative h-[220vh]"}>
        <div className="sticky top-0 h-screen">
          {/* the video frame that shrinks to the corner */}
          <div
            ref={frameRef}
            className="vignette absolute inset-0 overflow-hidden"
            style={{ width: "100%", height: "100%", top: 0, left: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/higgsfield/poster/vaultdrop-hero-orrery-loop.jpg"
              alt=""
              aria-hidden
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {!reduced && (
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster="/higgsfield/poster/vaultdrop-hero-orrery-loop.jpg"
              >
                <source src="/higgsfield/video/vaultdrop-hero-orrery-loop.webm" type="video/webm" />
                <source src="/higgsfield/video/vaultdrop-hero-orrery-loop.mp4" type="video/mp4" />
              </video>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/40" />
          </div>

          {/* hero copy + live slots */}
          <div
            ref={copyRef}
            className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-start justify-end px-6 pb-16 sm:justify-center sm:pb-0"
          >
            <h1 className="font-display text-[13vw] font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl xl:text-[7.5rem]">
              Never lose.
              <br />
              <span className="text-gold">Sometimes win big.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-bone/80 sm:text-xl">
              Prize savings on Solana. Withdraw anytime.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#waitlist"
                className="rounded-full bg-gold px-8 py-3.5 font-medium text-ink transition hover:brightness-110"
              >
                Deposit
              </a>
              <a
                href="#how"
                className="rounded-full border border-bone/25 px-8 py-3.5 font-medium text-bone transition hover:border-bone/60"
              >
                How it works
              </a>
            </div>

            <dl className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="glass rounded-xl px-4 py-3">
                <dt className="text-[11px] uppercase tracking-[0.18em] text-gold/90">Mega Vault</dt>
                <dd className="mt-1 text-sm text-gold">
                  <LiveSlot
                    state={state}
                    value={megaValue}
                    prelaunchText={PRELAUNCH.mega(FIRST_DRAW_DATE)}
                    odometer
                  />
                </dd>
              </div>
              <div className="glass rounded-xl px-4 py-3">
                <dt className="text-[11px] uppercase tracking-[0.18em] text-bone/60">
                  Total deposited
                </dt>
                <dd className="mt-1 text-sm">
                  <LiveSlot
                    state={state}
                    value={tvlValue}
                    prelaunchText={PRELAUNCH.tvl(FIRST_DRAW_DATE)}
                  />
                </dd>
              </div>
              <div className="glass rounded-xl px-4 py-3">
                <dt className="text-[11px] uppercase tracking-[0.18em] text-bone/60">Next draw</dt>
                <dd className="mt-1 text-sm">
                  <Countdown
                    targetUtc={nextDraw}
                    fallback={state === "prelaunch" ? "First draw TBA" : "—"}
                  />
                </dd>
              </div>
            </dl>
          </div>

          {/* scroll cue */}
          <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-bone/40 sm:block">
            Scroll
          </div>
        </div>
      </section>

      {/* Corner HUD — carries the Mega Vault number through the page */}
      <div
        aria-hidden={!docked}
        className={`fixed bottom-6 right-6 z-50 w-[200px] overflow-hidden rounded-xl border border-bone/15 transition-opacity duration-300 ${
          docked ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="relative h-[120px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/higgsfield/poster/vaultdrop-hero-orrery-loop.jpg"
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/55" />
          <div className="absolute inset-0 flex flex-col justify-end p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold/90">Mega Vault</div>
            <div className="mt-0.5 text-xs text-gold">
              <LiveSlot
                state={state}
                value={megaValue}
                prelaunchText={PRELAUNCH.mega(FIRST_DRAW_DATE)}
                odometer
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
