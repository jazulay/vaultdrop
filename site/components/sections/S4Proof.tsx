"use client";

import { useEffect, useRef, useState } from "react";
import { useDraws, PRELAUNCH, UNAVAILABLE_TOOLTIP } from "@/lib/api";
import { formatSol } from "@/lib/format";
import { calc, PARAMS } from "@/lib/calc";
import { DEMO_VAULT_SOL } from "@/lib/draw";
import Odometer from "@/components/Odometer";

// Pass 7 C1: the preview row derives from PARAMS like every other figure on
// the page — a hardcoded pool/winner count here is a two-truths defect (this
// row once contradicted the locked 31-winner economics; check-stubs now traps
// the old literals).
const PREVIEW_POOL = calc(1, DEMO_VAULT_SOL).weeklyPool.toFixed(1);
const PREVIEW_WINNERS = String(PARAMS.winnersPerDraw);

/**
 * S4 — PROOF. Ledger fed by /draws. Pre-launch: verbatim empty state PLUS one
 * unmistakably-labeled PREVIEW row showing the anatomy of a settled draw
 * (audit P1-10). Nothing unlabeled is ever mocked.
 */
export default function S4Proof() {
  const { state, draws } = useDraws();
  const [open, setOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);

  // §5.5 — the preview row "settles" once on first view: numbers slot in
  // odometer-style, links stamp in. The table teaches "draws produce records"
  // by producing one in front of you. Still, subtle, never repeats.
  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSettled(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hasLive = state === "live" && draws && draws.length > 0;

  return (
    <section id="proof" className="relative bg-ink py-24 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Every draw, provable.
          <br />
          Every number, <span className="whitespace-nowrap">on-chain.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base text-bone/70">
          Randomness by on-chain VRF, settled on Solana. Anyone can re-derive
          every winner from the proof —{" "}
          <button onClick={() => setOpen(true)} className="link-quiet">
            here&apos;s how
          </button>
          .
        </p>

        {/* Pass 6 #12: the table can scroll on mobile, but the honesty copy
            lives OUTSIDE it (below) so it can never clip; the right-edge fade
            is the scroll affordance. */}
        <div className="relative mt-10">
          <div ref={tableRef} className="glass overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[640px] text-left font-mono text-sm">
            <caption className="sr-only">
              Draw history: epoch, prize pool, winners, VRF proof and settlement
              transaction for every weekly draw
            </caption>
            <thead>
              <tr className="ledger-row text-[11px] uppercase tracking-[0.18em] text-bone/50">
                <th scope="col" className="px-5 py-4 font-normal">Epoch</th>
                <th scope="col" className="px-5 py-4 text-right font-normal">Pool</th>
                <th scope="col" className="px-5 py-4 text-right font-normal">Winners</th>
                <th scope="col" className="px-5 py-4 font-normal">VRF proof</th>
                <th scope="col" className="px-5 py-4 font-normal">Settle tx</th>
              </tr>
            </thead>
            <tbody>
              {hasLive ? (
                draws!.map((d) => (
                  <tr key={d.epoch} className="ledger-row text-bone/85">
                    <td className="px-5 py-4">{d.epoch}</td>
                    <td className="px-5 py-4 text-right">{formatSol(d.pool_sol)} SOL</td>
                    <td className="px-5 py-4 text-right">{d.winners_count}</td>
                    <td className="px-5 py-4">
                      <a href={d.vrf_proof_url} className="link-quiet" target="_blank" rel="noreferrer">
                        proof ↗
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <a href={d.settle_tx_url} className="link-quiet" target="_blank" rel="noreferrer">
                        tx ↗
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {/* PREVIEW row — the anatomy of a settled draw. Not a real draw. */}
                  <tr className="ledger-row bg-steel/40 text-bone/45">
                    <td className="px-3 py-4 sm:px-5">
                      <span className="mr-3 rounded border border-bone/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-bone/60">
                        Preview
                      </span>
                      12
                    </td>
                    <td className="px-3 py-4 text-right sm:px-5" data-preview-source="params">
                      {settled ? (
                        <Odometer value={PREVIEW_POOL} />
                      ) : (
                        <span className="opacity-0">{PREVIEW_POOL}</span>
                      )}{" "}
                      SOL
                    </td>
                    <td className="px-3 py-4 text-right sm:px-5">
                      {settled ? (
                        <Odometer value={PREVIEW_WINNERS} />
                      ) : (
                        <span className="opacity-0">{PREVIEW_WINNERS}</span>
                      )}
                    </td>
                    {/* Placeholder cells, not links — real draws link to the
                        real artifacts (pass 6 #12). */}
                    <td className="px-3 py-4 sm:px-5">
                      <span
                        title="Real draws link to the VRF proof on-chain"
                        className={`text-bone/35 ${settled ? "stamp-in inline-block" : "opacity-0"}`}
                      >
                        proof —
                      </span>
                    </td>
                    <td className="px-3 py-4 sm:px-5">
                      <span
                        title="Real draws link to the settlement transaction on-chain"
                        className={`text-bone/35 ${settled ? "stamp-in inline-block" : "opacity-0"}`}
                        style={{ animationDelay: "150ms" }}
                      >
                        tx —
                      </span>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          </div>
          {/* right-edge scroll affordance, mobile only */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-2xl bg-gradient-to-l from-ink/80 to-transparent sm:hidden"
          />
        </div>

        {!hasLive && (
          <div className="mt-4 text-sm text-bone/60">
            {state === "unavailable" ? (
              <span className="slot-unavailable" title={UNAVAILABLE_TOOLTIP}>
                —
              </span>
            ) : (
              <>
                {PRELAUNCH.draws}
                <span className="mt-1 block text-[11px] text-bone/40">
                  The grey row above is a preview of a draw record — not a real
                  draw.
                </span>
              </>
            )}
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={() => setOpen((v) => !v)}
            className="link-quiet text-sm text-bone/70"
            aria-expanded={open}
            aria-controls="verify-panel"
          >
            How our draws are verified{" "}
            <span
              className="inline-block transition-transform duration-200"
              style={{ transform: open ? "rotate(45deg)" : "none" }}
            >
              +
            </span>
          </button>
          {open && (
            <div
              id="verify-panel"
              role="region"
              aria-label="How our draws are verified"
              className="glass mt-4 max-w-2xl space-y-3 rounded-xl p-6 text-sm leading-relaxed text-bone/80"
            >
              <p>
                Before each draw, the program publishes a commitment to the full set of
                depositors and their time-weighted balances — the ticket list is locked
                first, so it can&apos;t be edited after the fact.
              </p>
              <p>
                Then a verifiable random number (VRF) is requested on-chain. The randomness
                arrives with its own cryptographic proof, and only then is it revealed and
                applied to the locked list to pick winners.
              </p>
              <p>
                Commit first, reveal second — in that order, every week. Anyone can take the
                published set, the proof, and the result, and recompute the winners
                themselves. The links in the table above go to exactly those artifacts.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
