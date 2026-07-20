"use client";

import { useEffect, useRef, useState } from "react";
import { APP_URL, CTA } from "@/lib/launch";
import { track } from "@/lib/analytics";

/**
 * Pass 6 #15 — the header returns on scroll-up. The old absolute header
 * scrolled away after viewport 1, leaving ~8,000px of persuasion with no way
 * to act; now anyone convinced mid-page can join without hunting. Hidden while
 * scrolling down (content stays in charge), slides back on any upward intent.
 */
export default function SiteHeader() {
  const [pinned, setPinned] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setAtTop(y < 80);
        const goingUp = y < lastY.current - 2;
        const goingDown = y > lastY.current + 2;
        if (y > 600 && goingUp) setPinned(true);
        else if (goingDown || y <= 600) setPinned(false);
        lastY.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const floating = pinned && !atTop;

  return (
    <header
      className={`left-0 right-0 top-0 z-40 flex items-center justify-between px-6 py-5 transition-transform duration-300 sm:px-10 ${
        floating
          ? "fixed translate-y-0 border-b border-bone/10 bg-ink/85 backdrop-blur-md"
          : atTop
            ? "absolute"
            : "fixed -translate-y-full"
      }`}
    >
      <a href="#content" className="font-display text-xl font-semibold tracking-tight">
        VaultDrop
      </a>
      <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.15em] text-bone/60">
        <a href="#how" className="hidden hover:text-bone sm:block">
          How
        </a>
        <a href="#proof" className="hidden hover:text-bone sm:block">
          Proof
        </a>
        <a
          href={APP_URL}
          onClick={() => track("cta_click", { cta: floating ? "header_pinned" : "header" })}
          className="press-scale rounded-full border border-gold/50 px-5 py-2 normal-case tracking-normal text-gold transition hover:bg-gold hover:text-ink"
        >
          {CTA.navPill}
        </a>
      </nav>
    </header>
  );
}
