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
import { CYCLE, CYCLE_TOTAL, DEMO_VAULT_SOL, drawOnce, rejectionInt, type DrawOutcome } from "@/lib/draw";
import {
  initLedger,
  ledgerHit,
  ledgerMiss,
  getLedgerState,
  getAwayReport,
  useDemoLedger,
} from "@/lib/demoLedger";
import {
  initSound,
  setSound,
  useSound,
  tick,
  chargeRiser,
  resolveStrike,
  crownShimmer,
  winChime,
  megaBoom,
} from "@/lib/sound";
import { calc } from "@/lib/calc";
import {
  computeRingGeom,
  intersects,
  poseOnRing,
  youTheta,
  type Rect,
  type RingGeom,
} from "@/lib/ring";
import { APP_URL, CTA } from "@/lib/launch";
import { track } from "@/lib/analytics";
import Magnetic from "@/components/Magnetic";
import CountUp from "@/components/CountUp";
import WinnerCard from "@/components/WinnerCard";

/**
 * THE DEMO DRAW (pass 3 §4, amplitude pass 4 §3, THE DRAW RING pass 5 §2).
 *
 * Pass 5's architectural move: stop asking DOM orbs to pretend they ride the
 * video's baked 3D rings. The video is demoted to the set (blurred, behind —
 * see HeroOrrery); the orbs ride ONE sharp owned ellipse computed from the
 * measured layout (lib/ring.ts), with θ-derived depth: size, opacity (never
 * 0), z vs. the ring stroke, and sweep speed all fall out of the phase angle.
 *
 * Honesty rails (unchanged, load-bearing): crypto RNG only; all figures from
 * PARAMS; no outcome may ever be prettier than it is true; SIMULATION labeling
 * on every simulated surface. New in pass 5 (§2.7): the ring is explicitly a
 * SAMPLE of the demo vault's depositors — the 20 weekly crowns bloom around
 * the core (the vault paying out), never on the sampled orbs, and YOUR orb
 * crowns only at your real odds. §2.6: your orb's weight (and size) accrues
 * with time held — the demo's 30s cycle stands in for the week, so the
 * anti-snipe rule teaches itself.
 */

type Phase = "orbit" | "charge" | "resolve" | "settle";
const PHASE_ORDER: Phase[] = ["orbit", "charge", "resolve", "settle"];

