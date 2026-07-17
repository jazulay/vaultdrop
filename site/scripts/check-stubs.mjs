// CI guard (audit P0-1): the build fails if any internal placeholder can reach
// emitted HTML. Legal/counsel stubs must be structurally unable to ship.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = [".next/server/app", ".next/server/pages"];
const PATTERN = /\[(COUNSEL|STUB|TODO|TBD|REPLACE)/i;
// Audit §11 copy sweep + pass-3 §8 lexicon ban pending counsel.
const BANNED_TERMS = /\b(guaranteed|risk-free|beat staking|lottery|sweepstakes|raffle)\b/i;
// Pass 3 §8: client-only surfaces (demo-draw HUD, tallies, year-sim) render
// after hydration and never appear in emitted HTML — sweep their sources too.
const SOURCE_ROOTS = ["components", "lib"];

let failures = [];
function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(html|rsc|txt)$/.test(e)) {
      const body = readFileSync(p, "utf8");
      const stub = body.match(PATTERN);
      if (stub) failures.push(`${p}: placeholder "${stub[0]}"`);
      const banned = body.match(BANNED_TERMS);
      if (banned) failures.push(`${p}: banned term "${banned[0]}"`);
    }
  }
}
ROOTS.forEach(walk);

function walkSource(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walkSource(p);
    else if (/\.(tsx?|mjs)$/.test(e)) {
      const banned = readFileSync(p, "utf8").match(BANNED_TERMS);
      if (banned) failures.push(`${p}: banned term "${banned[0]}" in source`);
    }
  }
}
SOURCE_ROOTS.forEach(walkSource);

if (failures.length) {
  console.error("check-stubs: FAIL\n" + failures.join("\n"));
  process.exit(1);
}
console.log(
  "check-stubs: clean — no placeholders or banned terms in emitted HTML or client sources",
);
