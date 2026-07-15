"use client";

import { useEffect, useState } from "react";

/**
 * D : HH : MM : SS countdown (audit §7.1). Pure-UTC math — the target is an
 * absolute instant, so Date arithmetic is timezone/DST-safe by construction.
 * tabular-nums so digits never jitter. Renders `fallback` when target is null.
 */
export default function Countdown({
  targetUtc,
  fallback,
  label,
  className = "",
}: {
  targetUtc: string | null;
  fallback: string;
  label?: string;
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

  let ms = Math.max(0, new Date(targetUtc).getTime() - now.getTime());
  const d = Math.floor(ms / 86_400_000);
  ms -= d * 86_400_000;
  const h = Math.floor(ms / 3_600_000);
  ms -= h * 3_600_000;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms - m * 60_000) / 1_000);
  const pad = (x: number) => String(x).padStart(2, "0");

  return (
    <span
      className={`font-mono ${className}`}
      style={{ fontVariantNumeric: "tabular-nums" }}
      suppressHydrationWarning
    >
      {label && <span className="mr-2 text-bone/50">{label}</span>}
      {d} : {pad(h)} : {pad(m)} : {pad(s)}
    </span>
  );
}
