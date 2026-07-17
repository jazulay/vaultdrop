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
import { CYCLE, DEMO_VAULT_SOL, drawOnce, rejectionInt, type DrawOutcome } from "@/lib/draw";
import {
  initLedger,
  ledgerHit,
  ledgerMiss,
  getLedgerState,
  useDemoLedger,
} from "@/lib/demoLedger";
import { calc } from "@/lib/calc";
import { CTA } from "@/lib/launch";
import { track } from "@/lib/analytics";
import Magnetic from "@/components/Magnetic";

/**
 * THE DEMO DRAW (pass 3 §4, amplitude per pass 4 §3) — the hero is the game.
 * A simulated draw of a 100,000-SOL demo vault resolves every 30s at true
 * odds. Pass 4 moved the HUD into a stage bar across the hero's lower third,
 * gave the resolve its four layers (flash → bloom → crowns → ledger), and
 * routed every Mega figure through lib/demoLedger (one history, all surfaces).
 *
 * Honesty rails (unchanged, load-bearing): crypto RNG only; all figures from
 * PARAMS; no outcome may ever be prettier than it is true; SIMULATION labeling
 * on every simulated surface including the win/mega plates.
 */

type Phase = "orbit" | "charge" | "resolve" | "settle";
const PHASE_ORDER: Phase[] = ["orbit", "charge", "resolve", "settle"];

const AMOUNT_CHIPS = [5, 25, 100, 1000] as const;
const fmt = (n: number, d = 1) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });

interface PersonalBeat {
  kind: "win" | "miss";
  prize: number;
  /** monotonically increasing id so repeat beats re-render/re-announce */
  seq: number;
}

interface DemoDrawState {
  phase: Phase;
  countdownMs: number;
  deposit: number | null;
  outcome: DrawOutcome | null;
  ignition: boolean;
  ignitionPot: number;
  resultLine: string;
  resultSeq: number;
  announce: string;
  sessionDraws: number;
  sessionMegaGrowth: number;
  participatedResolved: boolean;
  personal: PersonalBeat | null;
  winPlate: boolean;
  reduced: boolean;
  active: boolean;
  docked: boolean;
  poolSol: number;
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

const PERSONAL_HOLD_MS = 8_000; // B2: personal outcome holds ≥6s (with margin)
const WIN_PLATE_MS = 5_000;
const IGNITION_MS = 5_200; // §3.4: mega banner holds 5s

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
  const [deposit, setDeposit] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<DrawOutcome | null>(null);
  const [ignition, setIgnition] = useState(false);
  const [ignitionPot, setIgnitionPot] = useState(0);
  const [resultLine, setResultLine] = useState("");
  const [resultSeq, setResultSeq] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [sessionDraws, setSessionDraws] = useState(0);
  const [sessionMegaGrowth, setSessionMegaGrowth] = useState(0);
  const [participatedResolved, setParticipatedResolved] = useState(false);
  const [personal, setPersonal] = useState<PersonalBeat | null>(null);
  const [winPlate, setWinPlate] = useState(false);
  const [staticResult, setStaticResult] = useState<DrawOutcome | null>(null);

  const depositRef = useRef(deposit);
  depositRef.current = deposit;
  const drawsWatchedRef = useRef(0);
  const personalSeqRef = useRef(0);
  const personalTimerRef = useRef(0);
  const plateTimerRef = useRef(0);

  const active = !reduced && !docked && inView && !hidden;
  const activeRef = useRef(active);
  activeRef.current = active;

  const poolSol = useMemo(() => calc(1, DEMO_VAULT_SOL).weeklyPool, []);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    initLedger();
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const applyPersonal = useCallback((o: DrawOutcome) => {
    if (depositRef.current === null || o.personalWin === null) return;
    personalSeqRef.current += 1;
    setPersonal({
      kind: o.personalWin ? "win" : "miss",
      prize: o.personalPrize,
      seq: personalSeqRef.current,
    });
    window.clearTimeout(personalTimerRef.current);
    personalTimerRef.current = window.setTimeout(() => setPersonal(null), PERSONAL_HOLD_MS);
    if (o.personalWin) {
      setWinPlate(true);
      window.clearTimeout(plateTimerRef.current);
      plateTimerRef.current = window.setTimeout(() => setWinPlate(false), WIN_PLATE_MS);
    }
  }, []);

