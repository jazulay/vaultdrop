"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CYCLE,
  DEMO_VAULT_SOL,
  drawOnce,
  initialDemoMegaPot,
  megaWeeklyAccrual,
  rejectionInt,
  type DrawOutcome,
} from "@/lib/draw";
import { calc } from "@/lib/calc";
import { CTA } from "@/lib/launch";
import { track } from "@/lib/analytics";
import Magnetic from "@/components/Magnetic";

/**
 * THE DEMO DRAW (pass 3 §4) — the hero becomes the game. A simulated draw of
 * a 100,000-SOL demo vault resolves every 30s at true odds from PARAMS.
 *
 * Honesty rails (§4.4): SIMULATION chip whenever simulated content is on
 * screen; crypto RNG only (lib/draw); zero outcome-rigging (statistical
 * self-test in scripts/draw.test.mjs); the other orbs are explicitly "the rest
 * of a 100,000 SOL demo vault" — never invented people.
 *
 * Reduced motion (§4.5): no autoplaying animation of any kind; a "Run one
 * draw" button renders a static result card instead. Loop pauses when the
 * hero is off-screen, docked to PiP, or the tab is hidden.
 */

type Phase = "orbit" | "charge" | "resolve" | "settle";
const PHASE_ORDER: Phase[] = ["orbit", "charge", "resolve", "settle"];

const AMOUNT_CHIPS = [5, 25, 100, 1000] as const;
const fmt = (n: number, d = 1) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });

interface DemoDrawState {
  phase: Phase;
  countdownMs: number;
  pot: number;
  epoch: number;
  deposit: number | null;
  outcome: DrawOutcome | null;
  ignition: boolean;
  ignitionPot: number;
  resultLine: string;
  announce: string;
  sessionDraws: number;
  sessionMegaGrowth: number;
  participatedResolved: boolean;
  reduced: boolean;
  active: boolean;
  poolSol: number;
  megaGrowth: number;
  join: (amount: number) => void;
  leave: () => void;
  runStaticDraw: () => void;
  staticResult: DrawOutcome | null;
  setInView: (v: boolean) => void;
}

const Ctx = createContext<DemoDrawState | null>(null);
export const useDemoDraw = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemoDraw outside provider");
  return v;
};