const AMOUNT_CHIPS = [5, 25, 100, 1000] as const;
/** §2.5 size = stake. Full-size px by chip; the 25-SOL default lands at 48px (§2.4). */
const STAKE_PX: Record<number, number> = { 5: 32, 25: 48, 100: 58, 1000: 72 };
/** §2.7 sample HUD: ~depositor count the demo vault implies at a 25-SOL average. */
const AVG_DEMO_DEPOSIT = 25;

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
  /** §2.6 time-weight: fraction of the 30s demo week held so far (0..1). */
  getHeldFraction: () => number;
  /** Pass 6 #21: true when the orb joined after this draw's entries locked. */
  getJoinedAfterLock: () => boolean;
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
// Pass 6 #6: landing-page judgment happens in 5-10s, so the FIRST orbit is
// compressed — first resolve lands ~7s after load instead of ~26s. Purely
// presentation timing: drawOnce() and every probability are untouched.
const FIRST_ORBIT_MS = 4_000;

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
  const [countdownMs, setCountdownMs] = useState(FIRST_ORBIT_MS + CYCLE.charge);
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
  const joinedAtRef = useRef(0);
  // Pass 6 #21: entries lock when CHARGE begins — a join after the lock rides
  // the NEXT draw at real weight instead of resolving seconds later at dust
  // weight (honest math that felt rigged).
  const lockAtRef = useRef(0);
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
    initSound();
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  // §2.6: weight = balance × time. The 30s cycle is the demo's week; a full
  // held cycle = full weight. Honest by construction — the draw resolves at
  // exactly the odds this fraction implies. Reduced motion has no cycle (draws
  // are user-triggered), so time-weight doesn't apply: full weight there.
  const getHeldFraction = useCallback(() => {
    if (depositRef.current === null) return 0;
    if (reducedRef.current) return 1;
    return Math.min(1, (performance.now() - joinedAtRef.current) / CYCLE_TOTAL);
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
    // Pass 6 #21: only orbs that were IN before the lock ride this draw.
    const eligible =
      depositRef.current !== null && joinedAtRef.current <= lockAtRef.current;
    // Time-weighted stake for THIS draw (§2.6) — full weight after one cycle.
    const eff = eligible ? depositRef.current! * getHeldFraction() : null;
    const o = drawOnce(eff);
    setOutcome(o);
    drawsWatchedRef.current += 1;
    track("demo_draw_watched", { count: drawsWatchedRef.current });
    resolveStrike();

    // One ledger for the whole demo world (B3).
    let hitPot: number | null = null;
    if (o.megaHit) {
      hitPot = ledgerHit();
      setIgnition(true);
      setIgnitionPot(Math.round(hitPot));
      track("mega_ignition_seen", { pot: Math.round(hitPot) });
      megaBoom();
      window.setTimeout(() => setIgnition(false), IGNITION_MS);
    } else {
      ledgerMiss();
      setSessionMegaGrowth((g) => g + o.megaGrowth);
    }

    if (eligible) {
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
        : !eligible
          ? " Your orb was locked in for the next draw."
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
  }, [applyPersonal, getHeldFraction]);

  // Phase scheduler — pausable setTimeout chain (remaining time preserved).
  // First orbit is compressed (pass 6 #6).
  const remainingRef = useRef<number>(FIRST_ORBIT_MS);
  useEffect(() => {
    if (reduced) return;
    let timer: number | null = null;
    let phaseStartedAt = performance.now();
    let currentPhase: Phase = phase;

    const advance = () => {
      const idx = PHASE_ORDER.indexOf(currentPhase);
      currentPhase = PHASE_ORDER[(idx + 1) % PHASE_ORDER.length];
      setPhase(currentPhase);
      if (currentPhase === "charge") {
        lockAtRef.current = performance.now(); // entries lock (pass 6 #21)
        chargeRiser();
      }
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
    if (depositRef.current === null) joinedAtRef.current = performance.now();
    setDeposit(amount);
    track("demo_orb_added", { amount });
  }, []);
  const leave = useCallback(() => setDeposit(null), []);

  // Pass 6 #21: is the current orb waiting for the next draw's orbit?
  const getJoinedAfterLock = useCallback(
    () => depositRef.current !== null && joinedAtRef.current > lockAtRef.current,
    [],
  );

  // Reduced-motion path: one static draw per press, same information.
  const runStaticDraw = useCallback(() => {
    const eff =
      depositRef.current === null ? null : depositRef.current * getHeldFraction();
    const o = drawOnce(eff);
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
  }, [applyPersonal, getHeldFraction]);

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
    getHeldFraction,
    getJoinedAfterLock,
    runStaticDraw,
    staticResult,
    setInView,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ------------------------------------------------------------------ */
/* Stage — the Draw Ring, four-layer resolve, ignition, receipt        */
/* ------------------------------------------------------------------ */

interface Orb {
  theta: number;
  speed: number;
  size: number;
}

// §2.3: 16 desktop / 10 mobile; a few 40px whales, mostly 16–24px.
const ORB_SIZES_DESKTOP = [40, 40, 24, 24, 22, 22, 20, 20, 18, 18, 16, 16, 24, 20, 18, 16];
const ORB_SIZES_MOBILE = [40, 24, 22, 20, 20, 18, 18, 16, 16, 20];

function makeOrbs(sizes: number[]): Orb[] {
  return sizes.map((size, i) => ({
    theta: (i / sizes.length) * Math.PI * 2 + rejectionInt(100) / 60,
    speed: 0.1 + rejectionInt(80) / 1000,
    size,
  }));
}

interface Crown {
  dx: number;
  dy: number;
  delay: number;
  pop: boolean;
}

/** §2.7: 20 crowns bloom around the CORE — the vault paying out, never the sample. */
function makeCrowns(count: number, g: RingGeom): Crown[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + rejectionInt(60) / 60;
    const r = 0.3 + rejectionInt(55) / 100;
    return {
      dx: Math.cos(angle) * g.a * 0.55 * r,
      dy: Math.sin(angle) * g.b * 0.85 * r,
      delay: i * 45,
      pop: i < 4,
    };
  });
}

interface StageBox {
  w: number;
  h: number;
}