  const resolveDraw = useCallback(() => {
    const o = drawOnce(depositRef.current);
    setOutcome(o);
    drawsWatchedRef.current += 1;
    track("demo_draw_watched", { count: drawsWatchedRef.current });

    // One ledger for the whole demo world (B3).
    let hitPot: number | null = null;
    if (o.megaHit) {
      hitPot = ledgerHit();
      setIgnition(true);
      setIgnitionPot(Math.round(hitPot));
      track("mega_ignition_seen", { pot: Math.round(hitPot) });
      window.setTimeout(() => setIgnition(false), IGNITION_MS);
    } else {
      ledgerMiss();
      setSessionMegaGrowth((g) => g + o.megaGrowth);
    }

    if (depositRef.current !== null) {
      setSessionDraws((n) => n + 1);
      setParticipatedResolved(true);
      applyPersonal(o);
      if (o.personalWin) {
        track("demo_personal_win", { deposit: depositRef.current, prize: o.personalPrize });
      }
    }

    const led = getLedgerState();
    const personalTxt =
      depositRef.current === null
        ? ""
        : o.personalWin
          ? ` You won ${fmt(o.personalPrize)} demo SOL.`
          : " Your orb: not this one — your odds carry.";
    setAnnounce(
      hitPot !== null
        ? `Demo draw resolved: the Mega Vault hit for ${fmt(hitPot, 0)} demo SOL. ${o.winners} weekly winners.${personalTxt}`
        : `Demo draw resolved: ${o.winners} winners from a ${fmt(o.poolSol, 0)} SOL demo pool. Mega grew ${fmt(o.megaGrowth)} to ${fmt(led.pot, 0)}.${personalTxt}`,
    );
    setResultLine(
      `demo epoch ${led.epoch} · ${fmt(o.poolSol)} SOL · ${o.winners} winners · odds honored ✓`,
    );
    setResultSeq((n) => n + 1);
  }, [applyPersonal]);

  // Phase scheduler — pausable setTimeout chain (remaining time preserved).
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

