"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStats } from "@/lib/api";
import { PARAMS } from "@/lib/calc";
import { LAUNCHED, EPOCH1_UTC } from "@/lib/launch";
import { formatSol, nextSunday18UTC } from "@/lib/format";
import Countdown from "@/components/Countdown";
import Odometer from "@/components/Odometer";
import {
  DemoDrawProvider,
  DemoDrawStage,
  DemoDrawCta,
  DemoDrawStrip,
} from "@/components/DemoDraw";

gsap.registerPlugin(ScrollTrigger);

/**
 * S1 — THE ORRERY. 160vh section (was 220vh — audit P0-3): the sticky hero
 * shrinks toward the corner while the Reframe section is already arriving, so
 * no scroll position renders a blank viewport. The fixed PiP ("Orbit ticker",
 * audit §7.3) takes over when the section releases.
 */
export default function HeroOrrery() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const { state, stats } = useStats();

  // Mount the hero video only after page load — it must never compete with
  // the poster/H1 (LCP) on slow connections.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.readyState === "complete") {
      setVideoReady(true);
      return;
    }
    const onLoad = () => setVideoReady(true);
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(rm);
    if (rm) {
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
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (st) => {
            if (videoRef.current) {
              videoRef.current.playbackRate = Math.max(0.25, 1 - st.progress * 0.75);
            }
            setDocked(st.progress > 0.9);
          },
        },
      });

      // Pass 6 #7: the copy holds while the set departs (fade starts at 45%,
      // not 0), and the released slab is no longer dead — a chapter card
      // ("The problem with 7%") rises exactly where the next section's
      // headline will land, turning the void into a match cut.
      //
      // Pass 7 C4: the shrink-to-corner thumbnail is gone (it duplicated the
      // PiP, which is also gone — the follow strip is the one hero residue).
      // The set now departs by receding: dim + slight push-in, then release.
      tl.to(copyRef.current, { opacity: 0, y: -40, duration: 0.3, ease: "none" }, 0.45);
      tl.to(
        frame,
        { opacity: 0.25, scale: 1.06, filter: "blur(2px)", duration: 0.6, ease: "none" },
        0.3,
      );
      tl.fromTo(
        chapterRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.35, ease: "none" },
        0.6,
      );
    }, section);

    return () => ctx.revert();
  }, []);

  // PiP auto-hides while the footer is in view (audit P2-13).
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(
      (entries) => setFooterVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0 },
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  const megaValue =
    state === "live" && stats ? `${formatSol(stats.mega_balance_sol)} SOL` : null;
  const nextDraw =
    state === "live" && stats
      ? stats.next_draw_utc
      : LAUNCHED
        ? nextSunday18UTC(new Date()).toISOString()
        : EPOCH1_UTC;

  const stripVisible = docked && !footerVisible;

  return (
    <DemoDrawProvider docked={docked}>
      {/* Pass 6 #7/#22: 140vh (was 160 — less released-slab tail) and dvh so
          iOS Safari's URL bar can't hide the chips row below the fold. */}
      <section
        ref={sectionRef}
        className={
          reduced
            ? "relative h-screen supports-[height:100dvh]:h-[100dvh]"
            : "relative h-[140vh] supports-[height:140dvh]:h-[140dvh]"
        }
      >
        <div className="sticky top-0 h-screen supports-[height:100dvh]:h-[100dvh]">
          {/* the video frame that shrinks to the corner */}
          <div
            ref={frameRef}
            className="vignette absolute inset-0 overflow-hidden"
            style={{ width: "100%", height: "100%", top: 0, left: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/higgsfield/poster/vaultdrop-hero-orrery-loop.jpg"
              srcSet="/higgsfield/poster/vaultdrop-hero-orrery-loop-sm.jpg 780w, /higgsfield/poster/vaultdrop-hero-orrery-loop.jpg 1600w"
              sizes="100vw"
              alt="Gold orrery with glass orbs orbiting a glowing core — the VaultDrop prize vault"
              fetchPriority="high"
              className="hero-set absolute inset-0 h-full w-full object-cover"
            />
            {!reduced && videoReady && (
              /* §2.1 focus pull: the orrery loop keeps playing as the SET —
                 blurred, dimmed, clearly behind the Draw Ring. */
              <video
                ref={videoRef}
                className="hero-set absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                disableRemotePlayback
                preload="metadata"
                poster="/higgsfield/poster/vaultdrop-hero-orrery-loop.jpg"
              >
                <source src="/higgsfield/video/vaultdrop-hero-orrery-loop.webm" type="video/webm" />
                <source src="/higgsfield/video/vaultdrop-hero-orrery-loop.mp4" type="video/mp4" />
              </video>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/40" />
            {/* Pass 3 §4: the demo-draw layer, composited over the loop. It
                shrinks with the frame and pauses once docked. */}
            <DemoDrawStage />
          </div>

          {/* Pass 6 #7: the chapter card — rises as the frame docks, so the
              released slab reads as a beat, not a void. Echoed by Reframe's
              eyebrow one viewport later. */}
          {!reduced && (
            <div
              ref={chapterRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center opacity-0"
            >
              <div className="px-6 text-center font-display text-4xl font-semibold tracking-tight text-bone/80 sm:text-6xl">
                The problem with {(PARAMS.stakingApy * 100).toFixed(0)}%
              </div>
            </div>
          )}

          {/* hero copy — §4 layout surgery: exactly four stacked elements.
              The id anchors the orb exclusion zone (§3.2). */}
          <div
            id="hero-copy"
            ref={copyRef}
            className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-start justify-end px-6 pb-[calc(var(--stage-h,180px)+20px)] sm:justify-center sm:pb-32"
          >
            <h1 className="font-display text-[13vw] font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl xl:text-[7.5rem]">
              Never lose.
              <br />
              <span className="text-gold">Sometimes win big.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-bone/80 sm:text-xl">
              Your staking yield becomes weekly tickets. Your SOL stays
              yours — withdraw anytime.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <DemoDrawCta />
              <a
                href="#how"
                className="press-ripple press-scale rounded-full border border-bone/25 px-8 py-3.5 font-medium text-bone transition hover:border-bone/60"
              >
                How it works
              </a>
            </div>

            <p className="mt-5 font-mono text-[11px] tracking-[0.08em] text-bone/55">
              No lockups · Principal never plays · Draws provable on-chain
            </p>

            {/* Launched/live states only — pre-launch, the stage bar carries
                the game (§4: the SEEDING card's info merged into its mega
                plate; the demo clock is the countdown until epoch-1 exists). */}
            {state === "live" && stats ? (
              <dl className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="glass rounded-xl px-4 py-3">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-gold/90">
                    Mega Vault
                  </dt>
                  <dd className="mt-1 text-sm text-gold">
                    <Odometer value={megaValue ?? ""} />
                  </dd>
                </div>
                <div className="glass rounded-xl px-4 py-3">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-bone/60">
                    Total deposited
                  </dt>
                  <dd className="mt-1 font-mono text-sm">
                    {formatSol(stats.tvl_sol)} SOL
                  </dd>
                </div>
                <div className="glass rounded-xl px-4 py-3">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-bone/60">
                    Next draw
                  </dt>
                  <dd className="mt-1 text-sm">
                    <Countdown targetUtc={nextDraw} fallback="—" />
                  </dd>
                </div>
              </dl>
            ) : EPOCH1_UTC ? (
              <div className="glass mt-10 inline-flex items-center gap-4 rounded-xl px-5 py-3.5">
                <span className="text-[11px] uppercase tracking-[0.18em] text-gold/90">
                  Epoch 1 opens
                </span>
                <Countdown targetUtc={EPOCH1_UTC} fallback="" className="text-lg text-bone" />
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-bone/40 sm:block">
            Scroll
          </div>
        </div>
      </section>

      {/* Pass 7 C4 — the follow strip: the stage bar's essence detaches and
          follows the visitor as one slim, always-live line. Replaces the PiP
          (frozen clock) and the shrink-to-corner thumbnail (redundant). */}
      <DemoDrawStrip visible={stripVisible} />
    </DemoDrawProvider>
  );
}
