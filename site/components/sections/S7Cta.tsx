"use client";

import { useEffect, useRef, useState } from "react";
import { CTA } from "@/lib/launch";

/**
 * S7 — FINAL CTA. Ignite moment (A6, non-loop) plays once on entry.
 * WaitlistForm per audit §7.5: visually-hidden label, honest button verb,
 * specific errors, honeypot, no double-submit, success replaces the form.
 */
export default function S7Cta() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [entered, setEntered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<"idle" | "submitting" | "ok" | "invalid" | "error" | "unwired">(
    "idle",
  );

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
    if (phase === "submitting") return;
    const form = new FormData(e.currentTarget);
    if (form.get("company")) return; // honeypot
    const email = String(form.get("email") ?? "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setPhase("invalid");
      return;
    }
    const url = process.env.NEXT_PUBLIC_WAITLIST_URL;
    if (!url) {
      // Honest pre-launch state — no fake success (STUBS.md / API_REQUESTS.md)
      setPhase("unwired");
      return;
    }
    setPhase("submitting");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setPhase(res.ok ? "ok" : "error");
    } catch {
      setPhase("error");
    }
  }

  return (
    <section id="waitlist" ref={ref} className="relative min-h-screen overflow-hidden">
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
        <p className="mt-6 max-w-md text-lg text-bone/75">
          The vault opens soon. Join the waitlist and be there for epoch 1.
        </p>

        {phase === "ok" ? (
          <p className="mt-10 font-mono text-lg text-signal" aria-live="polite">
            {CTA.formSuccess}
          </p>
        ) : (
          <>
            <form
              onSubmit={joinWaitlist}
              className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="waitlist-email" className="sr-only">
                Email address
              </label>
              <input
                id="waitlist-email"
                type="email"
                name="email"
                required
                placeholder="you@…"
                className="glass w-full rounded-full px-6 py-3.5 font-mono text-sm text-bone placeholder:text-bone/35 focus:border-gold/60 focus:outline-none"
              />
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="hidden"
              />
              <button
                type="submit"
                disabled={phase === "submitting"}
                className="shrink-0 rounded-full bg-gold px-8 py-3.5 font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
              >
                {phase === "submitting" ? "Joining…" : CTA.footerButton}
              </button>
            </form>
            <p className="mt-3 h-5 text-sm text-bone/55" aria-live="polite">
              {phase === "invalid" && "That email doesn't look right."}
              {phase === "error" && "Something failed on our side — try again."}
              {phase === "unwired" &&
                "Waitlist isn't connected yet — this is the pre-launch build."}
              {(phase === "idle" || phase === "submitting") &&
                "Deposits open at launch. The waitlist is the queue."}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
