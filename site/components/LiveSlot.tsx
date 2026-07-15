"use client";

import { UNAVAILABLE_TOOLTIP, type DataState } from "@/lib/api";
import Odometer from "@/components/Odometer";

/**
 * A slot that renders a live number, its verbatim pre-launch state, or the
 * honest "—". Never a cached number as current, never a fake (§7).
 */
export default function LiveSlot({
  state,
  value,
  prelaunchText,
  odometer = false,
  className = "",
  prelaunchClassName = "",
}: {
  state: DataState;
  value: string | null;
  prelaunchText: string;
  odometer?: boolean;
  className?: string;
  prelaunchClassName?: string;
}) {
  if (state === "live" && value !== null) {
    return odometer ? (
      <Odometer value={value} className={className} />
    ) : (
      <span className={`font-mono tabular-nums ${className}`}>{value}</span>
    );
  }
  if (state === "prelaunch") {
    return (
      <span className={`font-mono ${prelaunchClassName || className}`}>
        {prelaunchText}
      </span>
    );
  }
  return (
    <span
      className={`slot-unavailable font-mono ${className}`}
      title={UNAVAILABLE_TOOLTIP}
      aria-label={UNAVAILABLE_TOOLTIP}
    >
      —
    </span>
  );
}
