"use client";

import { useMemo, useRef, useState } from "react";
import { calc, PARAMS } from "@/lib/calc";
import { simulateYear, type YearResult } from "@/lib/draw";
import { useSolPrice, priceTimeUtc, fmtUsd } from "@/lib/price";
import { APP_URL } from "@/lib/launch";
import { track } from "@/lib/analytics";
import CountUp from "@/components/CountUp";
import Magnetic from "@/components/Magnetic";

/**
 * TWO FUTURES (pass 5 §3) — same deposit, two lives. The left column is
 * designed to feel like nothing (that's the argument); the right column is
 * the same money with a door in it.
 *
 * THE SETTLED FRAME (§3.1, adjudicated with the owner — do not reopen):
 * EV including every weekly and Mega prize chance is D × apyNet in every
 * configuration — DOWN vs plain staking by exactly the fee. The pot is a
 * closed system funded entirely by depositors' yield; redistribution cannot
 * manufacture expectation. No surface here may claim or imply otherwise
 * (locked by scripts/calc.test.mjs). The pitch is the SHAPE: linear yield
 * cannot produce a life-changing outcome at any horizon; a skewed payout can.
 *
 * Dollars: live SOL/USD via Pyth (lib/price.ts). On feed failure the dollar
 * column HIDES — a wrong dollar figure is a lie with a decimal point (§3.5).
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

/**
 * §3.4 counsel gate: the head-to-head odds strip frames us against exactly the
 * classification counsel is deciding. It ships ONLY on explicit written
 * sign-off (set NEXT_PUBLIC_COUNSEL_STRIP=approved), never "temporarily".
 */
const COUNSEL_STRIP_APPROVED = process.env.NEXT_PUBLIC_COUNSEL_STRIP === "approved";

