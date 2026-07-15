"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import VideoLoop from "@/components/VideoLoop";

gsap.registerPlugin(ScrollTrigger);

const PANELS = [
  {
    clip: "vaultdrop-orb-enter-loop",
    step: "01",
    copy: "Deposit SOL. Get jpSOL — same value, always redeemable.",
  },
  {
    clip: "vaultdrop-orbit-tickets-loop",
    step: "02",
    copy: "Holding is your ticket. Weight = your balance × time. No lockups.",
  },
  {
    clip: "vaultdrop-orb-exit-loop",
    step: "03",
    copy: "Win from the yield. Or withdraw everything, anytime. Principal never plays.",
  },
];

export default function S2How() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".how-panel").forEach((panel) => {
        gsap.fromTo(
          panel,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: panel,
              start: "top 85%",
              end: "top 40%",
              scrub: true,
            },
          },
        );
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how" ref={ref} className="relative bg-ink py-24 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          How it works
        </h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {PANELS.map((p) => (
            <figure key={p.step} className="how-panel">
              <div className="vignette relative aspect-video overflow-hidden rounded-2xl border border-bone/10">
                <VideoLoop name={p.clip} className="absolute inset-0" />
              </div>
              <figcaption className="mt-5 flex gap-4">
                <span className="font-mono text-sm text-bone/40">{p.step}</span>
                <p className="text-lg leading-snug text-bone/90">{p.copy}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
