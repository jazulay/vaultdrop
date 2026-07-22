"use client";

import { useEffect, useRef } from "react";
import { rejectionInt } from "@/lib/draw";
import { useWorldDeposit } from "@/lib/world";

/**
 * Pass 7 B1 — THE WORLD DOESN'T END, IT DESCENDS. One fixed canvas behind the
 * whole page: the hero's ring system recedes as faint brass arcs that
 * parallax with scroll, embers drift, and — if the visitor has an orb on the
 * table — a small companion YOU-orb rides the right edge down the page and
 * docks (fades toward center) as the final gyroscope arrives. Sections that
 * should stay watchmaker-still (Proof/Safety/FAQ) keep opaque backgrounds and
 * simply cover it — the contrast doctrine is enforced by paint order.
 *
 * Cost: one canvas, ~20 strokes/frame, transforms only, paused when the tab
 * is hidden. Reduced motion: a single static frame, no embers, no companion.
 */

interface Ember {
  x: number; // 0..1 viewport fraction
  y: number; // 0..1, wraps
  r: number;
  speed: number; // fraction of viewport height per second
  drift: number;
  alpha: number;
}

const ARCS = [
  { cxF: 0.72, rF: 0.62, squash: 0.4, par: 0.055, alpha: 0.10, width: 2.5 },
  { cxF: 0.66, rF: 0.95, squash: 0.42, par: 0.09, alpha: 0.07, width: 2 },
  { cxF: 0.78, rF: 1.35, squash: 0.45, par: 0.13, alpha: 0.05, width: 1.5 },
];

export default function WorldLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deposit = useWorldDeposit();
  const depositRef = useRef(deposit);
  depositRef.current = deposit;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const embers: Ember[] = Array.from({ length: 14 }, () => ({
      x: rejectionInt(1000) / 1000,
      y: rejectionInt(1000) / 1000,
      r: 1 + rejectionInt(20) / 10,
      speed: 0.008 + rejectionInt(16) / 1000,
      drift: (rejectionInt(20) - 10) / 1000,
      alpha: 0.12 + rejectionInt(18) / 100,
    }));

    // The companion's vertical ease and the dock target, refreshed cheaply.
    let enterTop = Infinity;
    let heroBottom = 0;
    const measure = () => {
      const enter = document.getElementById("enter");
      if (enter) enterTop = enter.getBoundingClientRect().top + window.scrollY;
      heroBottom = window.innerHeight * 0.9;
    };
    measure();
    const measureId = window.setInterval(measure, 1500);

    let youY = h * 0.4;
    let last = performance.now();
    let raf = 0;

    const drawArcs = (scrollY: number) => {
      for (const a of ARCS) {
        const cy = h * 0.5 - scrollY * a.par;
        const r = w * a.rF * 0.5;
        // skip when fully off-canvas
        if (cy + r * a.squash < -40 || cy - r * a.squash > h + 40) continue;
        const grad = ctx.createLinearGradient(w * a.cxF - r, 0, w * a.cxF + r, 0);
        grad.addColorStop(0, `rgba(138,109,31,${a.alpha * 0.4})`);
        grad.addColorStop(0.5, `rgba(230,198,90,${a.alpha})`);
        grad.addColorStop(1, `rgba(138,109,31,${a.alpha * 0.4})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = a.width;
        ctx.beginPath();
        ctx.ellipse(w * a.cxF, cy, r, r * a.squash, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawFrame = (dt: number) => {
      const scrollY = window.scrollY;
      ctx.clearRect(0, 0, w, h);
      drawArcs(scrollY);

      if (!reduced) {
        for (const e of embers) {
          e.y -= e.speed * dt;
          e.x += e.drift * dt;
          if (e.y < -0.02) {
            e.y = 1.02;
            e.x = rejectionInt(1000) / 1000;
          }
          ctx.fillStyle = `rgba(201,162,39,${e.alpha})`;
          ctx.beginPath();
          ctx.arc(e.x * w, e.y * h, e.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // companion orb — only between the hero's exit and the final dock
        const d = depositRef.current;
        if (d !== null && scrollY > heroBottom) {
          const distToEnter = enterTop - (scrollY + h);
          const dockT = Math.min(1, Math.max(0, 1 - distToEnter / (h * 0.8)));
          const targetY = h * 0.38;
          youY += (targetY - youY) * Math.min(1, dt * 2.5);
          const x = (w - 56) - dockT * (w * 0.42 - 56); // drift toward center as it docks
          const y = youY + dockT * h * 0.25;
          const alpha = (1 - dockT) * 0.9 + dockT * 0.15;
          const size = 13;
          const grad = ctx.createRadialGradient(x - 4, y - 5, 1, x, y, size);
          grad.addColorStop(0, `rgba(239,233,218,${alpha})`);
          grad.addColorStop(0.45, `rgba(59,208,143,${alpha * 0.6})`);
          grad.addColorStop(1, `rgba(11,31,36,${alpha * 0.9})`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(59,208,143,${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = `rgba(59,208,143,${alpha})`;
          ctx.font = "9px ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.fillText("YOU", x, y - size - 5);
        }
      }
    };

    if (reduced) {
      drawFrame(0);
      const onScrollStatic = () => drawFrame(0);
      window.addEventListener("scroll", onScrollStatic, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScrollStatic);
        window.removeEventListener("resize", resize);
        window.clearInterval(measureId);
      };
    }

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!document.hidden) drawFrame(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.clearInterval(measureId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
