/**
 * WINNER'S PLATE / SHARE CARD (pass 5 §5) — one surface, two lives.
 *
 * Today it renders the demo win plate on the hero. At launch the SAME card
 * renders a real winner's moment (winner shape, amount, epoch, proof link) and
 * becomes exportable as a share image — real wins posted by real winners is
 * the best distribution this product will ever have, so the surface is
 * designed now and the export plumbing ships at launch (STUBS #16, needs the
 * per-draw winner event + proof URL from the API — see API_REQUESTS.md).
 *
 * HONESTY RAILS: `demo` may only be false for a real, verifiable win with a
 * real proof href. Demo cards always carry the (DEMO) mark; no proof link is
 * ever invented.
 */

const fmt = (n: number, d = 1) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });

export interface WinnerCardProps {
  amountSol: number;
  /** True per-draw odds the win landed at (1-in-N); omitted when unknown. */
  oddsOneInN?: number | null;
  /** Demo cards are always labeled; real cards require a proof link. */
  demo: boolean;
  /** e.g. "practice draw №4,301" today, "epoch 3 · draw of 2026-08-02" at launch. */
  epochLabel?: string;
  /** On-chain proof URL — real wins only, supplied by the API, never invented. */
  proofHref?: string;
}

export default function WinnerCard({
  amountSol,
  oddsOneInN,
  demo,
  epochLabel,
  proofHref,
}: WinnerCardProps) {
  return (
    <div className="stamp-in rounded-xl border border-gold/50 bg-ink/80 px-8 py-5 backdrop-blur-md">
      <div className="font-display text-[32px] font-semibold tracking-tight text-gold">
        YOU WON {fmt(amountSol)} SOL
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/70">
        {demo ? "(demo)" : epochLabel}
        {oddsOneInN != null && isFinite(oddsOneInN) && (
          <> · at true 1-in-{Math.round(oddsOneInN).toLocaleString("en-US")} odds</>
        )}
        {demo && epochLabel && <> · {epochLabel}</>}
      </div>
      {!demo && proofHref && (
        <a
          href={proofHref}
          className="link-quiet mt-2 inline-block font-mono text-[11px] text-bone/70"
        >
          verify this draw on-chain →
        </a>
      )}
    </div>
  );
}
