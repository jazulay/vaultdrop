"use client";

import { useRef, useState } from "react";
import { calc, PARAMS } from "@/lib/calc";
import { simulateYear, type YearResult } from "@/lib/draw";
import { track } from "@/lib/analytics";
import CountUp from "@/components/CountUp";

/**
 * TICKET CALCULATOR (audit §7.2) — the flagship new component.
 * Log-scale deposit slider (glass orb on a gold rail) + TVL scenario chips.
 * All parameters are PLACEHOLDER until the program team confirms; the panel
 * says so plainly. Math unit-tested in scripts/calc.test.mjs.
 */

const MIN = 0.5;
const MAX = 1000;
const fmtSol = (n: number, d = 2) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });

function sliderToDeposit(t: number): number {
  // log scale 0..1 → 0.5..1000
  return MIN * Math.pow(MAX / MIN, t);
}
function depositToSlider(d: number): number {
  return Math.log(d / MIN) / Math.log(MAX / MIN);
}

const CELL_MS = 115; // §3.7: 52 cells × 115ms = 6.0s — the tempo IS the anticipation

export default function Calculator() {
  const [t, setT] = useState(depositToSlider(25));
  const [tvl, setTvl] = useState<number>(PARAMS.tvlScenarios[1]);
  const [year, setYear] = useState<YearResult | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [stepMode, setStepMode] = useState(false);
  const yearRunsRef = useRef(0);
  const intervalRef = useRef(0);

  const deposit = Math.round(sliderToDeposit(t) * 10) / 10;
  const r = calc(deposit, tvl);
  const oneInN = Math.round(r.oneInN);
  const yearDone = year !== null && revealed >= 52;

  const runYear = () => {
    window.clearInterval(intervalRef.current);
    const result = simulateYear(deposit, tvl);
    yearRunsRef.current += 1;
    track("year_sim_run", { count: yearRunsRef.current, deposit, tvl });
    setYear(result);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // §5 reduced-motion parity: end state instantly + a step-through control.
      setStepMode(true);
      setRevealed(52);
      return;
    }
    setStepMode(false);
    setRevealed(0);
    intervalRef.current = window.setInterval(() => {
      setRevealed((n) => {
        if (n + 1 >= 52) window.clearInterval(intervalRef.current);
        return n + 1;
      });
    }, CELL_MS);
  };

  const stepThrough = () => {
    if (!year) return;
    setRevealed((n) => (n >= 52 ? 1 : n + 1));
  };

  return (
    <section id="calculator" className="relative border-y border-bone/10 bg-steel/30 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone/60">
          Your numbers
        </div>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          What does your stake turn into?
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-bone/70">
          Slide your deposit. These are the same formulas the program uses —
          nothing hidden.
        </p>

        {/* deposit slider — glass orb on a gold rail */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between">
            <label htmlFor="deposit-slider" className="text-[11px] uppercase tracking-[0.18em] text-bone/50">
              Your deposit
            </label>
            <div className="font-mono text-3xl text-bone" style={{ fontVariantNumeric: "tabular-nums" }}>
              {fmtSol(deposit, 1)} <span className="text-lg text-bone/50">SOL</span>
            </div>
          </div>
          <input
            id="deposit-slider"
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
            className="orb-slider mt-4 w-full"
            aria-valuetext={`${fmtSol(deposit, 1)} SOL`}
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-bone/55">
            <span>0.5</span>
            <span>10</span>
            <span>100</span>
            <span>1,000 SOL</span>
          </div>
        </div>

        {/* TVL scenario chips */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-bone/50">
            If the vault holds
          </span>
          {PARAMS.tvlScenarios.map((s) => (
            <button
              key={s}
              onClick={() => setTvl(s)}
              aria-pressed={tvl === s}
              className={`rounded-full px-4 py-1.5 font-mono text-sm transition ${
                tvl === s
                  ? "bg-gold text-ink"
                  : "border border-bone/20 text-bone/60 hover:border-bone/50"
              }`}
            >
              {s.toLocaleString("en-US")} SOL
            </button>
          ))}
        </div>

        {/* results */}
        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="glass rounded-xl p-5">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-bone/50">
              Your yield routed to prizes
            </dt>
            <dd className="mt-1 font-mono text-2xl text-gold">
              <CountUp value={r.routedYearly} decimals={2} />{" "}
              <span className="text-sm text-gold/60">SOL / yr</span>
            </dd>
          </div>
          <div className="glass rounded-xl p-5">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-bone/50">
              Your shot this Sunday
            </dt>
            <dd className="mt-1 font-mono text-2xl text-gold">
              ≈ 1 in <CountUp value={oneInN} />
            </dd>
            <dd className="mt-1 font-mono text-[11px] text-bone/60">
              ≈ <CountUp value={r.pYear * 100} decimals={1} />% chance of at least one win
              this year
            </dd>
          </div>
          <div className="glass rounded-xl p-5">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-bone/50">
              Average weekly prize
            </dt>
            <dd className="mt-1 font-mono text-2xl text-bone">
              ≈ <CountUp value={r.avgPrize} decimals={2} />{" "}
              <span className="text-sm text-bone/50">SOL</span>
            </dd>
            <dd className="mt-1 font-mono text-[11px] text-bone/60">
              from a ≈ <CountUp value={r.weeklyPool} /> SOL pool · {PARAMS.winnersPerDraw}{" "}
              winners
            </dd>
          </div>
          <div className="glass rounded-xl p-5">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-gold/80">
              Mega Vault, when it lands
            </dt>
            <dd className="mt-1 font-mono text-2xl text-gold">
              ≈ <CountUp value={r.megaAvgAtHit} />{" "}
              <span className="text-sm text-gold/60">SOL</span>
            </dd>
            <dd className="mt-1 font-mono text-[11px] text-bone/60">
              averages ~2 hits a year at 1-in-26 weekly
            </dd>
          </div>
        </dl>

        {/* §5.1 — Simulate my year: the repeatable variable-reward loop */}
        <div className="mt-10">
          <button
            onClick={runYear}
            className="press-ripple rounded-full border border-gold/50 px-6 py-2.5 font-medium text-gold transition hover:bg-gold hover:text-ink"
          >
            {year ? "Run it again" : "Simulate my year"}
          </button>

          {year && (
            <div className="mt-8" aria-live="polite">
              {/* §3.7: 52 Sundays at ≥24×32px — WINs unmistakable at a glance */}
              <div className="flex flex-wrap items-end gap-1" aria-hidden>
                {year.cells.map((c, i) => {
                  const shown = i < revealed;
                  const winCell = c.win || c.personalMega;
                  return (
                    <div
                      key={`${yearRunsRef.current}-${i}`}
                      className={`relative flex h-8 w-6 items-center justify-center rounded-md font-mono text-[9px] transition-opacity ${
                        !shown
                          ? "opacity-0"
                          : c.personalMega
                            ? "year-pop bg-signal text-ink"
                            : winCell
                              ? "year-pop year-burst bg-gold text-ink"
                              : c.megaHit
                                ? "year-pop border border-[#d07a27]/70 bg-[#d07a27]/25 text-bone/70"
                                : "year-pop bg-steel/70 text-bone/30"
                      }`}
                      title={`week ${c.week}${c.win ? ` — win +${c.prize.toFixed(1)} SOL` : ""}${c.megaHit ? " — vault Mega landed" : ""}${c.personalMega ? " — YOUR Mega win" : ""}`}
                    >
                      {shown && (winCell ? `+${c.prize.toFixed(1)}` : c.megaHit ? "M" : "·")}
                    </div>
                  );
                })}
              </div>
              {stepMode && (
                <button
                  onClick={stepThrough}
                  className="mt-3 rounded-full border border-bone/30 px-4 py-1.5 font-mono text-xs text-bone/80 transition hover:border-gold/60"
                >
                  Step through week by week ({Math.min(revealed, 52)}/52)
                </button>
              )}
              <p
                className={`mt-4 font-mono text-sm transition-opacity duration-500 ${
                  yearDone ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="text-bone">
                  Your year: <CountUp value={yearDone ? year.wins : 0} /> win
                  {year.wins === 1 ? "" : "s"} ·{" "}
                  <CountUp value={yearDone ? year.totalSol : 0} decimals={1} /> SOL · principal
                  untouched: {fmtSol(deposit, 1)} SOL
                </span>{" "}
                <span className="text-bone/50">(demo, real odds)</span>
                {year.megaHits > 0 && (
                  <span className="block text-bone/60">
                    The vault&apos;s Mega landed {year.megaHits}× that year
                    {year.personalMegaWin ? (
                      <span className="text-signal"> — and one of them was YOURS.</span>
                    ) : (
                      " — someone else's week."
                    )}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <div className="font-mono text-sm text-signal">
            Principal at risk in the draw: 0 SOL
          </div>
          <p className="max-w-2xl text-sm italic leading-relaxed text-bone/55">
            Over time, expected value ≈ the yield you route in, minus the
            protocol fee. What changes is the shape: instead of a drip, you hold
            a shot.
          </p>
          <p className="font-mono text-[10px] text-bone/55">
            Illustrative — final protocol parameters (APY feed, fee, winner
            count, Mega share) are confirmed at launch. Odds share assumes a
            steady balance held the full week.
          </p>
        </div>
      </div>
    </section>
  );
}