  // Countdown ticker to the end of CHARGE (the lock moment).
  useEffect(() => {
    if (!active) return;
    let last = performance.now();
    let rem = remainingRef.current;
    const remainingElapsed = () => {
      const now = performance.now();
      rem -= now - last;
      last = now;
      return Math.max(0, rem);
    };
    const tick = () => {
      if (phase === "orbit") setCountdownMs(remainingElapsed() + CYCLE.charge);
      else if (phase === "charge") setCountdownMs(remainingElapsed());
      else setCountdownMs(0);
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

  // Reduced-motion path: one static draw per press, same information.
  const runStaticDraw = useCallback(() => {
    const o = drawOnce(depositRef.current);
    setStaticResult(o);
    drawsWatchedRef.current += 1;
    track("demo_draw_watched", { count: drawsWatchedRef.current, static: true });
    if (o.megaHit) {
      const hit = ledgerHit();
      setIgnitionPot(Math.round(hit));
      track("mega_ignition_seen", { pot: Math.round(hit), static: true });
    } else {
      ledgerMiss();
    }
    if (depositRef.current !== null) {
      setParticipatedResolved(true);
      applyPersonal(o);
      if (o.personalWin)
        track("demo_personal_win", { deposit: depositRef.current, prize: o.personalPrize });
    }
    setAnnounce(
      `Demo draw resolved: ${o.winners} winners from a ${fmt(o.poolSol, 0)} SOL demo pool.` +
        (depositRef.current !== null
          ? o.personalWin
            ? ` You won ${fmt(o.personalPrize)} demo SOL.`
            : " Not this one — your odds carry."
          : ""),
    );
  }, [applyPersonal]);

  const value: DemoDrawState = {
    phase,
    countdownMs,
    deposit,
    outcome,
    ignition,
    ignitionPot,
    resultLine,
    resultSeq,
    announce,
    sessionDraws,
    sessionMegaGrowth,
    participatedResolved,
    personal,
    winPlate,
    reduced,
    active,
    docked,
    poolSol,
    join,
    leave,
    runStaticDraw,
    staticResult,
    setInView,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ------------------------------------------------------------------ */
/* Stage — orbs, four-layer resolve, ignition, receipt                 */
/* ------------------------------------------------------------------ */

interface Orb {
  ring: number;
  theta0: number;
  speed: number;
  size: number;
  winner: boolean;
  showPop: boolean;
}

// §3.2: path-locked to the two visible ring ellipses.
const RINGS = [
  { rx: 0.33, ry: 0.14, cy: 0.5 },
  { rx: 0.44, ry: 0.19, cy: 0.52 },
];
const ORB_SIZES = [18, 23, 28];

function makeOrbs(count: number): Orb[] {
  return Array.from({ length: count }, (_, i) => ({
    ring: i % 2,
    theta0: (i / count) * Math.PI * 2 + rejectionInt(100) / 100,
    speed: 0.09 + rejectionInt(80) / 1000,
    size: ORB_SIZES[i % 3],
    winner: false,
    showPop: false,
  }));
}

export function DemoDrawStage() {
  const s = useDemoDraw();
  const led = useDemoLedger();
  const stageRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const youRef = useRef<HTMLDivElement>(null);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const speedMulRef = useRef(1);
  const exclusionRef = useRef<DOMRect[]>([]);
  const [slam, setSlam] = useState(false);
  const phaseRef = useRef(s.phase);
  phaseRef.current = s.phase;

  useEffect(() => {
    const small = window.matchMedia("(max-width: 640px)").matches;
    const initial = makeOrbs(small ? 12 : 24);
    orbsRef.current = initial;
    setOrbs(initial);
  }, []);

  // In-view gate.
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

  // §3.2 text-safe exclusion zone: cache the hero copy rect (relative to the
  // stage) — orbs fade out within 40px of it. Re-measured on resize + 1s tick.
  useEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      const copy = document.getElementById("hero-copy");
      if (!stage || !copy || copy.children.length === 0) return;
      // Per-element rects (not the union): the wide headline would otherwise
      // blanket the whole stage. Orbs pass through the gaps between blocks.
      const sr = stage.getBoundingClientRect();
      const pad = 24;
      exclusionRef.current = Array.from(copy.children)
        .map((child) => child.getBoundingClientRect())
        .filter((cr) => cr.width > 0 && cr.height > 0)
        .map(
          (cr) =>
            new DOMRect(cr.x - sr.x - pad, cr.y - sr.y - pad, cr.width + pad * 2, cr.height + pad * 2),
        );
    };
    measure();
    window.addEventListener("resize", measure);
    const id = window.setInterval(measure, 1000);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearInterval(id);
    };
  }, []);

  // Crown assignment on resolve (§3.4: the winner count flares, at true scale
  // for the visible field); ledger slam at the 1.2s mark; clear on orbit.
  useEffect(() => {
    if (s.phase === "resolve") {
      const field = orbsRef.current;
      const crowns = Math.min(s.outcome?.winners ?? 20, Math.max(1, field.length - 4));
      const picked = new Set<number>();
      while (picked.size < crowns) picked.add(rejectionInt(field.length));
      let pops = 0;
      field.forEach((o, i) => {
        o.winner = picked.has(i);
        o.showPop = o.winner && pops++ < 4;
      });
      setOrbs([...field]);
      const t = window.setTimeout(() => setSlam(true), 1200);
      const t2 = window.setTimeout(() => setSlam(false), 2200);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(t2);
      };
    }
    if (s.phase === "orbit") {
      const field = orbsRef.current;
      field.forEach((o) => {
        o.winner = false;
        o.showPop = false;
      });
      setOrbs([...field]);
    }
  }, [s.phase, s.outcome]);

