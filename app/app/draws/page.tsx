"use client";

import { Suspense } from "react";
import { useDevState } from "@/lib/devstate";
import { Mono, Dash, OrreryHud } from "@/components/Bits";

/**
 * E. Draws & Proofs — per-epoch TWAB, winners, tiers, VRF sigs, leaf-set,
 * recompute instructions. Same proof surface as the site, one tap deep.
 * WS0: layout with fixture epoch; nothing presented as live.
 */
function DrawsInner() {
  const fx = useDevState();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Draws &amp; proofs</h1>

      <section className="glass rounded-2xl p-5">
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] uppercase tracking-[0.2em] text-bone/50">Epoch 11</div>
          <span className="font-mono text-[11px] text-bone/45">settled 2026-07-12 18:00 UTC</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-bone/40">My TWAB</div>
            <div className="mt-0.5 font-mono text-bone">
              {fx.apiDown ? <Dash /> : "41.88 SOL·wk"}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-bone/40">Pool</div>
            <div className="mt-0.5 font-mono text-bone">{fx.apiDown ? <Dash /> : "112.6 SOL"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-bone/40">Tiers paid</div>
            <div className="mt-0.5 font-mono text-bone">1×50% · 5×5% · 25×1%</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-[0.15em] text-bone/40">Winners</div>
          <ul className="mt-1 grid grid-cols-2 gap-x-4 font-mono text-xs text-bone/70 sm:grid-cols-3">
            {["9mQw…2xVb", "4Hpe…kL0d", "Ju2c…8Rfa", "B61x…w3Nn", "Ep5t…qA9z", "7kDv…m1Cs"].map(
              (w) => (
                <li key={w} className="py-0.5">{w}</li>
              ),
            )}
          </ul>
        </div>

        <div className="mt-5 space-y-1.5 font-mono text-xs">
          <div>
            VRF request: <a className="link-quiet text-bone/70" href="#" data-stub="vrf-req">3fGh…s8Kq ↗</a>
          </div>
          <div>
            VRF result: <a className="link-quiet text-bone/70" href="#" data-stub="vrf-res">8Wnd…p4Tz ↗</a>
          </div>
          <div>
            Leaf set: <a className="link-quiet text-bone/70" href="#" data-stub="leafset">download (epoch-11.json) ↓</a>
          </div>
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-bone/50">
          Recompute this yourself
        </div>
        <ol className="mt-3 list-inside list-decimal space-y-1.5 font-mono text-xs leading-relaxed text-bone/70">
          <li>Download the leaf set — every wallet and its TWAB at snapshot.</li>
          <li>Verify the leaf-set hash matches the on-chain commitment (posted before the draw).</li>
          <li>Take the VRF result from its transaction — the proof verifies on-chain.</li>
          <li>
            Run <Mono>select_winners(leaves, vrf_result)</Mono> from the public repo — the same
            deterministic function the program ran.
          </li>
          <li>Compare with the winners above. They must match exactly.</li>
        </ol>
      </section>

      <OrreryHud balanceSol={fx.balanceSol} />
    </div>
  );
}

export default function DrawsPage() {
  return (
    <Suspense>
      <DrawsInner />
    </Suspense>
  );
}
