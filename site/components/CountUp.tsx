"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Eased numeric tween (§5.1/§5.6 "counting numbers"). Unlike Odometer's drum
 * (for rare, ceremonial updates), this follows rapidly-changing values —
 * slider output — with a short rAF ease. Reduced motion renders instantly.
 */
export default function CountUp({
  value,
  decimals = 0,
  className = "",
  durationMs = 320,
}: {
  value: number;
  decimals?: number;
  className?: string;
  durationMs?: number;
}) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (value - from) * eased;
      setShown(v);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs]);

  return (
    <span className={`tabular-nums ${className}`}>
      {shown.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
