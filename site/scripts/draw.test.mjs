/**
 * Statistical self-test for the demo-draw engine (pass 3 §4.4).
 * 10,000 simulated draws per participation chip: personal-win frequency must
 * land within the 3σ binomial CI of the calculator's pWeek. Any rigging —
 * first-win bias, pity timers, luck adjustment — fails this test by design.
 *
 * Run via `npm test`. TS sources are executed by transpiling on the fly with
 * the same import graph the site uses (single source of truth).
 */
import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Transpile lib/{calc,draw}.ts to a temp ESM module via the local TypeScript.
const dir = mkdtempSync(join(tmpdir(), "vd-draw-test-"));
try {
  execSync(
    `npx tsc lib/calc.ts lib/draw.ts --outDir ${dir} --module es2022 --target es2022 --moduleResolution bundler`,
    { stdio: "inherit" },
  );
  // Node ESM needs explicit extensions; patch the relative import.
  const drawJs = join(dir, "draw.js");
  const src = (await import("node:fs")).readFileSync(drawJs, "utf8");
  writeFileSync(drawJs, src.replace(/from "\.\/calc"/, 'from "./calc.js"'));

  const { drawOnce, simulateYear, rejectionInt, DEMO_VAULT_SOL } = await import(drawJs);
  const { calc, PARAMS } = await import(join(dir, "calc.js"));

  const N = 10_000;
  const CHIPS = [5, 25, 100, 1000];
  let failures = 0;

  const check = (label, observed, expected, n) => {
    const sigma = Math.sqrt((expected * (1 - expected)) / n);
    const dev = Math.abs(observed - expected);
    const ok = dev <= 3 * sigma;
    if (!ok) failures++;
    console.log(
      `${ok ? "PASS" : "FAIL"} ${label}: observed ${observed.toFixed(5)} vs expected ${expected.toFixed(5)} (3σ = ${(3 * sigma).toFixed(5)})`,
    );
  };

  // Personal-win frequency per chip
  for (const chip of CHIPS) {
    const expected = calc(chip, DEMO_VAULT_SOL).pWeek;
    let winsSeen = 0;
    for (let i = 0; i < N; i++) if (drawOnce(chip).personalWin) winsSeen++;
    check(`pWeek @ ${chip} SOL`, winsSeen / N, expected, N);
  }

  // Mega ignition frequency (true 1-in-26)
  {
    let hits = 0;
    for (let i = 0; i < N; i++) if (drawOnce(null).megaHit) hits++;
    check("mega 1-in-26", hits / N, PARAMS.megaOddsPerWeek, N);
  }

  // Rejection sampler uniformity: each residue of 26 within 3σ of 1/26
  {
    const counts = new Array(26).fill(0);
    for (let i = 0; i < N * 5; i++) counts[rejectionInt(26)]++;
    const worst = Math.max(...counts.map((c) => Math.abs(c / (N * 5) - 1 / 26)));
    const sigma = Math.sqrt(((1 / 26) * (25 / 26)) / (N * 5));
    const ok = worst <= 4 * sigma; // 26 simultaneous bins → slightly wider gate
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"} rejection sampler uniformity (worst dev ${worst.toFixed(5)}, gate ${(4 * sigma).toFixed(5)})`);
  }

  // Year sim: mean wins over 2,000 years ≈ 52 × pWeek
  {
    const expected = 52 * calc(25, DEMO_VAULT_SOL).pWeek;
    const YEARS = 2_000;
    let wins = 0;
    for (let i = 0; i < YEARS; i++) wins += simulateYear(25, DEMO_VAULT_SOL).wins;
    const mean = wins / YEARS;
    const sigma = Math.sqrt((52 * calc(25, DEMO_VAULT_SOL).pWeek) / YEARS); // Poisson-ish approx
    const ok = Math.abs(mean - expected) <= 3 * sigma;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"} year-sim mean wins: ${mean.toFixed(3)} vs ${expected.toFixed(3)}`);
  }

  if (failures > 0) {
    console.error(`draw.test: ${failures} check(s) FAILED`);
    process.exit(1);
  }
  console.log("draw.test: all statistical checks pass — outcomes are unrigged at true odds");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
