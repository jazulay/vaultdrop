// Pass 5 §9: "Zero orbs inside the text-safe rect, enforced by an assertion —
// not by eyeballing." This is the CI half (the dev-mode DOM patrol lives in
// DemoDraw.tsx). Keep in sync with lib/ring.ts (plain JS mirror — lib is TS).
import assert from "node:assert/strict";

const MAX_ORB_PX = 72;
const PAD = 12;

function computeRingGeom(w, h, textRects, barTop, mobile) {
  const half = MAX_ORB_PX / 2;
  const vHalf = half * 0.6;

  if (mobile) {
    const copyTop = textRects.length ? Math.min(...textRects.map((r) => r.y)) : h * 0.5;
    const yMin = Math.min(90, h * 0.12) + vHalf;
    const yMax = Math.min(copyTop, barTop) - PAD - half;
    const xMin = 8 + half;
    const xMax = w - 8 - half;
    const geom = {
      cx: (xMin + xMax) / 2,
      cy: (yMin + yMax) / 2,
      a: (xMax - xMin) / 2,
      b: (yMax - yMin) / 2,
      mobile,
    };
    return geom.a > 40 && geom.b > 30 ? geom : null;
  }

  let topBound = 0;
  let leftBound = 0;
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
  const geom = {
    cx: (xMin + xMax) / 2,
    cy: (yMin + yMax) / 2,
    a: (xMax - xMin) / 2,
    b: (yMax - yMin) / 2,
    mobile,
  };
  return geom.a > 60 && geom.b > 36 ? geom : null;
}

function poseOnRing(g, theta) {
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

function intersects(orb, text) {
  return (
    orb.x < text.x + text.width &&
    orb.x + orb.width > text.x &&
    orb.y < text.y + text.height &&
    orb.y + orb.height > text.y
  );
}

function ringClearsText(g, textRects, orbPx = MAX_ORB_PX) {
  for (let i = 0; i < 720; i++) {
    const p = poseOnRing(g, (i / 720) * Math.PI * 2);
    const r = (orbPx * p.scale) / 2;
    const box = { x: p.x - r, y: p.y - r, width: r * 2, height: r * 2 };
    if (textRects.some((t) => intersects(box, t))) return false;
  }
  return true;
}

function ringOnCanvas(g, w, h, orbPx = MAX_ORB_PX) {
  for (let i = 0; i < 720; i++) {
    const p = poseOnRing(g, (i / 720) * Math.PI * 2);
    const r = (orbPx * p.scale) / 2;
    if (p.x - r < 0 || p.x + r > w || p.y - r < 0) return false;
  }
  return true;
}

// --- Scenario 1: the audited desktop viewport (pass 5 §1, 1264×820) --------
// Rects as measured in the audit: H1 x 80→937 y 147→339; sub/CTAs/trust in a
// column ending at x 560, extending to y ≈ 560; stage bar top at 660.
const desktopRects = [
  { x: 80, y: 147, width: 857, height: 192 }, // H1
  { x: 80, y: 363, width: 480, height: 64 },  // sub
  { x: 80, y: 459, width: 420, height: 56 },  // CTA row
  { x: 80, y: 535, width: 380, height: 20 },  // trust line
];
const g1 = computeRingGeom(1264, 820, desktopRects, 660, false);
assert.ok(g1, "desktop geometry must exist at the audited viewport");
assert.ok(ringClearsText(g1, desktopRects), "no orb position may touch a text rect (desktop)");
assert.ok(ringOnCanvas(g1, 1264, 820), "no orb position may leave the canvas (desktop)");
assert.ok(g1.cy - g1.b > 339, "ring top clears the H1 bottom");
assert.ok(g1.cx - g1.a > 560, "ring left clears the copy column");

// --- Scenario 2: mobile (375×812), copy bottom-anchored --------------------
const mobileRects = [
  { x: 24, y: 380, width: 327, height: 180 }, // H1
  { x: 24, y: 574, width: 300, height: 60 },  // sub
  { x: 24, y: 648, width: 280, height: 48 },  // CTAs
];
const g2 = computeRingGeom(375, 812, mobileRects, 690, true);
assert.ok(g2, "mobile geometry must exist");
assert.ok(ringClearsText(g2, mobileRects), "no orb position may touch a text rect (mobile)");
assert.ok(ringOnCanvas(g2, 375, 812), "no orb position may leave the canvas (mobile)");

// --- Depth invariants (§2.3): opacity NEVER 0, z-flip tracks the front arc --
for (let i = 0; i < 720; i++) {
  const theta = (i / 720) * Math.PI * 2;
  const p = poseOnRing(g1, theta);
  assert.ok(p.opacity >= 0.55 - 1e-9 && p.opacity <= 0.95 + 1e-9, `opacity ${p.opacity} out of band`);
  assert.ok(p.scale >= 0.55 - 1e-9 && p.scale <= 1 + 1e-9, `scale ${p.scale} out of band`);
  assert.equal(p.front, Math.sin(theta) > 0, "front flag must track the bottom arc");
  assert.ok(p.speedFactor >= 0.75 - 1e-9 && p.speedFactor <= 1.25 + 1e-9, "speed factor band");
}
// Front-of-stroke vs behind-of-stroke must both actually occur.
const poses = Array.from({ length: 720 }, (_, i) => poseOnRing(g1, (i / 720) * Math.PI * 2));
assert.ok(poses.some((p) => p.front) && poses.some((p) => !p.front), "both arcs populated");

console.log("ring.test: all assertions pass", {
  desktop: { cx: Math.round(g1.cx), cy: Math.round(g1.cy), a: Math.round(g1.a), b: Math.round(g1.b) },
  mobile: { cx: Math.round(g2.cx), cy: Math.round(g2.cy), a: Math.round(g2.a), b: Math.round(g2.b) },
});
