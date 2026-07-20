/**
 * THE DRAW RING (pass 5 §2) — pure geometry for the one ellipse we own.
 *
 * The pass-5 diagnosis: DOM orbs chasing the hero video's baked 3D rings can
 * never agree with them, and the old ellipse spent most of its arc off-canvas
 * or under the headline. The fix is architectural: the video is the set (out
 * of focus, behind), and this ring is the stage — geometrically ours, derived
 * every measure from what is actually on screen.
 *
 * The text-safe rects are a HARD constraint in code (§2.2): the ring is
 * computed to clear them by construction, a dev-mode assertion patrols the
 * live DOM (DemoDraw), and scripts/ring.test.mjs locks the math in CI.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RingGeom {
  cx: number;
  cy: number;
  a: number; // semi-major (x)
  b: number; // semi-minor (y)
  mobile: boolean;
}

/** Largest orb the ring must clear for (the 1,000-SOL YOU orb, §2.5). */
export const MAX_ORB_PX = 72;

const PAD = 12; // breathing room beyond the orb's own radius

/**
 * Derive the ring from measured layout. Desktop: wide blocks (the H1) push the
 * ring's top down; column blocks (sub, CTAs, trust line) push it right — so it
 * lands in the clear zone beside/below the copy (§2.2's rect, generalized to
 * any viewport). Mobile (copy bottom-anchored): the ring takes the band above
 * the copy. Returns null when there's no usable band (assertion-level bug —
 * callers keep the last good geometry).
 */
export function computeRingGeom(
  w: number,
  h: number,
  textRects: Rect[],
  barTop: number,
  mobile: boolean,
): RingGeom | null {
  const half = MAX_ORB_PX / 2;
  const vHalf = half * 0.6; // back-arc orbs render at 55% scale (§2.3)

  let topBound = 0;
  let leftBound = 0;
  if (mobile) {
    const copyTop = textRects.length
      ? Math.min(...textRects.map((r) => r.y))
      : h * 0.5;
    const yMin = Math.min(90, h * 0.12) + vHalf;
    const yMax = Math.min(copyTop, barTop) - PAD - half;
    const xMin = 8 + half;
    const xMax = w - 8 - half;
    const geom: RingGeom = {
      cx: (xMin + xMax) / 2,
      cy: (yMin + yMax) / 2,
      a: (xMax - xMin) / 2,
      b: (yMax - yMin) / 2,
      mobile,
    };
    return geom.a > 40 && geom.b > 30 ? geom : null;
  }

  // Wide blocks constrain the top; column blocks below that line constrain the left.
  for (const r of textRects) {
    if (r.x + r.width > w * 0.7) topBound = Math.max(topBound, r.y + r.height);
  }
  for (const r of textRects) {
    if (r.y + r.height > topBound) leftBound = Math.max(leftBound, r.x + r.width);
  }

  const xMin = leftBound + PAD + half;
  const xMax = w - PAD - half;
  const yMin = topBound + PAD + vHalf;
  const yMax = barTop - PAD - half;
  const geom: RingGeom = {
    cx: (xMin + xMax) / 2,
    cy: (yMin + yMax) / 2,
    a: (xMax - xMin) / 2,
    b: (yMax - yMin) / 2,
    mobile,
  };
  return geom.a > 60 && geom.b > 36 ? geom : null;
}

export interface OrbPose {
  x: number;
  y: number;
  /** 0 = deepest back, 1 = nearest front (bottom of the ellipse). */
  depth: number;
  /** §2.3: 55% at the back, 100% at the front. */
  scale: number;
  /** §2.3: 0.55 at the back — NEVER 0 — 0.95 at the front. */
  opacity: number;
  /** Front arc renders in front of the ring stroke; back arc behind it. */
  front: boolean;
  /** Back-arc orbs sweep faster (perspective, §2.3). */
  speedFactor: number;
}

export function poseOnRing(g: RingGeom, theta: number): OrbPose {
  const s = Math.sin(theta);
  const depth = (s + 1) / 2;
  return {
    x: g.cx + Math.cos(theta) * g.a,
    y: g.cy + s * g.b,
    depth,
    scale: 0.55 + 0.45 * depth,
    opacity: 0.55 + 0.4 * depth,
    front: s > 0,
    speedFactor: 1.25 - 0.5 * depth,
  };
}

/** Constrain the YOU orb to the visible front sweep (§2.4) — a designed cheat. */
export function youTheta(t: number): number {
  return Math.PI / 2 + Math.sin(t * 0.22) * 0.95;
}

/** Does an orb's bounding box intersect a text-safe rect? (dev assertion + CI) */
export function intersects(orb: Rect, text: Rect): boolean {
  return (
    orb.x < text.x + text.width &&
    orb.x + orb.width > text.x &&
    orb.y < text.y + text.height &&
    orb.y + orb.height > text.y
  );
}

/**
 * CI form of the §9 assertion: sample the whole ellipse at every orb size and
 * verify no position can touch a text rect. Used by scripts/ring.test.mjs.
 */
export function ringClearsText(g: RingGeom, textRects: Rect[], orbPx = MAX_ORB_PX): boolean {
  for (let i = 0; i < 720; i++) {
    const p = poseOnRing(g, (i / 720) * Math.PI * 2);
    const r = (orbPx * p.scale) / 2;
    const box: Rect = { x: p.x - r, y: p.y - r, width: r * 2, height: r * 2 };
    if (textRects.some((t) => intersects(box, t))) return false;
  }
  return true;
}
