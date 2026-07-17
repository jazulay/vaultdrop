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

const CELL_STAGGER_MS = 110; // 52 cells ≈ 6s fill (§5.1)

export default function Calculator() {
  const [t, setT] = useState(depositToSlider(25));
  const [tvl, setTvl] = useState<number>(PARAMS.tvlScenarios[1]);
  const [year, setYear] = useState<YearResult | null>(null);
  const [yearDone, setYearDone] = useState(false);
  const yearRunsRef = useRef(0);
  const yearTimerRef = useRef(0);

  const deposit = Math.round(sliderToDeposit(t) * 10) / 10;
  const r = calc(deposit, tvl);
  const oneInN = Math.round(r.oneInN);

  const runYear = () => {
    window.clearTimeout(yearTimerRef.current);
    const result = simulateYear(deposit, tvl);
    yearRunsRef.current += 1;
    track("year_sim_run", { count: yearRunsRef.current, deposit, tvl });
    setYear(result);
    setYearDone(false);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    yearTimerRef.current = window.setTimeout(
      () => setYearDone(true),
      reduced ? 0 : 52 * CELL_STAGGER_MS + 400,
    );
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
            <div className="mt-6" aria-live="polite">
              <div className="flex flex-wrap items-end gap-[3px]" aria-hidden>
                {year.cells.map((c, i) => (
                  <div key={`${i}-${year.wins}-${year.totalSol}`} className="relative">
                    {c.win && (
                      <span
                        className="year-cell absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-gold"
                        style={{ animationDelay: `${i * CELL_STAGGER_MS}ms` }}
                      >
                        WIN +{c.prize.toFixed(1)}
                      </span>
                    )}
                    <div
                      className={`year-cell h-6 w-2 rounded-sm sm:w-2.5 ${
                        c.personalMega
                          ? "year-cell-win bg-signal"
                          : c.megaHit
                            ? "year-cell-win bg-gold ring-1 ring-gold/70"
                            : c.win
                              ? "year-cell-win bg-gold"
                              : "bg-bone/15"
                      }`}
                      style={{ animationDelay: `${i * CELL_STAGGER_MS}ms` }}
                      title={`week ${c.week}${c.win ? ` — win +${c.prize.toFixed(1)} SOL` : ""}${c.megaHit ? " — vault Mega landed" : ""}${c.personalMega ? " — YOUR Mega win" : ""}`}
                    />
                  </div>
                ))}
              </div>
              <p
                className={`mt-4 font-mono text-sm transition-opacity duration-500 ${
                  yearDone ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="text-bone">
                  Your year: {year.wins} win{year.wins === 1 ? "" : "s"} ·{" "}
                  {year.totalSol.toLocaleString("en-US", { maximumFractionDigits: 1 })} SOL ·
                  principal untouched: {fmtSol(deposit, 1)} SOL
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