export function DemoDrawProvider({
  docked,
  children,
}: {
  docked: boolean;
  children: React.ReactNode;
}) {
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [phase, setPhase] = useState<Phase>("orbit");
  const [countdownMs, setCountdownMs] = useState(CYCLE.orbit + CYCLE.charge);
  const [pot, setPot] = useState(0);
  const [epoch, setEpoch] = useState(-52);
  const [deposit, setDeposit] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<DrawOutcome | null>(null);
  const [ignition, setIgnition] = useState(false);
  const [ignitionPot, setIgnitionPot] = useState(0);
  const [resultLine, setResultLine] = useState("");
  const [announce, setAnnounce] = useState("");
  const [sessionDraws, setSessionDraws] = useState(0);
  const [sessionMegaGrowth, setSessionMegaGrowth] = useState(0);
  const [participatedResolved, setParticipatedResolved] = useState(false);
  const [staticResult, setStaticResult] = useState<DrawOutcome | null>(null);

  const depositRef = useRef(deposit);
  depositRef.current = deposit;
  const potRef = useRef(pot);
  potRef.current = pot;
  const epochRef = useRef(epoch);
  epochRef.current = epoch;
  const drawsWatchedRef = useRef(0);

  const active = !reduced && !docked && inView && !hidden;
  const activeRef = useRef(active);
  activeRef.current = active;

  // Static figures every HUD line derives from (§4.1: single source of truth).
  const poolSol = useMemo(() => calc(1, DEMO_VAULT_SOL).weeklyPool, []);
  const megaGrowth = useMemo(() => megaWeeklyAccrual(DEMO_VAULT_SOL), []);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setPot(initialDemoMegaPot());
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const resolveDraw = useCallback(() => {
    const o = drawOnce(depositRef.current);
    setOutcome(o);
    drawsWatchedRef.current += 1;
    track("demo_draw_watched", { count: drawsWatchedRef.current });

    if (o.megaHit) {
      setIgnition(true);
      setIgnitionPot(Math.round(potRef.current));
      track("mega_ignition_seen", { pot: Math.round(potRef.current) });
      window.setTimeout(() => setIgnition(false), 2600);
    }
    if (depositRef.current !== null) {
      setSessionDraws((n) => n + 1);
      setParticipatedResolved(true);
      if (o.personalWin) {
        track("demo_personal_win", { deposit: depositRef.current, prize: o.personalPrize });
      }
    }
    if (!o.megaHit) setSessionMegaGrowth((g) => g + o.megaGrowth);

    const potNow = Math.round(potRef.current);
    const personal =
      depositRef.current === null
        ? ""
        : o.personalWin
          ? ` · YOU WON ${fmt(o.personalPrize)} SOL (demo)`
          : " · not this one — your odds carry";
    setAnnounce(
      o.megaHit
        ? `Demo draw resolved: Mega Vault hit, ${fmt(potNow, 0)} demo SOL. ${o.winners} weekly winners.${personal}`
        : `Demo draw resolved: ${o.winners} winners from a ${fmt(o.poolSol, 0)} SOL demo pool. Mega grew ${fmt(o.megaGrowth)}.${personal}`,
    );
    setResultLine(
      `demo epoch ${epochRef.current} · ${fmt(o.poolSol)} SOL · ${o.winners} winners · odds honored ✓`,
    );
    setEpoch((e) => (e >= -1 ? -52 : e + 1));
    // Pot: hit pays out and resets; miss accrues one demo week.
    setPot((p) => (o.megaHit ? 0 : p + o.megaGrowth));
  }, []);

  // Phase scheduler — setTimeout chain, pausable by simply not advancing while
  // inactive (remaining time is preserved).
  const remainingRef = useRef<number>(CYCLE.orbit);
  useEffect(() => {
    if (reduced) return;
    let timer: number | null = null;
    let phaseStartedAt = performance.now();
    let currentPhase: Phase = phase;

    const advance = () => {
      const idx = PHASE_ORDER.indexOf(currentPhase);
      currentPhase = PHASE_ORDER[(idx + 1) % PHASE_ORDER.length];
      setPhase(currentPhase);
      if (currentPhase === "resolve") resolveDraw();
      remainingRef.current = CYCLE[currentPhase];
      phaseStartedAt = performance.now();
      timer = window.setTimeout(advance, remainingRef.current);
    };

    if (activeRef.current) {
      phaseStartedAt = performance.now();
      timer = window.setTimeout(advance, remainingRef.current);
    }
    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        remainingRef.current = Math.max(
          250,
          remainingRef.current - (performance.now() - phaseStartedAt),
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduced, resolveDraw]);

  // Countdown ticker (to the end of CHARGE — the moment of lock).
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      setCountdownMs(() => {
        if (phase === "orbit") {
          return remainingElapsed() + CYCLE.charge;
        }
        if (phase === "charge") return remainingElapsed();
        return 0;
      });
    };
    // remaining time in the current phase, approximated from the scheduler ref
    let last = performance.now();
    let rem = remainingRef.current;
    const remainingElapsed = () => {
      const now = performance.now();
      rem -= now - last;
      last = now;
      return Math.max(0, rem);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [active, phase]);

  const join = useCallback((amount: number) => {
    setDeposit(amount);
    track("demo_orb_added", { amount });
  }, []);
  const leave = useCallback(() => setDeposit(null), []);

  // Reduced-motion path (§4.5): one static draw per press, full agency.
  const runStaticDraw = useCallback(() => {
    const o = drawOnce(depositRef.current);
    setStaticResult(o);
    drawsWatchedRef.current += 1;
    track("demo_draw_watched", { count: drawsWatchedRef.current, static: true });
    if (depositRef.current !== null) {
      setParticipatedResolved(true);
      if (o.personalWin)
        track("demo_personal_win", { deposit: depositRef.current, prize: o.personalPrize });
    }
    if (o.megaHit) track("mega_ignition_seen", { pot: Math.round(potRef.current), static: true });
    setPot((p) => (o.megaHit ? 0 : p + o.megaGrowth));
    setAnnounce(
      `Demo draw resolved: ${o.winners} winners from a ${fmt(o.poolSol, 0)} SOL demo pool.` +
        (depositRef.current !== null
          ? o.personalWin
            ? ` You won ${fmt(o.personalPrize)} demo SOL.`
            : " Not this one — your odds carry."
          : ""),
    );
  }, []);

  const value: DemoDrawState = {
    phase,
    countdownMs,
    pot,
    epoch,
    deposit,
    outcome,
    ignition,
    ignitionPot,
    resultLine,
    announce,
    sessionDraws,
    sessionMegaGrowth,
    participatedResolved,
    reduced,
    active,
    poolSol,
    megaGrowth,
    join,
    leave,
    runStaticDraw,
    staticResult,
    setInView,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ------------------------------------------------------------------ */
/* Stage — orbs, HUD, flash, ignition, settle line                     */
/* ------------------------------------------------------------------ */

interface Orb {
  ring: number;
  theta0: number;
  speed: number; // rad/s
  size: number;
  winner: boolean;
  showPop: boolean;
}

const RINGS = [
  { rx: 0.24, ry: 0.1, cy: 0.52 },
  { rx: 0.33, ry: 0.14, cy: 0.53 },
  { rx: 0.42, ry: 0.18, cy: 0.54 },
];

function makeOrbs(count: number): Orb[] {
  return Array.from({ length: count }, (_, i) => ({
    ring: i % 3,
    theta0: (i / count) * Math.PI * 2 + rejectionInt(100) / 100,
    speed: 0.1 + rejectionInt(100) / 1000, // 0.10–0.20 rad/s
    size: 8 + rejectionInt(6),
    winner: false,
    showPop: false,
  }));
}

export function DemoDrawStage() {
  const s = useDemoDraw();
  const stageRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const youRef = useRef<HTMLDivElement>(null);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const speedMulRef = useRef(1);
  const phaseRef = useRef(s.phase);
  phaseRef.current = s.phase;

  // Orb field size by viewport (§4.5 mobile: fewer orbs).
  useEffect(() => {
    const small = window.matchMedia("(max-width: 640px)").matches;
    const initial = makeOrbs(small ? 12 : 22);
    orbsRef.current = initial;
    setOrbs(initial);
  }, []);

  // In-view gate for the whole loop.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => s.setInView(entries.some((e) => e.isIntersecting)),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Crown assignment on resolve; clear on the next orbit.
  useEffect(() => {
    if (s.phase === "resolve") {
      const field = orbsRef.current;
      const crowns = Math.min(6, field.length); // visual shorthand for 20 winners
      const picked = new Set<number>();
      while (picked.size < crowns) picked.add(rejectionInt(field.length));
      let pops = 0;
      field.forEach((o, i) => {
        o.winner = picked.has(i);
        o.showPop = o.winner && pops++ < 3;
      });
      setOrbs([...field]);
    } else if (s.phase === "orbit") {
      const field = orbsRef.current;
      field.forEach((o) => {
        o.winner = false;
        o.showPop = false;
      });
      setOrbs([...field]);
    }
  }, [s.phase]);

  // rAF positional loop — transforms only, paused when inactive.
  useEffect(() => {
    if (!s.active) return;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      // CHARGE accelerates 1→4×, RESOLVE holds, SETTLE decays.
      const target =
        phaseRef.current === "charge" ? 4 : phaseRef.current === "resolve" ? 2.5 : 1;
      speedMulRef.current += (target - speedMulRef.current) * Math.min(1, dt * 3);
      t += dt * speedMulRef.current;

      const el = stageRef.current;
      if (el) {
        const w = el.clientWidth;
        const h = el.clientHeight;
        orbsRef.current.forEach((o, i) => {
          const node = orbRefs.current[i];
          if (!node) return;
          const ring = RINGS[o.ring];
          const th = o.theta0 + t * o.speed * (1 + o.ring * 0.15);
          const x = w * 0.5 + Math.cos(th) * ring.rx * w;
          const y = h * ring.cy + Math.sin(th) * ring.ry * h;
          node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
          node.style.zIndex = Math.sin(th) > 0 ? "3" : "1";
        });
        const you = youRef.current;
        if (you) {
          const ring = RINGS[1];
          const th = Math.PI / 2 + t * 0.14;
          const x = w * 0.5 + Math.cos(th) * ring.rx * w;
          const y = h * ring.cy + Math.sin(th) * ring.ry * h;
          you.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
          you.style.zIndex = Math.sin(th) > 0 ? "4" : "2";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [s.active]);

  const secs = Math.ceil(s.countdownMs / 1000);
  const countdownText = `0:${String(Math.max(0, secs)).padStart(2, "0")}`;
  const dimField = s.phase === "resolve" || s.phase === "settle";
  const rawOdds = s.deposit !== null ? calc(s.deposit, DEMO_VAULT_SOL).oneInN : null;
  const personalOdds =
    rawOdds === null ? null : rawOdds < 10 ? Math.round(rawOdds * 10) / 10 : Math.round(rawOdds);

  return (
    <div ref={stageRef} className="pointer-events-none absolute inset-0">
      {/* aria-live announcements (§4.5) — must never sit under aria-hidden */}
      <div aria-live="polite" className="sr-only">
        {s.announce}
      </div>

      {!s.reduced && (
        <div aria-hidden className="absolute inset-0">
          {/* orb field */}
          {orbs.map((o, i) => (
            <div
              key={i}
              ref={(n) => {
                orbRefs.current[i] = n;
              }}
              className="demo-orb absolute left-0 top-0"
              style={{
                width: o.size,
                height: o.size,
                opacity: dimField && !o.winner ? 0.45 : 0.9,
                filter: phaseRef.current === "charge" ? "blur(0.5px) brightness(1.3)" : undefined,
              }}
            >
              {o.winner && s.phase !== "orbit" && (
                <svg viewBox="0 0 12 8" className="absolute -top-3 left-1/2 h-2.5 w-3.5 -translate-x-1/2 text-gold" fill="currentColor" aria-hidden>
                  <path d="M0 8 L1.5 2 L4 5 L6 0 L8 5 L10.5 2 L12 8 Z" />
                </svg>
              )}
              {o.showPop && s.phase !== "orbit" && (
                <span className="demo-pop absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-gold">
                  +{fmt(s.outcome?.personalPrize ?? 0)}
                </span>
              )}
            </div>
          ))}

          {/* the visitor's orb */}
          {s.deposit !== null && (
            <div ref={youRef} className="demo-orb-you absolute left-0 top-0 h-4 w-4">
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.2em] text-signal">
                YOU
              </span>
              {s.phase !== "orbit" && s.outcome?.personalWin && (
                <svg viewBox="0 0 12 8" className="absolute -top-9 left-1/2 h-3 w-4 -translate-x-1/2 text-gold" fill="currentColor" aria-hidden>
                  <path d="M0 8 L1.5 2 L4 5 L6 0 L8 5 L10.5 2 L12 8 Z" />
                </svg>
              )}
            </div>
          )}

          {/* core flash on resolve */}
          <div
            className={`absolute left-1/2 top-[52%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity ${
              s.phase === "resolve" ? "demo-flash opacity-100" : "opacity-0"
            }`}
            style={{
              background:
                "radial-gradient(circle, rgba(201,162,39,0.5) 0%, rgba(201,162,39,0.15) 45%, transparent 70%)",
            }}
          />

          {/* settle line */}
          <div
            className={`absolute bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] tracking-[0.1em] text-bone/70 transition-opacity duration-500 ${
              s.phase === "settle" ? "opacity-100" : "opacity-0"
            }`}
          >
            {s.resultLine}
          </div>
        </div>
      )}

      {/* HUD (top-right) — every figure from PARAMS */}
      <div className="pointer-events-auto absolute right-4 top-16 z-10 flex flex-col items-end gap-1.5 text-right sm:right-8 sm:top-20">
        <span className="rounded-md border border-bone/30 bg-ink/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-bone/80 backdrop-blur-sm">
          Simulation · real odds · demo SOL
        </span>
        {!s.reduced && (
          <>
            <span
              className="font-mono text-sm text-bone tabular-nums sm:text-base"
              role="timer"
              aria-label={`Demo draw in ${countdownText}`}
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-bone/60">
                Demo draw in{" "}
              </span>
              <span className={s.phase === "charge" ? "text-gold" : ""}>{countdownText}</span>
            </span>
            <span className="font-mono text-[11px] text-bone/70">
              demo pool ≈ {fmt(s.poolSol, 0)} SOL
            </span>
          </>
        )}
        <span className="font-mono text-[11px] text-gold/90">
          mega (demo) {fmt(s.pot, 0)} SOL
          <span className="text-gold/60"> — grows every miss</span>
        </span>
        {personalOdds !== null && (
          <span className="font-mono text-[11px] text-signal">
            your shot this draw ≈ 1-in-{personalOdds.toLocaleString("en-US")}
          </span>
        )}
      </div>

      {/* Mega ignition (§4.2) — existing ignite asset at screen scale;
          dedicated fullbleed asset is logged in STUBS. */}
      {s.ignition && !s.reduced && (
        <div className="demo-ignition pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <video
            className="absolute inset-0 h-full w-full scale-110 object-cover"
            autoPlay
            muted
            playsInline
            disablePictureInPicture
            aria-hidden
          >
            <source src="/higgsfield/video/vaultdrop-ignite-moment.webm" type="video/webm" />
            <source src="/higgsfield/video/vaultdrop-ignite-moment.mp4" type="video/mp4" />
          </video>
          <div className="demo-ignition-bloom absolute inset-0" />
          <div className="relative z-10 text-center">
            <div className="font-display text-3xl font-semibold tracking-tight text-gold sm:text-5xl">
              MEGA VAULT HIT
            </div>
            <div className="mt-2 font-mono text-lg text-bone sm:text-xl">
              {fmt(s.ignitionPot, 0)} SOL (demo)
            </div>
          </div>
        </div>
      )}

      {/* Reduced-motion static result card (§4.5) */}
      {s.reduced && s.staticResult && (
        <div className="pointer-events-auto absolute bottom-16 right-4 z-10 w-[min(92%,24rem)] sm:right-8">
          <div className="glass rounded-xl p-4 text-left font-mono text-xs leading-relaxed text-bone/85">
            <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-bone/60">
              Demo draw result · simulation · real odds
            </div>
            {s.staticResult.winners} winners from a {fmt(s.staticResult.poolSol, 0)} SOL demo
            pool.{" "}
            {s.staticResult.megaHit
              ? `Mega Vault hit (1-in-26 landed).`
              : `Mega grew +${fmt(s.staticResult.megaGrowth)} → rolls.`}
            {s.deposit !== null &&
              (s.staticResult.personalWin
                ? ` YOU WON ${fmt(s.staticResult.personalPrize)} SOL (demo).`
                : " Your orb: not this one — odds carry.")}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Join — "Drop your orb in" (§4.3), rendered in the hero copy block   */
/* ------------------------------------------------------------------ */

export function DemoDrawJoin() {
  const s = useDemoDraw();
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] uppercase tracking-[0.18em] text-bone/60">
          {s.deposit === null ? "Drop your orb in" : "Your demo orb"}
        </span>
        {AMOUNT_CHIPS.map((a) => (
          <button
            key={a}
            onClick={() => (s.deposit === a ? s.leave() : s.join(a))}
            aria-pressed={s.deposit === a}
            className={`min-h-[44px] rounded-full px-4 py-1 font-mono text-xs transition sm:min-h-[36px] sm:px-3.5 sm:text-sm ${
              s.deposit === a
                ? "bg-signal/90 text-ink"
                : "border border-bone/25 text-bone/70 hover:border-signal/60 hover:text-bone"
            }`}
          >
            {a.toLocaleString("en-US")} SOL
          </button>
        ))}
        {s.deposit !== null && (
          <button onClick={s.leave} className="link-quiet font-mono text-[11px] text-bone/50">
            take it out
          </button>
        )}
      </div>
      {s.reduced && (
        <button
          onClick={s.runStaticDraw}
          className="mt-3 rounded-full border border-gold/50 px-5 py-2 font-mono text-sm text-gold transition hover:bg-gold hover:text-ink"
        >
          Run one draw
        </button>
      )}
      {(s.sessionDraws > 0 || s.sessionMegaGrowth > 0) && (
        <div className="mt-3 inline-flex rounded-md border border-bone/15 bg-ink/50 px-2.5 py-1 font-mono text-[10px] text-bone/60">
          {s.sessionDraws > 0 && (
            <>{s.sessionDraws} demo draw{s.sessionDraws === 1 ? "" : "s"} played · </>
          )}
          Mega grew +{fmt(s.sessionMegaGrowth, 0)} while you watched
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CTA — morphs once after the first participated resolution (§4.3)    */
/* ------------------------------------------------------------------ */

export function DemoDrawCta() {
  const s = useDemoDraw();
  const [morphed, setMorphed] = useState(false);
  useEffect(() => {
    if (s.participatedResolved) setMorphed(true);
  }, [s.participatedResolved]);

  return (
    <Magnetic>
      <a
        href="#waitlist"
        onClick={() =>
          track("cta_click", { cta: "hero", post_participation: s.participatedResolved })
        }
        className={`press-ripple inline-block rounded-full bg-gold px-8 py-3.5 font-medium text-ink transition hover:brightness-110 ${
          morphed ? "cta-morph-pulse" : ""
        }`}
      >
        {morphed ? "Make it real — join epoch 1" : CTA.heroPrimary}
      </a>
    </Magnetic>
  );
}
