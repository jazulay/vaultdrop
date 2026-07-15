"use client";

import { useEffect, useState } from "react";
import { countdownParts } from "@/lib/format";

/**
 * Ticking countdown to a UTC instant supplied by the API.
 * Renders nothing but the pre-launch/unavailable string when target is null.
 */
export default function Countdown({
  targetUtc,
  fallback,
  className = "",
}: {
  targetUtc: string | null;
  fallback: string;
  className?: string;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!targetUtc || !now) {
    return <span className={`font-mono ${className}`}>{fallback}</span>;
  }
  const { text } = countdownParts(new Date(targetUtc), now);
  return (
    <span className={`font-mono tabular-nums ${className}`} suppressHydrationWarning>
      {text}
    </span>
  );
}
