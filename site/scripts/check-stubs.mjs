// CI guard (audit P0-1): the build fails if any internal placeholder can reach
// emitted HTML. Legal/counsel stubs must be structurally unable to ship.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = [".next/server/app", ".next/server/pages"];
const PATTERN = /\[(COUNSEL|STUB|TODO|TBD|REPLACE)/i;
const BANNED_TERMS = /\b(guaranteed|risk-free|beat staking)\b/i; // audit §11 copy sweep

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

if (failures.length) {
  console.error("check-stubs: FAIL\n" + failures.join("\n"));
  process.exit(1);
}
console.log("check-stubs: clean — no placeholders or banned terms in emitted HTML");
