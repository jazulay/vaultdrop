"use client";

import { useEffect, useRef, useState } from "react";

/**
 * S7 — FINAL CTA. The orrery returns full-frame; the ignite moment (A6,
 * non-loop) plays once on entry. Deposit routes to the waitlist pre-launch.
 */
export default function S7Cta() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [entered, setEntered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [waitlistState, setWaitlistState] = useState<"idle" | "ok" | "unwired">("idle");

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

  async function joinWaitlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = process.env.NEXT_PUBLIC_WAITLIST_URL;
    if (!url) {
      // Honest pre-launch state — no fake success (STUBS.md / API_REQUESTS.md)
      setWaitlistState("unwired");
      return;
    }
    const email = new FormData(e.currentTarget).get("email");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setWaitlistState(res.ok ? "ok" : "unwired");
  }

  return (
    <section id="waitlist" ref={ref} className="relative min-h-screen overflow-hidden">
      {/* ignite moment on entry */}
      <div className="vignette absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/higgsfield/poster/vaultdrop-ignite-moment.jpg"
          srcSet="/higgsfield/poster/vaultdrop-ignite-moment-sm.jpg 780w, /higgsfield/poster/vaultdrop-ignite-moment.jpg 1600w"
          sizes="100vw"
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {!reduced && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
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
        <p className="mt-6 max-w-md text-lg text-bone/75">
          The vault opens soon. Join the waitlist and be there for epoch 1.
        </p>

        <form
          onSubmit={joinWaitlist}
          className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="you@…"
            className="glass w-full rounded-full px-6 py-3.5 font-mono text-sm text-bone placeholder:text-bone/35 focus:border-gold/60 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-gold px-8 py-3.5 font-medium text-ink transition hover:brightness-110"
          >
            Deposit
          </button>
        </form>
        <p className="mt-3 h-5 font-mono text-xs text-bone/55" aria-live="polite">
          {waitlistState === "ok" && "You're on the list."}
          {waitlistState === "unwired" &&
            "Waitlist isn't connected yet — this is the pre-launch build."}
          {waitlistState === "idle" && "Deposits open at launch. The waitlist is the queue."}
        </p>
      </div>
    </section>
  );
}