export default function Calculator() {
  const [t, setT] = useState(depositToSlider(25));
  // §4: default = epoch-1 scale. At 100k most year-sims render zero wins; 25k
  // is both the honest launch-scale default and the one where the game shows.
  const [tvl, setTvl] = useState<number>(PARAMS.tvlScenarios[0]);
  const [year, setYear] = useState<YearResult | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [stepMode, setStepMode] = useState(false);
  const yearRunsRef = useRef(0);
  const intervalRef = useRef(0);
  const price = useSolPrice();

  const deposit = Math.round(sliderToDeposit(t) * 10) / 10;
  const r = calc(deposit, tvl);
  const oneInN = Math.round(r.oneInN);
  const yearDone = year !== null && revealed >= 52;

  // The two futures, all from PARAMS (§3.5: one source of truth, still).
  const stakingYearly = deposit * PARAMS.stakingApy;
  const stakingWeekly = stakingYearly / 52;
  const stakingMonthly = stakingYearly / 12;
  const feeYearly = stakingYearly - r.routedYearly; // the EV gap — exactly the fee
  const feeWeekly = feeYearly / 52;
  const megaN = Math.round(1 / PARAMS.megaOddsPerWeek);

  const usd = price.usd;
  const inUsd = (sol: number) => (usd === null ? null : sol * usd);
  // §3.2 comparison anchor: what 1-in-200 at the CURRENT default 100k feels
  // like, for the epoch-1 framing line (§4).
  const atDefaultTvl = calc(deposit, PARAMS.tvlScenarios[1]);

  // §3.2 right sparkline: one actual simulated year at true odds — never a
  // drawn picture. Spikes are real Bernoulli outcomes from lib/draw.
  const spark = useMemo(() => simulateYear(deposit, tvl), [deposit, tvl]);
  const sparkMax = Math.max(
    r.avgPrize,
    ...spark.cells.map((c) => (c.personalMega ? c.megaPotAtHit : c.win ? c.prize : 0)),
  );

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

  /** A row in either future: label · SOL · dollars (hidden when feed is down).
   *  Pass 6 #19: below sm the label takes its own full-width line — the money
   *  argument must never shatter into orphaned fragments on a phone. */
  const Row = ({
    label,
    sol,
    solPrefix = "+",
    gold = false,
    note,
    value,
  }: {
    label: string;
    sol: number | null;
    solPrefix?: string;
    gold?: boolean;
    note?: string;
    /** Optional non-SOL value column (e.g. odds) — renders instead of SOL/$ */
    value?: React.ReactNode;
  }) => (
    <div className="py-1.5 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
      <span className="block min-w-0 text-sm text-bone/60">
        {label}
        {note && <span className="ml-2 text-[11px] text-gold/70">{note}</span>}
      </span>
      <span className="mt-0.5 flex items-baseline justify-end gap-4 font-mono tabular-nums sm:mt-0 sm:shrink-0">
        {value !== undefined ? (
          <span className={`text-base ${gold ? "text-gold" : "text-bone/80"}`}>{value}</span>
        ) : (
          <>
            {sol !== null && (
              <span className={`text-sm ${gold ? "text-gold/80" : "text-bone/50"}`}>
                {sol === 0 ? "0" : `${solPrefix}${fmtSol(sol, sol < 1 ? 3 : sol < 100 ? 2 : 0)}`}{" "}
                SOL
              </span>
            )}
            {usd !== null && sol !== null && (
              <span
                className={`text-right text-base sm:w-[7.5rem] ${gold ? "text-gold" : "text-bone/80"}`}
              >
                {solPrefix === "−" && sol !== 0 && "−"}
                {fmtUsd(sol * usd)}
              </span>
            )}
          </>
        )}
      </span>
    </div>
  );

  return (
    <section id="calculator" className="relative border-y border-bone/10 bg-steel/30 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone/60">
          Your numbers
        </div>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Two futures for the same deposit
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-bone/70">
          Slide your deposit. These are the same formulas the program uses —
          nothing hidden.
        </p>

        {/* deposit slider — glass orb on a gold rail, fill tracks the thumb (§5) */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between">
            <label htmlFor="deposit-slider" className="text-[11px] uppercase tracking-[0.18em] text-bone/50">
              Your deposit
            </label>
            {/* Pass 6 #17: an input echo may not be the loudest number in the
                section — demoted from 3xl so the outputs can lead. */}
            <div className="font-mono text-2xl text-bone tabular-nums">
              <CountUp value={deposit} decimals={1} />{" "}
              <span className="text-base text-bone/50">SOL</span>
              {usd !== null && (
                <span className="ml-3 text-base text-bone/45">
                  <CountUp value={deposit * usd} /> <span className="text-sm">USD</span>
                </span>
              )}
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
            style={{ "--fill": `${t * 100}%` } as React.CSSProperties}
            aria-valuetext={`${fmtSol(deposit, 1)} SOL`}
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-bone/55">
            <span>0.5</span>
            <span>10</span>
            <span>100</span>
            <span>1,000 SOL</span>
          </div>
        </div>

        {/* §4 TVL chips — vault size is an honest TRADE, not a ladder */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-bone/50">
            If the vault holds
          </span>
          {PARAMS.tvlScenarios.map((s, i) => (
            <button
              key={s}
              onClick={() => setTvl(s)}
              aria-pressed={tvl === s}
              className={`press-ripple press-scale rounded-full px-4 py-1.5 font-mono text-sm transition ${
                tvl === s
                  ? "bg-gold text-ink"
                  : "border border-bone/20 text-bone/60 hover:border-bone/50"
              }`}
            >
              {s.toLocaleString("en-US")} SOL
              {i === 0 && <span className="ml-1.5 text-[10px] opacity-70">launch-day size</span>}
            </button>
          ))}
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bone/60">
          Small vault: you win often, for less. Big vault: you win rarely, for
          life-changing money. Same expected value either way — they&apos;re
          just different games.
        </p>
        {tvl === PARAMS.tvlScenarios[0] && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone/60">
            Right now the vault is empty. At launch-day size your{" "}
            {fmtSol(deposit, 1)} SOL is a big fish in a small pond — a shot
            roughly every {oneInN.toLocaleString("en-US")} Sundays instead of
            every {Math.round(atDefaultTvl.oneInN).toLocaleString("en-US")} once
            the vault grows. That version of the game only exists once.{" "}
            <a
              href={APP_URL}
              className="link-quiet text-bone/80"
              onClick={() => track("cta_click", { cta: "calculator" })}
            >
              Open the vault →
            </a>
          </p>
        )}

        {/* live price line — dollars appear only while this is true (§3.5) */}
        <div className="mt-10 flex items-baseline justify-between gap-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bone/50">
            The two futures
          </div>
          <div className="font-mono text-[11px] text-bone/50">
            {usd !== null && price.publishMs !== null ? (
              <>
                SOL {fmtUsd(usd)} · <span className="text-signal">live</span> ·{" "}
                {priceTimeUtc(price.publishMs)} · Pyth
              </>
            ) : (
              <>SOL price feed unavailable — dollar figures hidden</>
            )}
          </div>
        </div>

        {/* §3.2 TWO FUTURES — same deposit, two lives */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* LEFT — designed to feel like nothing */}
          <div className="rounded-xl border border-bone/10 bg-ink/40 p-6 saturate-50">
            <div className="flex items-baseline justify-between">
              <h3 className="font-mono text-[12px] uppercase tracking-[0.25em] text-bone/55">
                Staking alone
              </h3>
              <span className="font-mono text-[11px] text-bone/45 tabular-nums">
                {fmtSol(deposit, 1)} SOL · {(PARAMS.stakingApy * 100).toFixed(0)}% APY
                {usd !== null && <> · {fmtUsd(deposit * usd)}</>}
              </span>
            </div>
            <div className="mt-4 divide-y divide-bone/5">
              <Row label="This week" sol={stakingWeekly} />
              <Row label="This month" sol={stakingMonthly} />
              <Row label="This year" sol={stakingYearly} />
            </div>
            <div className="mt-4 border-t border-bone/10 pt-3">
              <Row label="Best possible week" sol={stakingWeekly} solPrefix="" />
              <Row label="Worst possible week" sol={stakingWeekly} solPrefix="" />
            </div>
            {/* 52 identical bars. A flat line. This graphic IS the argument. */}
            <div className="mt-5 flex h-10 items-end gap-[2px]" aria-hidden>
              {Array.from({ length: 52 }, (_, i) => (
                <span key={i} className="h-[6px] flex-1 rounded-sm bg-bone/25" />
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] text-bone/45">
              52 weeks, every one identical. Certain. Silent.
            </p>
          </div>

          {/* RIGHT — the same money, breathing */}
          <div className="rounded-xl border border-gold/30 bg-ink/40 p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="font-mono text-[12px] uppercase tracking-[0.25em] text-gold/90">
                With VaultDrop
              </h3>
              <span className="font-mono text-[11px] text-bone/55">
                Same {fmtSol(deposit, 1)} SOL. Same {(PARAMS.stakingApy * 100).toFixed(0)}%. It just plays.
              </span>
            </div>
            <div className="mt-4 divide-y divide-bone/5">
              {/* Pass 6 #18: the number that moves when the slider moves sits
                  in the VALUE column — the tool visibly responds to its input. */}
              <Row
                label="Your shot each Sunday"
                sol={null}
                gold
                value={
                  <>
                    1 in <CountUp value={oneInN} />
                  </>
                }
              />
              <Row label="Most weeks" sol={0} gold />
              <Row label="A winning week pays on average" sol={r.avgPrize} gold />
              <p className="pb-1.5 pt-1 text-[11px] leading-snug text-bone/55">
                prizes tier per draw: 1 wins 50% of the pool · 5 win 5% · 25 win
                1% (locked protocol split)
              </p>
              {/* Pass 6 #5: the Mega row names its reference class — the VAULT
                  lands 1-in-26; your share of that landing is stated, never
                  implied. It must not read as personal odds of the jackpot. */}
              <Row
                label={`The vault's Mega — lands ≈ 1 Sunday in ${megaN}`}
                sol={r.megaAvgAtHit}
                gold
              />
              <p className="pb-1.5 pt-1 text-[11px] leading-snug text-bone/55">
                if it lands on a Sunday you&apos;re in, your ticket&apos;s share of
                winning it ≈ 1-in-
                {Math.round(tvl / deposit).toLocaleString("en-US")} at this deposit
              </p>
            </div>
            <div className="mt-4 border-t border-gold/20 pt-3">
              {/* Pass 6 #16: bounds, not outcomes — these must never read as
                  what the sparkline's simulated year produced. */}
              <Row label="Best possible week" sol={r.megaAvgAtHit} solPrefix="" gold />
              <div className="py-1.5 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
                <span className="block text-sm text-bone/60">Worst possible week</span>
                <span className="mt-0.5 flex justify-end font-mono text-base text-bone/80 tabular-nums sm:mt-0">
                  {usd !== null ? "$0" : "0 SOL"}
                  <span className="ml-2 text-[11px] leading-relaxed text-bone/55">
                    — and you still have your {fmtSol(deposit, 1)} SOL
                  </span>
                </span>
              </div>
            </div>
            <p className="mt-2 font-mono text-[11px] text-bone/60 tabular-nums">
              ≈ <CountUp value={r.pYear * 100} decimals={1} />% chance of at least one
              win this year · {PARAMS.winnersPerDraw} winners weekly from a ≈{" "}
              <CountUp value={r.weeklyPool} /> SOL pool
            </p>
            {/* one actual simulated year at true odds — spikes are real draws */}
            <div className="mt-5 flex h-10 items-end gap-[2px]" aria-hidden>
              {spark.cells.map((c) => {
                const v = c.personalMega ? c.megaPotAtHit : c.win ? c.prize : 0;
                const hpx = v === 0 ? 6 : Math.max(10, Math.round(Math.sqrt(v / sparkMax) * 40));
                return (
                  <span
                    key={c.week}
                    className={`flex-1 rounded-sm ${
                      c.personalMega ? "bg-signal" : c.win ? "bg-gold" : "bg-bone/25"
                    }`}
                    style={{ height: hpx }}
                  />
                );
              })}
            </div>
            <p className="mt-2 font-mono text-[10px] text-bone/45">
              One simulated year at true odds (demo) — drag the slider and it re-rolls.
              {spark.wins === 0 && !spark.personalMegaWin && " This one hit nothing. That happens."}
            </p>
          </div>
        </div>

        {/* Pass 6 #17: the decision strip — three numbers in display type, so
            a 5-second scanner leaves with the actual decision: the cost, the
            cadence, the ceiling. All derived; the cost stays framed as cost. */}
        <div className="mt-6 grid gap-6 rounded-xl border border-bone/10 bg-ink/30 p-6 sm:grid-cols-3">
          <div>
            <div className="font-display text-3xl font-semibold tracking-tight text-bone sm:text-4xl">
              {usd !== null ? `${fmtUsd(feeWeekly * usd)}/wk` : `${fmtSol(feeWeekly, 4)} SOL/wk`}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">
              the whole cost — the fee, nothing else
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-semibold tracking-tight text-bone sm:text-4xl">
              ≈<CountUp value={r.pYear * 100} decimals={r.pYear >= 0.995 ? 1 : 0} />%
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">
              chance of at least one win this year
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-semibold tracking-tight text-gold sm:text-4xl">
              {usd !== null ? fmtUsd(r.megaAvgAtHit * usd) : `${fmtSol(r.megaAvgAtHit, 0)} SOL`}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gold/60">
              the Mega ceiling · your share ≈1-in-
              {Math.round(tvl / deposit).toLocaleString("en-US")} when it lands
            </div>
          </div>
        </div>

        {/* §3.3 the honest ledger — the EV panel. EV is DOWN by exactly the
            fee, stated plainly. Never "up", never "break-even". */}
        <div className="mt-4 rounded-xl border border-bone/15 bg-ink/50 p-6">
          <h3 className="font-mono text-[12px] uppercase tracking-[0.25em] text-bone/55">
            What it actually costs you
          </h3>
          <div className="mt-3 max-w-xl divide-y divide-bone/5">
            <Row label="Staking pays you" sol={stakingYearly} solPrefix="" />
            <Row
              label="VaultDrop routes to prizes"
              sol={r.routedYearly}
              solPrefix=""
              note="← your expected take"
            />
            <Row
              label="The difference — that's the fee"
              sol={feeYearly}
              solPrefix="−"
            />
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bone/70">
            {usd !== null ? (
              <>
                <span className="text-bone">
                  {fmtUsd(feeWeekly * usd)} a week is the whole price of the game.
                </span>{" "}
                It buys 52 weekly shots (1 in {oneInN.toLocaleString("en-US")}) at an average{" "}
                {fmtUsd(inUsd(r.avgPrize)!)}, and your 1-in-
                {Math.round(tvl / deposit).toLocaleString("en-US")} share of the ~2
                Mega landings a year at {fmtUsd(inUsd(r.megaAvgAtHit)!)}. Your{" "}
                {fmtUsd(deposit * usd)} never moves, and you can withdraw it any
                time.
              </>
            ) : (
              <>
                <span className="text-bone">
                  {fmtSol(feeWeekly, 4)} SOL a week is the whole price of the game.
                </span>{" "}
                It buys 52 weekly shots (1 in {oneInN.toLocaleString("en-US")}) at an average{" "}
                {fmtSol(r.avgPrize)} SOL, and your 1-in-
                {Math.round(tvl / deposit).toLocaleString("en-US")} share of the ~2
                Mega landings a year at {fmtSol(r.megaAvgAtHit, 0)} SOL. Your{" "}
                {fmtSol(deposit, 1)} SOL never moves, and you can withdraw it any
                time.
              </>
            )}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bone/60">
            No amount of {(PARAMS.stakingApy * 100).toFixed(0)}% will ever change
            your life — linear yield can&apos;t produce a life-changing outcome
            at any horizon. A skewed payout is the only mechanism that turns
            small savings into large sums, and here the ticket doesn&apos;t cost
            you the deposit.
          </p>
        </div>

        {/* §3.4 — counsel-gated comparison strip. OFF absent written sign-off. */}
        {COUNSEL_STRIP_APPROVED && usd !== null && (
          <div className="mt-4 rounded-xl border border-bone/15 bg-ink/50 p-6 font-mono text-sm">
            <div className="grid grid-cols-[1fr_auto_auto_1fr] items-baseline gap-x-6 gap-y-2 tabular-nums">
              <span className="text-bone/70">A Powerball ticket</span>
              <span>$2.00</span>
              <span>1 in 292,000,000</span>
              <span className="text-bone/55">your money is gone</span>
              <span className="text-gold/90">A VaultDrop week</span>
              <span className="text-gold">{fmtUsd(feeWeekly * usd)}</span>
              <span className="text-gold">
                1 in {oneInN.toLocaleString("en-US")} (+1 in {megaN} Mega)
              </span>
              <span className="text-bone/70">your deposit is still yours</span>
            </div>
          </div>
        )}

        {/* §5.1 — Simulate my year: the repeatable variable-reward loop */}
        <div className="mt-10">
          <Magnetic>
            <button
              onClick={runYear}
              className="press-ripple press-scale rounded-full border border-gold/50 px-6 py-2.5 font-medium text-gold transition hover:bg-gold hover:text-ink"
            >
              {year ? "Run it again" : "Simulate my year"}
            </button>
          </Magnetic>

          {year && (
            <div className="mt-8" aria-live="polite">
              {/* §3.7: 52 Sundays at ≥24×32px — WINs unmistakable at a glance.
                  §5: each run wipes clean left→right before refilling. */}
              <div
                key={yearRunsRef.current}
                className="strip-wipe flex flex-wrap items-end gap-1"
                aria-hidden
              >
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
                              ? `year-pop year-burst bg-gold text-ink ${
                                  c.megaHit ? "ring-2 ring-[#d07a27]/80" : ""
                                }`
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
                  className="press-scale mt-3 rounded-full border border-bone/30 px-4 py-1.5 font-mono text-xs text-bone/80 transition hover:border-gold/60"
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
                  <CountUp value={yearDone ? year.totalSol : 0} decimals={1} /> SOL
                  {usd !== null && yearDone && (
                    <span className="text-gold"> ({fmtUsd(year.totalSol * usd)})</span>
                  )}{" "}
                  · principal untouched: {fmtSol(deposit, 1)} SOL
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
                {/* Pass 6 #16: Two Futures shows both futures to the end —
                    the counterfactual is stated, and it keeps EV-down visible. */}
                {yearDone && (
                  <span className="block text-bone/50">
                    Staking alone that same year: +{fmtSol(stakingYearly)} SOL
                    {usd !== null && <> ({fmtUsd(stakingYearly * usd)})</>} — certain, and
                    capped there.
                  </span>
                )}
              </p>
              {/* Pass 6 #9: peak conviction gets an action within reach. */}
              {yearDone && (
                <a
                  href={APP_URL}
                  onClick={() => track("cta_click", { cta: "yearsim" })}
                  className="press-scale mt-5 inline-block rounded-full border border-gold/50 px-5 py-2 font-mono text-sm text-gold transition hover:bg-gold hover:text-ink"
                >
                  Make it real — enter the vault →
                </a>
              )}
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
            steady balance held the full week. Dollar figures use the live Pyth
            SOL/USD price shown above and hide when the feed is unavailable.
          </p>
        </div>
      </div>
    </section>
  );
}