  // rAF positional loop — transforms/opacity only.
  useEffect(() => {
    if (!s.active) return;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const target =
        phaseRef.current === "charge" ? 3 : phaseRef.current === "resolve" ? 2 : 1;
      speedMulRef.current += (target - speedMulRef.current) * Math.min(1, dt * 3);
      t += dt * speedMulRef.current;

      const el = stageRef.current;
      if (el) {
        const w = el.clientWidth;
        const h = el.clientHeight;
        const ex = exclusionRef.current;
        const charging = phaseRef.current === "charge";
        const place = (
          node: HTMLDivElement,
          ring: (typeof RINGS)[number],
          th: number,
          baseOpacity: number,
        ) => {
          const x = w * 0.5 + Math.cos(th) * ring.rx * w;
          const y = h * ring.cy + Math.sin(th) * ring.ry * h;
          const tangent =
            (Math.atan2(ring.ry * h * Math.cos(th), -ring.rx * w * Math.sin(th)) * 180) /
            Math.PI;
          node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)${
            charging ? ` rotate(${tangent}deg)` : ""
          }`;
          node.style.zIndex = Math.sin(th) > 0 ? "6" : "2";
          const excluded = ex.some(
            (r) => x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height,
          );
          node.style.opacity = excluded ? "0" : String(baseOpacity);
          return { x, y };
        };

        orbsRef.current.forEach((o, i) => {
          const node = orbRefs.current[i];
          if (!node) return;
          const dimmed =
            (phaseRef.current === "resolve" || phaseRef.current === "settle") && !o.winner;
          place(node, RINGS[o.ring], o.theta0 + t * o.speed * (1 + o.ring * 0.2), dimmed ? 0.4 : 0.95);
        });
        const you = youRef.current;
        if (you) {
          place(you, RINGS[0], Math.PI / 2 + t * 0.12, 1);
          you.style.zIndex = "7";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [s.active]);

  const secs = Math.ceil(s.countdownMs / 1000);
  const countdownText = `0:${String(Math.max(0, secs)).padStart(2, "0")}`;
  const rawOdds = s.deposit !== null ? calc(s.deposit, DEMO_VAULT_SOL).oneInN : null;
  const personalOdds =
    rawOdds === null ? null : rawOdds < 10 ? Math.round(rawOdds * 10) / 10 : Math.round(rawOdds);

  return (
    <div ref={stageRef} className="pointer-events-none absolute inset-0">
      {/* aria-live announcements — never under aria-hidden */}
      <div aria-live="polite" className="sr-only">
        {s.announce}
      </div>

      {!s.reduced && (
        <div aria-hidden className="absolute inset-0">
          {/* §3.3 CHARGE: core brightness ramp */}
          <div
            className={`absolute left-1/2 top-[48%] h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full ${
              s.phase === "charge" ? "stage-core-charge" : "opacity-0"
            }`}
            style={{
              background:
                "radial-gradient(circle, rgba(201,162,39,0.4) 0%, rgba(201,162,39,0.1) 50%, transparent 72%)",
            }}
          />

          {/* orb field (§3.2 glass tickets) */}
          {orbs.map((o, i) => (
            <div
              key={i}
              ref={(n) => {
                orbRefs.current[i] = n;
              }}
              className={`demo-orb absolute left-0 top-0 ${
                s.phase === "charge" ? "demo-orb-streak" : ""
              } ${o.winner && (s.phase === "resolve" || s.phase === "settle") ? "demo-orb-crowned" : ""}`}
              style={{ width: o.size, height: o.size }}
            >
              {o.winner && s.phase !== "orbit" && s.phase !== "charge" && (
                <>
                  <span className="crown-burst" />
                  <svg
                    viewBox="0 0 12 8"
                    className="absolute -top-4 left-1/2 h-3.5 w-5 -translate-x-1/2 text-gold"
                    fill="currentColor"
                  >
                    <path d="M0 8 L1.5 2 L4 5 L6 0 L8 5 L10.5 2 L12 8 Z" />
                  </svg>
                </>
              )}
              {o.showPop && s.phase !== "orbit" && s.phase !== "charge" && (
                <span className="demo-pop absolute -top-8 left-1/2 -translate-x-1/2 font-mono text-[16px] font-medium text-gold">
                  +{fmt(s.outcome?.personalPrize ?? 0)}
                </span>
              )}
            </div>
          ))}

          {/* YOU orb — 32px, the visitor's flag (§3.2) */}
          {s.deposit !== null && (
            <div
              ref={youRef}
              className={`demo-orb-you absolute left-0 top-0 h-8 w-8 ${
                s.phase !== "orbit" && s.phase !== "charge" && s.outcome?.personalWin
                  ? "demo-orb-crowned"
                  : ""
              }`}
            >
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-ink/80 px-1.5 py-0.5 font-mono text-[11px] tracking-[0.2em] text-signal">
                YOU
              </span>
              {s.phase !== "orbit" && s.phase !== "charge" && s.outcome?.personalWin && (
                <svg
                  viewBox="0 0 12 8"
                  className="absolute -top-12 left-1/2 h-4 w-6 -translate-x-1/2 text-gold"
                  fill="currentColor"
                >
                  <path d="M0 8 L1.5 2 L4 5 L6 0 L8 5 L10.5 2 L12 8 Z" />
                </svg>
              )}
            </div>
          )}

          {/* §3.4 layer 1: full-stage flash — detectable in any screenshot */}
          {s.phase === "resolve" && <div className="stage-flash absolute inset-0" />}

          {/* §3.4 layer 2: bloom from the core */}
          <div
            className={`absolute left-1/2 top-[48%] h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              s.phase === "resolve" ? "stage-bloom" : "opacity-0"
            }`}
            style={{
              background:
                "radial-gradient(circle, rgba(201,162,39,0.6) 0%, rgba(201,162,39,0.2) 45%, transparent 70%)",
            }}
          />

          {/* §3.6 SETTLE receipt — types on, holds, slides toward Proof */}
          {s.resultSeq > 0 && (
            <div
              key={s.resultSeq}
              className="receipt absolute bottom-[7.5rem] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[14px] tracking-[0.08em] text-bone/70 sm:bottom-[8.5rem]"
            >
              {s.resultLine}
            </div>
          )}
        </div>
      )}

      {/* §3.5 WIN plate — center stage, labeled, vignette pulse */}
      {s.winPlate && (
        <div className="pointer-events-none absolute inset-0 z-30">
          <div className="win-vignette absolute inset-0" />
          <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="stamp-in rounded-xl border border-gold/50 bg-ink/80 px-8 py-5 backdrop-blur-md">
              <div className="font-display text-[32px] font-semibold tracking-tight text-gold">
                YOU WON {fmt(s.outcome?.personalPrize ?? 0)} SOL
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/70">
                (demo) · at true 1-in-{personalOdds?.toLocaleString("en-US")} odds
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mega ignition (§3.4) — center-stage, banner holds 5s */}
      {s.ignition && !s.reduced && (
        <div className="demo-ignition pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <video
            className="absolute inset-0 h-full w-full scale-[2] object-cover"
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
            <div className="font-display text-[28px] font-semibold tracking-tight text-gold sm:text-5xl">
              MEGA VAULT HIT · {fmt(s.ignitionPot, 0)} SOL
            </div>
            <div className="mt-2 font-mono text-sm uppercase tracking-[0.25em] text-bone/80">
              (demo) · true 1-in-26 · it starts growing again now
            </div>
          </div>
        </div>
      )}

      {/* ---------------- §3.1 THE STAGE BAR ---------------- */}
      <div
        className={`pointer-events-auto absolute inset-x-0 bottom-0 z-20 border-t border-bone/10 bg-ink/60 backdrop-blur-md transition-opacity duration-300 ${
          s.docked ? "pointer-events-none opacity-0" : "opacity-100"
        } ${s.phase === "charge" ? "stage-bar-charging" : ""}`}
      >
        <span className="absolute -top-7 right-4 rounded-md border border-bone/30 bg-ink/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-bone/80 backdrop-blur-sm sm:right-8">
          Simulation · real odds · demo SOL
        </span>

        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-8 sm:py-4">
          {/* the clock — the page's second read (§3.1) */}
          <div className="stage-clock">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone/60">
              {s.reduced ? "Demo draw" : "Demo draw in"}
            </div>
            {s.reduced ? (
              <button
                onClick={s.runStaticDraw}
                className="press-ripple mt-1 rounded-full border border-gold/50 px-5 py-2 font-mono text-sm text-gold transition hover:bg-gold hover:text-ink"
              >
                Run one draw
              </button>
            ) : (
              <div
                role="timer"
                aria-label={`Demo draw in ${countdownText}`}
                className={`font-mono text-[34px] leading-none text-bone tabular-nums sm:text-[48px] ${
                  s.phase === "charge" ? "clock-pulse text-gold" : ""
                }`}
              >
                {countdownText}
              </div>
            )}
          </div>

          <div className="stage-dim font-mono text-[14px] text-bone/70">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-bone/50">
              demo pool
            </span>
            ≈ {fmt(s.poolSol, 0)} SOL · 20 winners
          </div>

          <div className={`stage-dim font-mono text-[14px] text-gold ${slam ? "mega-slam" : ""}`}>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-gold/60">
              mega (demo) — grows every miss
            </span>
            {fmt(led.pot, 0)} SOL
            {slam && !s.outcome?.megaHit && (
              <span className="ml-2 text-[12px] text-gold/80">+{fmt(led.accrual)} ▲</span>
            )}
          </div>

          {/* §3.5 personal slot — reserved space, zero CLS (B1) */}
          <div className="stage-dim min-h-[2.5rem] min-w-[13rem] font-mono text-[14px]">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-bone/50">
              {s.deposit === null ? "spectating" : "your demo orb"}
            </span>
            {s.personal ? (
              s.personal.kind === "win" ? (
                <span className="text-gold">YOU WON {fmt(s.personal.prize)} SOL (demo)</span>
              ) : (
                <span className="text-bone/85">
                  Not this one — 20 crowns landed elsewhere. Your odds carry →
                </span>
              )
            ) : s.deposit !== null ? (
              <span className="text-signal">
                your shot ≈ 1-in-{personalOdds?.toLocaleString("en-US")}
              </span>
            ) : (
              <span className="text-bone/60">drop an orb in to ride the next draw</span>
            )}
          </div>

          {/* chips dock into the bar (§3.1); selected = gold (B6) */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {AMOUNT_CHIPS.map((a) => (
              <button
                key={a}
                onClick={() => (s.deposit === a ? s.leave() : s.join(a))}
                aria-pressed={s.deposit === a}
                className={`min-h-[44px] rounded-full px-4 py-1 font-mono text-xs transition sm:min-h-[36px] sm:px-3.5 sm:text-sm ${
                  s.deposit === a
                    ? "bg-gold text-ink"
                    : "border border-bone/25 text-bone/70 hover:border-gold/60 hover:text-bone"
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
        </div>

        {/* session tally — height reserved from first paint (B1) */}
        <div className="mx-auto h-6 max-w-7xl px-4 pb-2 font-mono text-[10px] text-bone/55 sm:px-8">
          {(s.sessionDraws > 0 || s.sessionMegaGrowth > 0) && (
            <>
              {s.sessionDraws > 0 &&
                `${s.sessionDraws} demo draw${s.sessionDraws === 1 ? "" : "s"} played · `}
              Mega grew +{fmt(s.sessionMegaGrowth, 0)} SOL while you watched
            </>
          )}
        </div>
      </div>

      {/* Reduced-motion static result card — same information, no physics */}
      {s.reduced && s.staticResult && (
        <div className="pointer-events-auto absolute bottom-28 right-4 z-10 w-[min(92%,24rem)] sm:right-8">
          <div className="glass rounded-xl p-4 text-left font-mono text-xs leading-relaxed text-bone/85">
            <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-bone/60">
              Demo draw result · simulation · real odds
            </div>
            {s.staticResult.winners} winners from a {fmt(s.staticResult.poolSol, 0)} SOL demo
            pool.{" "}
            {s.staticResult.megaHit
              ? `Mega Vault hit for ${fmt(s.ignitionPot, 0)} SOL (1-in-26 landed) — it starts growing again now.`
              : `Mega grew +${fmt(s.staticResult.megaGrowth)} → ${fmt(led.pot, 0)} SOL and rolling.`}
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
/* CTA — morphs once after first participated resolution               */
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

/* PiP content (B5): the live demo clock + pot, replacing static text. */
export function DemoDrawPipInfo() {
  const s = useDemoDraw();
  const led = useDemoLedger();
  const secs = Math.ceil(s.countdownMs / 1000);
  return (
    <>
      <div className="text-[10px] uppercase tracking-[0.2em] text-gold/90">
        Mega (demo) · {fmt(led.pot, 0)} SOL
      </div>
      <div className="mt-0.5 font-mono text-xs text-bone tabular-nums">
        {s.reduced ? "demo draws on the hero" : `draw in 0:${String(Math.max(0, secs)).padStart(2, "0")}`}
      </div>
    </>
  );
}
