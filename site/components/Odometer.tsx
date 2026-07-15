"use client";

import { useEffect, useRef, useState } from "react";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const DRUM_MS = 1200;
const STAGGER_MS = 60;

function Reel({ digit, index }: { digit: string; index: number }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (!/[0-9]/.test(digit)) {
    return <span className="inline-block">{digit}</span>;
  }
  if (reduced) {
    return <span className="inline-block tabular-nums">{digit}</span>;
  }
  const n = parseInt(digit, 10);
  return (
    <span className="odo-digit tabular-nums" aria-hidden>
      <span
        className="odo-reel"
        style={{
          transform: `translateY(-${n}em)`,
          transition: `transform ${DRUM_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${index * STAGGER_MS}ms`,
        }}
      >
        {DIGITS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    </span>
  );
}

/** Per-digit vertical drum roll. `value` is a preformatted string like "12,408.55". */
export default function Odometer({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const prev = useRef(value);
  useEffect(() => {
    prev.current = value;
  }, [value]);

  return (
    <span className={`font-mono ${className}`} aria-label={value} role="text">
      {value.split("").map((ch, i) => (
        <Reel key={`${i}-${value.length}`} digit={ch} index={i} />
      ))}
    </span>
  );
}
