"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStats } from "@/lib/api";
import { APP_URL, LAUNCHED, EPOCH1_UTC, NOW } from "@/lib/launch";
import { nextSunday18UTC } from "@/lib/format";
import { rejectionInt } from "@/lib/draw";
import { initLedger, useDemoLedger } from "@/lib/demoLedger";
import { useSolPrice, fmtUsd } from "@/lib/price";
import { track } from "@/lib/analytics";
import Odometer from "@/components/Odometer";
import Countdown from "@/components/Countdown";
import VideoLoop from "@/components/VideoLoop";

gsap.registerPlugin(ScrollTrigger);

/** §5.2 — ~15 cheap code embers rising off the molten sun. */
function Embers() {
  const [embers, setEmbers] = useState<
    { left: number; size: number; duration: number; delay: number; drift: number }[]
  >([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEmbers(
      Array.from({ length: 15 }, () => ({
        left: 35 + rejectionInt(45), // over the sun, right-of-center
        size: 2 + rejectionInt(4),
        duration: 6 + rejectionInt(7),
        delay: rejectionInt(8),
        drift: rejectionInt(48) - 24,
      })),
    );
  }, []);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[6]">
      {embers.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
            ["--ember-drift" as string]: `${e.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * §3.8 + B3, rebuilt in pass 7 B4 — the miss history as a FILLING GOLD BAR
 * (accumulation the eye watches happen) instead of debug W-chips. Still the
 * one ledger: the bar's segment count is the real miss streak, the total is
 * the hero ticker by construction, and it keeps filling live as the follow
 * strip resolves draws.
 */
function RolloverStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const led = useDemoLedger();
  useEffect(() => {
    initLedger();
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const SEGMENTS = 26; // one expected streak-length of visual room
  const filled = Math.min(SEGMENTS, led.missWeeks);
  const overflow = led.missWeeks - filled;

  return (
    <div ref={ref} className="mt-10 max-w-2xl">
      <div className="inline-block rounded-lg bg-ink/70 p-3 backdrop-blur-[2px]">
        <div className="flex items-center gap-3">
          <div className="flex h-4 items-stretch gap-[3px]" aria-hidden>
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span
                key={i}
                className={`w-2.5 rounded-[3px] ${seen && i < filled ? "strip-cell" : ""}`}
                style={{
                  animationDelay: seen ? `${i * 55}ms` : undefined,
                  background:
                    i < filled
                      ? `rgba(201,162,39,${0.35 + (i / SEGMENTS) * 0.65})`
                      : "rgba(239,233,218,0.08)",
                  opacity: seen || i >= filled ? undefined : 0,
                }}
              />
            ))}
          </div>
          <span
            className={`whitespace-nowrap font-mono text-[13px] font-medium text-gold ${seen ? "strip-cell" : "opacity-0"}`}
            style={seen ? { animationDelay: `${SEGMENTS * 55 + 100}ms` } : undefined}
          >
            = {led.pot.toLocaleString("en-US", { maximumFractionDigits: 0 })} SOL and rolling
          </span>
        </div>
        <p className="mt-2 font-mono text-[10px] text-bone/60">
          {led.missWeeks.toLocaleString("en-US")} miss{led.missWeeks === 1 ? "" : "es"} stacked
          {overflow > 0 && <> ({overflow.toLocaleString("en-US")} beyond the bar</>}
          {overflow > 0 && <>)</>} · +
          {led.accrual.toLocaleString("en-US", { maximumFractionDigits: 1 })} SOL per miss —
          the live demo table&apos;s actual history, same ledger as the hero
        </p>
      </div>
    </div>
  );
}

/**
 * S3 — THE MEGA VAULT. Status lives in a small chip (audit P2-14); the
 * headline slot carries the live pot number or the promise.
 */
export default function S3Mega() {
  const ref = useRef<HTMLElement>(null);
  const { state, stats } = useStats();
  const led = useDemoLedger();
  const price = useSolPrice();

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
      {/* Pass 6 #10: at <md the copy sits over the sun's brightest area — one
          extra scrim keeps the words in charge of the moment. */}
      <div className="absolute inset-0 bg-ink/45 md:hidden" />
      <Embers />

      <div className="mega-inner relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-24">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.35em] text-gold">The Mega Vault</span>
          {/* Pass 7 C2: one truth about NOW — this chip may not contradict the
              hero's "Open the vault" (lib/launch NOW map). */}
          <span className="rounded-md border border-gold/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-gold/90">
            {NOW.megaChip}
          </span>
        </div>

        {/* §3.9 + B4: the pot takes its throne. Live pot when real; the demo
            ledger's pot (labeled) until then — launch-day ready by design. */}
        <div className="mega-heartbeat mt-6 font-display font-semibold tracking-tight text-gold">
          {megaValue ? (
            <span className="text-6xl sm:text-8xl lg:text-9xl">
              <Odometer value={megaValue} className="tabular-nums" />
              <span className="ml-4 text-3xl text-gold/70 sm:text-5xl">SOL</span>
            </span>
          ) : (
            <span className="text-6xl sm:text-8xl lg:text-9xl">
              <Odometer
                value={led.pot.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                className="tabular-nums"
              />
              <span className="ml-4 text-3xl text-gold/70 sm:text-5xl">SOL</span>
              <span className="ml-4 inline-block translate-y-[-0.5em] rounded-md border border-gold/40 px-2 py-0.5 align-middle font-mono text-[11px] uppercase tracking-[0.15em] text-gold/90">
                demo
              </span>
            </span>
          )}
        </div>
        {!megaValue && (
          <>
            {/* B4: the money, in money — live Pyth dollars beneath the pot;
                hidden (never stale) when the feed is down. */}
            {price.usd !== null && (
              <p className="mt-2 font-mono text-xl text-gold/80 tabular-nums sm:text-2xl">
                ≈ {fmtUsd(led.pot * price.usd)} at today&apos;s price — one person takes
                all of it
              </p>
            )}
            <p className="mt-4 max-w-3xl font-display text-2xl font-semibold leading-tight text-gold/80 sm:text-3xl">
              It grows until someone <span className="whitespace-nowrap">takes it.</span>
            </p>
          </>
        )}

        <p className="mt-8 max-w-xl text-xl leading-snug text-bone/90 sm:text-2xl">
          Every week it doesn&apos;t hit, it grows.
        </p>
        <p className="mt-3 max-w-xl text-base text-bone/65">
          1-in-26 every Sunday. Misses roll over. On average it lands about
          twice a year.
        </p>

        <RolloverStrip />

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <span className="text-[11px] uppercase tracking-[0.25em] text-bone/50">
            {NOW.megaCtaLabel}
          </span>
          {countdownTarget ? (
            <Countdown targetUtc={countdownTarget} fallback="" className="text-lg text-bone" />
          ) : (
            /* Pass 6 #15 + pass 7 C2: the ask, told in the same tense as the
               hero — the app is open NOW; the real pot arms at epoch 1. */
            <a
              href={APP_URL}
              className="link-quiet text-lg text-bone"
              onClick={() => track("cta_click", { cta: "mega" })}
            >
              {NOW.megaCtaLink}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
