"use client";

import { useState } from "react";
import { useDraws, PRELAUNCH, UNAVAILABLE_TOOLTIP } from "@/lib/api";
import { formatSol } from "@/lib/format";

/**
 * S4 — PROOF. Ledger aesthetic, fed by /draws. NOTHING here is ever mocked:
 * pre-launch renders the verbatim empty state; unreachable renders the honest dash.
 */
export default function S4Proof() {
  const { state, draws } = useDraws();
  const [open, setOpen] = useState(false);

  return (
    <section id="proof" className="relative bg-ink py-24 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Every draw, provable.
          <br />
          Every number, on-chain.
        </h2>

        <div className="glass mt-14 overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[640px] text-left font-mono text-sm">
            <thead>
              <tr className="ledger-row text-[11px] uppercase tracking-[0.18em] text-bone/50">
                <th className="px-5 py-4 font-normal">Epoch</th>
                <th className="px-5 py-4 font-normal">Pool</th>
                <th className="px-5 py-4 font-normal">Winners</th>
                <th className="px-5 py-4 font-normal">VRF proof</th>
                <th className="px-5 py-4 font-normal">Settle tx</th>
              </tr>
            </thead>
            <tbody>
              {state === "live" && draws && draws.length > 0 ? (
                draws.map((d) => (
                  <tr key={d.epoch} className="ledger-row text-bone/85">
                    <td className="px-5 py-4">{d.epoch}</td>
                    <td className="px-5 py-4">{formatSol(d.pool_sol)} SOL</td>
                    <td className="px-5 py-4">{d.winners_count}</td>
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
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-bone/60">
                    {state === "unavailable" ? (
                      <span className="slot-unavailable" title={UNAVAILABLE_TOOLTIP}>
                        —
                      </span>
                    ) : (
                      PRELAUNCH.draws
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <button
            onClick={() => setOpen((v) => !v)}
            className="link-quiet text-sm text-bone/70"
            aria-expanded={open}
          >
            How our draws are verified {open ? "−" : "+"}
          </button>
          {open && (
            <div className="glass mt-4 max-w-2xl space-y-3 rounded-xl p-6 text-sm leading-relaxed text-bone/80">
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