export function DemoDrawStage() {
  const s = useDemoDraw();
  const led = useDemoLedger();
  const soundOn = useSound();
  const stageRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const youRef = useRef<HTMLDivElement>(null);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const [geom, setGeom] = useState<RingGeom | null>(null);
  const geomRef = useRef<RingGeom | null>(null);
  const [box, setBox] = useState<StageBox>({ w: 0, h: 0 });
  const textRectsRef = useRef<Rect[]>([]);
  const speedMulRef = useRef(1);
  const [slam, setSlam] = useState(false);
  const [crowns, setCrowns] = useState<Crown[]>([]);
  const [joinRipple, setJoinRipple] = useState<{ x: number; y: number; seq: number } | null>(null);
  const [exitGhost, setExitGhost] = useState<{ x: number; y: number; size: number } | null>(null);
  const youEntryRef = useRef<{ fromX: number; fromY: number; start: number } | null>(null);
  const youTRef = useRef(0);
  const youPoseRef = useRef<{ x: number; y: number; size: number }>({ x: 0, y: 0, size: 48 });
  const freezeUntilRef = useRef(0);
  const phaseRef = useRef(s.phase);
  phaseRef.current = s.phase;

  useEffect(() => {
    const small = window.matchMedia("(max-width: 640px)").matches;
    const initial = makeOrbs(small ? ORB_SIZES_MOBILE : ORB_SIZES_DESKTOP);
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

  // §2.2 THE GEOMETRY: measure the copy blocks + stage bar, derive the ring.
  // The text-safe rects are hard constraints in code, not a hope — the ring is
  // computed to clear them, and the dev assertion below patrols the live DOM.
  useEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      const copy = document.getElementById("hero-copy");
      if (!stage || !copy || copy.children.length === 0) return;
      const sr = stage.getBoundingClientRect();
      if (sr.width < 200 || sr.height < 200) return; // docked/PiP scale — keep last good
      const rects: Rect[] = Array.from(copy.children)
        .map((child) => child.getBoundingClientRect())
        .filter((cr) => cr.width > 0 && cr.height > 0)
        .map((cr) => ({ x: cr.x - sr.x, y: cr.y - sr.y, width: cr.width, height: cr.height }));
      textRectsRef.current = rects;
      const barTop = barRef.current
        ? barRef.current.getBoundingClientRect().y - sr.y
        : sr.height - 150;
      const mobile = window.matchMedia("(max-width: 640px)").matches;
      const g = computeRingGeom(sr.width, sr.height, rects, barTop, mobile);
      if (!g) return; // degenerate layout mid-transition — keep last good geometry
      const prev = geomRef.current;
      const changed =
        !prev ||
        Math.abs(prev.cx - g.cx) > 1 ||
        Math.abs(prev.cy - g.cy) > 1 ||
        Math.abs(prev.a - g.a) > 1 ||
        Math.abs(prev.b - g.b) > 1;
      if (changed) {
        geomRef.current = g;
        setGeom(g);
        setBox({ w: sr.width, h: sr.height });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    const id = window.setInterval(measure, 1000);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearInterval(id);
    };
  }, []);

  // §9 dev-mode assertion: no orb may ever sit inside the text-safe rect.
  // Not eyeballing — the live DOM is patrolled; violations are loud.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const id = window.setInterval(() => {
      const stage = stageRef.current;
      if (!stage) return;
      const sr = stage.getBoundingClientRect();
      if (sr.width < 200) return;
      const texts = textRectsRef.current;
      let violations = 0;
      const check = (node: HTMLDivElement | null) => {
        if (!node || parseFloat(node.style.opacity || "1") <= 0) return;
        const r = node.getBoundingClientRect();
        const local: Rect = { x: r.x - sr.x, y: r.y - sr.y, width: r.width, height: r.height };
        if (texts.some((t) => intersects(local, t))) violations++;
      };
      orbRefs.current.forEach(check);
      check(youRef.current);
      stage.dataset.ringViolations = String(violations);
      if (violations > 0) {
        console.error(
          `[ring-assert] ${violations} orb(s) inside the text-safe rect — §2.2 constraint violated`,
        );
      }
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  // Pass 6 #1: publish the stage bar's real height — the hero copy reserves
  // exactly this much, so the fold can never bury the CTAs again.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--stage-h", `${bar.offsetHeight}px`);
    });
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

  // §2.7 crowns bloom at the core on resolve; ledger slam at the 1.2s mark.
  useEffect(() => {
    if (s.phase === "resolve") {
      const g = geomRef.current;
      if (g) setCrowns(makeCrowns(s.outcome?.winners ?? 20, g));
      crownShimmer(8);
      const t = window.setTimeout(() => setSlam(true), 1200);
      const t2 = window.setTimeout(() => setSlam(false), 2200);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(t2);
      };
    }
    if (s.phase === "orbit") setCrowns([]);
  }, [s.phase, s.outcome]);

  // §5: your win freezes the stage 300ms — the world stops for you.
  useEffect(() => {
    if (s.winPlate) {
      freezeUntilRef.current = performance.now() + 300;
      winChime();
    }
  }, [s.winPlate]);

  // One rAF loop — transforms/opacity only (§2.8).
  useEffect(() => {
    if (!s.active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const rawDt = (now - last) / 1000;
      last = now;
      const dt = now < freezeUntilRef.current ? 0 : rawDt;
      const target =
        phaseRef.current === "charge" ? 3 : phaseRef.current === "resolve" ? 2 : 1;
      speedMulRef.current += (target - speedMulRef.current) * Math.min(1, rawDt * 3);

      const g = geomRef.current;
      if (g) {
        const charging = phaseRef.current === "charge";
        orbsRef.current.forEach((o, i) => {
          const node = orbRefs.current[i];
          if (!node) return;
          const pose = poseOnRing(g, o.theta);
          // §2.3: back arc sweeps faster — integrate speed against depth.
          o.theta += dt * o.speed * pose.speedFactor * speedMulRef.current;
          const tangent =
            (Math.atan2(g.b * Math.cos(o.theta), -g.a * Math.sin(o.theta)) * 180) / Math.PI;
          node.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) translate(-50%, -50%) scale(${pose.scale})${
            charging ? ` rotate(${tangent}deg)` : ""
          }`;
          node.style.opacity = String(pose.opacity); // 0.55..0.95 — never 0
          node.style.zIndex = pose.front ? "6" : "2"; // the z-flip vs the ring stroke (z-4)
        });

        const you = youRef.current;
        if (you && s.deposit !== null) {
          // Pass 6 #20: the player's orb rides the charge too — its sweep
          // follows the field's acceleration instead of sitting exempt.
          youTRef.current += dt * (0.4 + 0.6 * speedMulRef.current);
          const pose = poseOnRing(g, youTheta(youTRef.current));
          const held = s.getHeldFraction();
          const size = (STAKE_PX[s.deposit] ?? 48) * (0.45 + 0.55 * held);
          let x = pose.x;
          let y = pose.y;
          let scale = 1;
          const entry = youEntryRef.current;
          if (entry) {
            const p = Math.min(1, (now - entry.start) / 700);
            const ease = 1 - Math.pow(1 - p, 3); // §2.4: ~700ms cubic ease-out
            x = entry.fromX + (pose.x - entry.fromX) * ease;
            y = entry.fromY + (pose.y - entry.fromY) * ease;
            scale = 0.3 + 0.7 * ease;
            if (p >= 1) {
              youEntryRef.current = null;
              setJoinRipple({ x: pose.x, y: pose.y, seq: now });
            }
          }
          you.style.width = `${size}px`;
          you.style.height = `${size}px`;
          you.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
          you.style.zIndex = "7"; // above every other orb, always front arc
          youPoseRef.current = { x, y, size };
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.active, s.deposit]);

  // §2.4 entry: the orb arcs in from the chip's actual screen position.
  const onChip = (amount: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (s.deposit === amount) {
      onLeave();
      return;
    }
    const stage = stageRef.current;
    if (s.deposit === null && stage && !s.reduced) {
      const sr = stage.getBoundingClientRect();
      const cr = e.currentTarget.getBoundingClientRect();
      youEntryRef.current = {
        fromX: cr.x + cr.width / 2 - sr.x,
        fromY: cr.y + cr.height / 2 - sr.y,
        start: performance.now(),
      };
    }
    navigator.vibrate?.(8); // §5: light haptic on mobile
    tick();
    s.join(amount);
  };

  // §2.4 exit: "take it out" reverses it — detach, arc down, fade.
  const onLeave = () => {
    if (!s.reduced && youPoseRef.current.x > 0) {
      setExitGhost({ ...youPoseRef.current });
      window.setTimeout(() => setExitGhost(null), 550);
    }
    s.leave();
  };

  const secs = Math.ceil(s.countdownMs / 1000);
  const countdownText = `0:${String(Math.max(0, secs)).padStart(2, "0")}`;

  // §2.6 the odds line is time-weight-honest: it shows the odds THIS draw
  // will actually resolve at, and says why while the weight is still accruing.
  const held = s.getHeldFraction();
  const effDeposit = s.deposit !== null ? s.deposit * held : null;
  const rawOdds =
    effDeposit !== null && effDeposit > 0 ? calc(effDeposit, DEMO_VAULT_SOL).oneInN : null;
  const personalOdds =
    rawOdds === null || !isFinite(rawOdds)
      ? null
      : rawOdds < 10
        ? Math.round(rawOdds * 10) / 10
        : Math.round(rawOdds);
  const heldSecs = Math.floor((held * CYCLE_TOTAL) / 1000);
  const cycleSecs = Math.round(CYCLE_TOTAL / 1000);
  const depositorCount = Math.round(DEMO_VAULT_SOL / AVG_DEMO_DEPOSIT);
  // Pass 6 #21: joined after the lock → riding the next draw.
  const lockedNext = s.phase !== "orbit" && s.getJoinedAfterLock();
  // Pass 6 #20: one-time invitation, only during the cycle after the first
  // resolve a spectator witnesses. Never repeats.
  const nudge = s.deposit === null && s.resultSeq === 1;
  const away = getAwayReport();
  // Pass 6 #20: each chip states its consequence — per-draw odds from PARAMS.
  const chipOdds = useMemo(
    () =>
      Object.fromEntries(
        AMOUNT_CHIPS.map((a) => [a, Math.round(calc(a, DEMO_VAULT_SOL).oneInN)]),
      ) as Record<number, number>,
    [],
  );

  // Reduced-motion parity (§2.8): static ring, orbs parked on the front arc,
  // YOU orb present and labeled. All information, no physics.
  const parked = useMemo(() => {
    if (!geom) return [];
    return orbs.map((o, i) => {
      const theta = Math.PI * (0.12 + (0.76 * i) / Math.max(1, orbs.length - 1));
      return poseOnRing(geom, theta);
    });
  }, [geom, orbs]);

  return (
    <div ref={stageRef} className="pointer-events-none absolute inset-0">
      {/* aria-live announcements — never under aria-hidden */}
      <div aria-live="polite" className="sr-only">
        {s.announce}
      </div>

      <div aria-hidden className="absolute inset-0">
        {/* THE DRAW RING (§2.1) — one sharp owned ellipse on the action plane.
            z-4: back-arc orbs (z-2) pass BEHIND the stroke, front-arc (z-6)
            in front — the z-flip that makes the flat ellipse read as solid. */}
        {geom && box.w > 0 && (
          <svg
            width={box.w}
            height={box.h}
            viewBox={`0 0 ${box.w} ${box.h}`}
            className={`absolute left-0 top-0 z-[4] ${s.phase === "charge" ? "ring-charging" : ""} ${
              s.winPlate ? "stage-desat" : ""
            }`}
          >
            <path
              className="ring-back"
              d={`M ${geom.cx - geom.a} ${geom.cy} A ${geom.a} ${geom.b} 0 0 1 ${geom.cx + geom.a} ${geom.cy}`}
            />
            <path
              className="ring-front"
              d={`M ${geom.cx - geom.a} ${geom.cy} A ${geom.a} ${geom.b} 0 0 0 ${geom.cx + geom.a} ${geom.cy}`}
            />
          </svg>
        )}

        {/* §2.7 sample HUD — the ring is a sample, and says so. Pass 6 #11:
            right-anchored when it would clip the viewport, and self-contained
            ("demo") even when the SIMULATION badge is out of view. */}
        {geom && (
          <div
            className="absolute z-[5] whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.15em] text-bone/60"
            style={
              geom.mobile
                ? { left: geom.cx, top: geom.cy - geom.b - 22, transform: "translateX(-50%)" }
                : geom.cx + geom.a * 0.62 + 260 > box.w
                  ? {
                      left: geom.cx + geom.a,
                      top: geom.cy - geom.b * 0.72,
                      transform: "translateX(-100%)",
                    }
                  : { left: geom.cx + geom.a * 0.62, top: geom.cy - geom.b * 0.72 }
            }
          >
            showing {orbs.length} of ~{depositorCount.toLocaleString("en-US")} demo depositors
          </div>
        )}

        {!s.reduced ? (
          <div className={`absolute inset-0 ${s.winPlate ? "stage-desat" : ""}`}>
            {/* §3.3 CHARGE: core brightness ramp — now centred on OUR ring */}
            {geom && (
              <div
                className={`absolute h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  s.phase === "charge" ? "stage-core-charge" : "opacity-0"
                }`}
                style={{
                  left: geom.cx,
                  top: geom.cy,
                  background:
                    "radial-gradient(circle, rgba(201,162,39,0.4) 0%, rgba(201,162,39,0.1) 50%, transparent 72%)",
                }}
              />
            )}

            {/* the sampled orb field (§2.3) */}
            {orbs.map((o, i) => (
              <div
                key={i}
                ref={(n) => {
                  orbRefs.current[i] = n;
                }}
                className={`demo-orb absolute left-0 top-0 ${
                  s.phase === "charge" ? "demo-orb-streak" : ""
                }`}
                style={{ width: o.size, height: o.size, opacity: 0.55 }}
              />
            ))}

            {/* YOU orb (§2.4/§2.5) — your flag: front arc only, never hidden,
                sized by stake × time-weight, tethered label billboarded upright */}
            {s.deposit !== null && (
              <div
                ref={youRef}
                className={`demo-orb-you absolute left-0 top-0 ${
                  s.phase === "charge" ? "you-charging" : ""
                } ${
                  s.phase !== "orbit" && s.phase !== "charge" && s.outcome?.personalWin
                    ? "demo-orb-crowned"
                    : ""
                }`}
                style={{ width: 48, height: 48 }}
              >
                <span className="you-label">YOU</span>
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

            {/* §2.4 gold ripple where the orb joins the ring */}
            {joinRipple && (
              <span
                key={joinRipple.seq}
                className="join-ripple absolute z-[7]"
                style={{ left: joinRipple.x, top: joinRipple.y }}
              />
            )}

            {/* §2.4 exit ghost — detaches, arcs down, fades */}
            {exitGhost && (
              <div
                className="demo-orb-you you-exit absolute left-0 top-0 z-[7]"
                style={{
                  width: exitGhost.size,
                  height: exitGhost.size,
                  transform: `translate3d(${exitGhost.x}px, ${exitGhost.y}px, 0) translate(-50%, -50%)`,
                }}
              />
            )}

            {/* §3.4 layer 1: full-stage flash — detectable in a single screenshot */}
            {s.phase === "resolve" && <div className="stage-flash absolute inset-0" />}

            {/* §3.4 layer 2: bloom from the core */}
            {geom && (
              <div
                className={`absolute h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  s.phase === "resolve" ? "stage-bloom" : "opacity-0"
                }`}
                style={{
                  left: geom.cx,
                  top: geom.cy,
                  background:
                    "radial-gradient(circle, rgba(201,162,39,0.6) 0%, rgba(201,162,39,0.2) 45%, transparent 70%)",
                }}
              />
            )}

            {/* §2.7 the vault's win, every cycle: crowns bloom around the CORE
                in a constellation — never on the sampled orbs. */}
            {geom && crowns.length > 0 && (s.phase === "resolve" || s.phase === "settle") && (
              <div className="absolute z-[8]" style={{ left: geom.cx, top: geom.cy }}>
                {crowns.map((c, i) => (
                  <span
                    key={`${s.resultSeq}-${i}`}
                    className="crown-bloom absolute"
                    style={{ left: c.dx, top: c.dy, animationDelay: `${c.delay}ms` }}
                  >
                    <span className="crown-burst" />
                    <svg
                      viewBox="0 0 12 8"
                      className="h-4 w-6 -translate-x-1/2 -translate-y-1/2 text-gold"
                      fill="currentColor"
                    >
                      <path d="M0 8 L1.5 2 L4 5 L6 0 L8 5 L10.5 2 L12 8 Z" />
                    </svg>
                    {c.pop && (
                      <span className="demo-pop absolute -top-7 left-0 -translate-x-1/2 font-mono text-[16px] font-medium text-gold">
                        +{fmt(s.outcome?.personalPrize ?? 0)}
                      </span>
                    )}
                  </span>
                ))}
                <div
                  className="crown-bloom absolute -translate-x-1/2 whitespace-nowrap font-mono text-[12px] tracking-[0.08em] text-gold/90"
                  style={{ top: geom.b * 0.62, animationDelay: "500ms" }}
                >
                  {s.outcome?.winners ?? 20} winners · {fmt(s.outcome?.personalPrize ?? 0)} SOL each
                </div>
              </div>
            )}

            {/* §3.6 SETTLE receipt — types on, holds, slides toward Proof */}
            {s.resultSeq > 0 && (
              <div
                key={s.resultSeq}
                className="receipt absolute bottom-[calc(var(--stage-h,180px)+12px)] left-1/2 -translate-x-1/2 max-w-[94vw] whitespace-nowrap font-mono text-[12px] tracking-[0.08em] text-bone/70 sm:bottom-[calc(var(--stage-h,180px)+16px)] sm:text-[14px]"
              >
                {s.resultLine}
              </div>
            )}
          </div>
        ) : (
          /* Reduced-motion: same ring, orbs parked on the front arc — all
             information, no physics (§2.8). */
          geom && (
            <div className="absolute inset-0">
              {orbs.map((o, i) => {
                const pose = parked[i];
                if (!pose) return null;
                return (
                  <div
                    key={i}
                    ref={(n) => {
                      orbRefs.current[i] = n;
                    }}
                    className="demo-orb absolute left-0 top-0"
                    style={{
                      width: o.size,
                      height: o.size,
                      opacity: pose.opacity,
                      zIndex: pose.front ? 6 : 2,
                      transform: `translate3d(${pose.x}px, ${pose.y}px, 0) translate(-50%, -50%) scale(${pose.scale})`,
                    }}
                  />
                );
              })}
              {s.deposit !== null && (
                <div
                  ref={youRef}
                  className="demo-orb-you absolute left-0 top-0"
                  style={{
                    width: STAKE_PX[s.deposit] ?? 48,
                    height: STAKE_PX[s.deposit] ?? 48,
                    zIndex: 7,
                    transform: `translate3d(${geom.cx}px, ${geom.cy + geom.b}px, 0) translate(-50%, -50%)`,
                  }}
                >
                  <span className="you-label">YOU</span>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* §3.5 WIN plate — center stage, labeled, vignette pulse. Crowns only
          when you actually win, at true odds (§2.7). */}
      {s.winPlate && (
        <div className="pointer-events-none absolute inset-0 z-30">
          <div className="win-vignette absolute inset-0" />
          <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 text-center">
            {/* §5 share-card surface: the demo plate and the launch share card
                are the SAME component (components/WinnerCard.tsx). */}
            <WinnerCard
              amountSol={s.outcome?.personalPrize ?? 0}
              oddsOneInN={s.outcome?.personalOneInN}
              demo
            />
          </div>
        </div>
      )}

      {/* Mega ignition (§3.4) — center-stage, banner holds 5s */}
      {s.ignition && !s.reduced && (
        <div className="demo-ignition pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          {/* §6.1 the real fullbleed asset (pass 5) — replaces the interim
              ignite-moment clip scaled 2×. */}
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            disablePictureInPicture
            aria-hidden
          >
            <source src="/higgsfield/video/vaultdrop-mega-ignition-fullbleed.webm" type="video/webm" />
            <source src="/higgsfield/video/vaultdrop-mega-ignition-fullbleed.mp4" type="video/mp4" />
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
        ref={barRef}
        className={`pointer-events-auto absolute inset-x-0 bottom-0 z-20 border-t border-bone/10 bg-ink/60 backdrop-blur-md transition-opacity duration-300 ${
          s.docked ? "pointer-events-none opacity-0" : "opacity-100"
        } ${s.phase === "charge" ? "stage-bar-charging" : ""}`}
      >
        {/* Pass 6 #1: on phones the badge is the bar's own first row — it may
            never sit on top of a CTA. Floating chip stays on sm+. */}
        <span className="absolute -top-7 right-4 hidden rounded-md border border-bone/30 bg-ink/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-bone/80 backdrop-blur-sm sm:block sm:right-8">
          Simulation · real odds · demo SOL
        </span>
        {/* Pass 6 sound pill — the ritual, scored; OFF by default (STUBS #15) */}
        <button
          onClick={() => {
            setSound(!soundOn);
            track("sound_toggled", { on: !soundOn });
          }}
          aria-pressed={soundOn}
          className={`absolute -top-7 left-4 hidden rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] backdrop-blur-sm transition sm:left-8 sm:block ${
            soundOn
              ? "border-gold/60 bg-ink/70 text-gold"
              : "border-bone/30 bg-ink/70 text-bone/60 hover:text-bone/90"
          }`}
        >
          sound {soundOn ? "on" : "off"}
        </button>

        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-8 sm:py-4">
          <span className="flex w-full items-center justify-between font-mono text-[9px] uppercase tracking-[0.15em] text-bone/60 sm:hidden">
            Simulation · real odds · demo SOL
            <button
              onClick={() => {
                setSound(!soundOn);
                track("sound_toggled", { on: !soundOn });
              }}
              aria-pressed={soundOn}
              className={`rounded-md border px-2 py-0.5 ${
                soundOn ? "border-gold/60 text-gold" : "border-bone/30 text-bone/60"
              }`}
            >
              sound {soundOn ? "on" : "off"}
            </button>
          </span>
          {/* the clock — the page's second read (§3.1). Pass 6 #20: it speaks
              through the whole ritual instead of freezing at 0:00. */}
          <div className="stage-clock">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone/60">
              {s.reduced
                ? "Demo draw"
                : s.phase === "resolve" || s.phase === "settle"
                  ? "Demo draw"
                  : "Demo draw in"}
            </div>
            {s.reduced ? (
              <button
                onClick={s.runStaticDraw}
                className="press-ripple press-scale mt-1 rounded-full border border-gold/50 px-5 py-2 font-mono text-sm text-gold transition hover:bg-gold hover:text-ink"
              >
                Run one draw
              </button>
            ) : (
              <div
                className="flex min-h-[34px] items-center sm:min-h-[48px]"
                role="timer"
                aria-label={
                  s.phase === "resolve"
                    ? "Demo draw resolving"
                    : s.phase === "settle"
                      ? "Demo draw paid"
                      : `Demo draw in ${countdownText}`
                }
              >
                {s.phase === "resolve" ? (
                  <span className="clock-pulse font-mono text-[24px] leading-none tracking-[0.1em] text-gold sm:text-[32px]">
                    DRAWING
                  </span>
                ) : s.phase === "settle" ? (
                  <span className="font-mono text-[24px] leading-none tracking-[0.1em] text-signal sm:text-[32px]">
                    PAID ✓
                  </span>
                ) : (
                  <span
                    className={`font-mono text-[34px] leading-none text-bone tabular-nums sm:text-[48px] ${
                      s.phase === "charge" ? "clock-pulse text-gold" : ""
                    }`}
                  >
                    {countdownText}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* §2.7 pool drains at the hit and re-seeds on the next orbit */}
          <div className="stage-dim font-mono text-[14px] text-bone/70">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-bone/50">
              demo pool
            </span>
            ≈{" "}
            <CountUp
              value={s.phase === "resolve" || s.phase === "settle" ? 0 : s.poolSol}
              durationMs={600}
            />{" "}
            SOL · {s.outcome?.winners ?? 20} winners
          </div>

          <div className={`stage-dim font-mono text-[14px] text-gold ${slam ? "mega-slam" : ""}`}>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-gold/60">
              mega (demo) · 1-in-26 — grows every miss
            </span>
            {fmt(led.pot, 0)} SOL
            {slam && !s.outcome?.megaHit && (
              <span className="ml-2 text-[12px] text-gold/80">+{fmt(led.accrual)} ▲</span>
            )}
          </div>

          {/* §3.5 personal slot — reserved space, zero CLS (B1); §2.6 the odds
              line is honest about time-weight while it accrues; pass 6 #21
              names the bets-closed beat. */}
          <div className="stage-dim min-h-[2.5rem] font-mono text-[14px] sm:min-w-[13rem]">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-bone/50">
              {s.deposit === null ? "spectating" : "your demo orb"}
            </span>
            {s.personal ? (
              s.personal.kind === "win" ? (
                <span className="text-gold">YOU WON {fmt(s.personal.prize)} SOL (demo)</span>
              ) : (
                <span className="text-bone/85">
                  Not this one — 20 crowns landed elsewhere. Your odds carry into
                  the next draw.
                </span>
              )
            ) : s.deposit !== null ? (
              lockedNext ? (
                <span className="text-gold/90">
                  Locked — your orb rides the next draw
                </span>
              ) : (
                <span className="text-signal">
                  {personalOdds !== null ? (
                    held < 1 ? (
                      <>
                        ≈ 1-in-{personalOdds.toLocaleString("en-US")} — you&apos;ve held {heldSecs} of{" "}
                        {cycleSecs}s
                      </>
                    ) : (
                      <>your shot ≈ 1-in-{personalOdds.toLocaleString("en-US")}</>
                    )
                  ) : (
                    <>weight accruing — hold to earn your shot</>
                  )}
                </span>
              )
            ) : nudge ? (
              <span className="text-signal">your turn — drop a demo orb for the next draw</span>
            ) : (
              <span className="text-bone/60">drop an orb in to ride the next draw</span>
            )}
          </div>

          {/* chips dock into the bar (§3.1); selected = gold (B6); tap arcs
              your orb in from the chip's real position (§2.4); each states its
              per-draw odds (pass 6 #20) */}
          <div className={`ml-auto flex flex-wrap items-center gap-2 ${nudge ? "chip-nudge" : ""}`}>
            {AMOUNT_CHIPS.map((a) => (
              <button
                key={a}
                onClick={(e) => onChip(a, e)}
                aria-pressed={s.deposit === a}
                className={`press-ripple press-scale min-h-[44px] rounded-full px-4 py-1 text-center font-mono transition sm:px-3.5 ${
                  s.deposit === a
                    ? "bg-gold text-ink"
                    : "border border-bone/25 text-bone/70 hover:border-gold/60 hover:text-bone"
                }`}
              >
                <span className="block text-xs leading-tight sm:text-sm">
                  {a.toLocaleString("en-US")} SOL
                </span>
                <span
                  className={`block text-[9px] leading-tight ${
                    s.deposit === a ? "text-ink/70" : "text-bone/45"
                  }`}
                >
                  ≈1-in-{chipOdds[a].toLocaleString("en-US")}
                </span>
              </button>
            ))}
            {s.deposit !== null && (
              <button onClick={onLeave} className="link-quiet font-mono text-[11px] text-bone/50">
                take it out
              </button>
            )}
          </div>
        </div>

        {/* session tally — height reserved from first paint (B1). Pass 6
            big-swing: the demo world remembers — a return visit is greeted
            with what its pot really did while they were gone. */}
        <div className="mx-auto h-6 max-w-7xl px-4 pb-2 font-mono text-[10px] text-bone/55 sm:px-8">
          {s.sessionDraws > 0 || s.sessionMegaGrowth > 0 ? (
            <>
              {s.sessionDraws > 0 &&
                `${s.sessionDraws} demo draw${s.sessionDraws === 1 ? "" : "s"} played · `}
              Mega grew +{fmt(s.sessionMegaGrowth, 0)} SOL while you watched
            </>
          ) : away ? (
            <>
              while you were away: {away.draws.toLocaleString("en-US")} demo draw
              {away.draws === 1 ? "" : "s"}
              {away.hits > 0
                ? ` · the Mega hit ${away.hits}× and is rebuilding`
                : ` · Mega grew +${fmt(away.grown, 0)} SOL`}
            </>
          ) : null}
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
        href={APP_URL}
        onClick={() =>
          track("cta_click", { cta: "hero", post_participation: s.participatedResolved })
        }
        className={`press-ripple press-scale inline-block rounded-full bg-gold px-8 py-3.5 font-medium text-ink transition hover:brightness-110 ${
          morphed ? "cta-morph-pulse" : ""
        }`}
      >
        {morphed ? "Make it real — enter the vault" : CTA.heroPrimary}
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
