"use client";

/** Shared small pieces: mono numbers, drum digits, tx states, degraded banner, HUD. */

export function Mono({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-mono tabular-nums ${className}`}>{children}</span>;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function Drum({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span className={`font-mono ${className}`} aria-label={value} role="text">
      {value.split("").map((ch, i) =>
        /[0-9]/.test(ch) ? (
          <span key={i} className="odo-digit" aria-hidden>
            <span
              className="odo-reel"
              style={{
                transform: `translateY(-${parseInt(ch, 10)}em)`,
                transition: `transform 1.2s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`,
              }}
            >
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </span>
  );
}

/** API-down slot: honest dash, disabled inputs upstream. */
export function Dash() {
  return (
    <span className="cursor-help font-mono text-bone/50" title="live data unavailable">
      —
    </span>
  );
}

export type TxPhase = "pending" | "confirmed" | "failed" | "prize";

export function TxState({ phase, sig, error }: { phase: TxPhase; sig?: string; error?: string }) {
  if (phase === "pending")
    return (
      <div className="flex items-center gap-2 font-mono text-sm text-bone/60">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border border-bone/30 border-t-bone/80" />
        PENDING · {sig ?? "5KJp…x2Vd"}
      </div>
    );
  if (phase === "confirmed")
    return (
      <div className="flex items-center gap-2 font-mono text-sm text-signal">
        ✓ CONFIRMED ·{" "}
        <a className="link-quiet" href="#" data-stub="explorer-link">
          view on explorer ↗
        </a>
      </div>
    );
  if (phase === "failed")
    return (
      <div className="font-mono text-sm text-fail">
        ✕ FAILED · {error ?? "custom program error 0x1771: DepositCapExceeded"}
      </div>
    );
  return (
    <div className="font-mono text-sm text-gold">★ PRIZE CLAIMED · 5.92 SOL</div>
  );
}

/** Degraded pro-rata banner — verbatim per app prompt §3C. */
export function DegradedBanner() {
  return (
    <div className="rounded-xl border border-fail/40 bg-fail/10 p-4 font-mono text-xs leading-relaxed text-fail">
      VAULT IN PRO-RATA MODE — an underlying stake-pool loss occurred. Every
      withdrawal receives the same proportional rate; exit order doesn&apos;t matter.
      Deposits and draws are paused.
    </div>
  );
}

/** Corner orrery HUD as balance widget (app prompt §2). */
export function OrreryHud({ balanceSol, flare = false }: { balanceSol: number | null; flare?: boolean }) {
  return (
    <div className="fixed bottom-3 right-3 z-40 w-[168px] overflow-hidden rounded-xl border border-bone/15">
      <div className="relative h-[96px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/higgsfield/poster/vaultdrop-hero-orrery-loop-sm.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className={`absolute inset-0 ${flare ? "bg-gold/25" : "bg-ink/55"}`} />
        <div className="absolute inset-0 flex flex-col justify-end p-2.5">
          <div className="text-[9px] uppercase tracking-[0.2em] text-bone/60">My orbit</div>
          <div className={`font-mono text-xs ${flare ? "text-gold" : "text-bone"}`}>
            {balanceSol === null ? <Dash /> : `${balanceSol.toLocaleString("en-US", { maximumFractionDigits: 2 })} SOL`}
          </div>
        </div>
      </div>
    </div>
  );
}
