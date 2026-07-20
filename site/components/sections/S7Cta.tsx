"use client";

import { useEffect, useRef, useState } from "react";
import { APP_URL, CTA } from "@/lib/launch";
import { track } from "@/lib/analytics";
import Magnetic from "@/components/Magnetic";

/**
 * S7 — THE CLOSE. Ignite moment (A6, non-loop) plays once on entry.
 * DAY-ONE PIVOT (2026-07-20): there is no waitlist — the close is the vault
 * entrance. One gold door, the honest epoch-1 why-now, and the proof link.
 * The app itself tells the truth about what's live (its banner derives from
 * its runtime config), so this button is unconditional.
 */
export default function S7Cta() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [entered, setEntered] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setEntered(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (entered && !reduced && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [entered, reduced]);

  return (
    <section id="enter" ref={ref} className="relative min-h-screen overflow-hidden">
      <div className="vignette absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/higgsfield/poster/vaultdrop-ignite-moment.jpg"
          srcSet="/higgsfield/poster/vaultdrop-ignite-moment-sm.jpg 780w, /higgsfield/poster/vaultdrop-ignite-moment.jpg 1600w"
          sizes="100vw"
          alt="A glass orb igniting gold inside its brass cradle — the moment of a win"
          loading="lazy"
          width={1600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {!reduced && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            preload="none"
            poster="/higgsfield/poster/vaultdrop-ignite-moment.jpg"
          >
            <source src="/higgsfield/video/vaultdrop-ignite-moment.webm" type="video/webm" />
            <source src="/higgsfield/video/vaultdrop-ignite-moment.mp4" type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/60" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <h2 className="font-display text-5xl font-semibold tracking-tight sm:text-7xl">
          Your money, in orbit.
        </h2>
        <p className="mt-6 max-w-lg text-lg text-bone/75">
          Epoch 1 is the smallest the vault will ever be — you&apos;ll never win
          more often than at the start. Same expected value, different game.
        </p>

        <Magnetic className="mt-10">
          <a
            href={APP_URL}
            onClick={() => track("cta_click", { cta: "close" })}
            className="press-ripple press-scale inline-block whitespace-nowrap rounded-full bg-gold px-12 py-4 text-lg font-medium text-ink transition hover:brightness-110"
          >
            {CTA.appButton}
          </a>
        </Magnetic>

        <p className="mt-4 font-mono text-[11px] tracking-[0.08em] text-bone/55">
          Connect a wallet · your SOL stays yours · withdraw anytime
        </p>
        <a
          href="#proof"
          className="link-quiet mt-2 font-mono text-[11px] text-bone/60"
          onClick={() => track("cta_click", { cta: "close_proof" })}
        >
          how every draw is proved →
        </a>
      </div>
    </section>
  );
}
