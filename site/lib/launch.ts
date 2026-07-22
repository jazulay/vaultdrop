/**
 * Single launch gate (audit P0-2 / §10.1). Everything label- or state-dependent
 * on launch reads from here — never from scattered conditions.
 *
 * DAY-ONE PIVOT (2026-07-20, Joseph): there is no waitlist. The vault app is
 * the destination from day one — every CTA routes there. The app tells the
 * truth about what's live (its banner derives from its own runtime config),
 * so the site links to it unconditionally.
 */
export const LAUNCHED = process.env.NEXT_PUBLIC_LAUNCHED === "1";

/** Epoch-1 open, UTC ISO (Appendix B Q3). Unset → no countdown is rendered. */
export const EPOCH1_UTC: string | null = process.env.NEXT_PUBLIC_EPOCH1_UTC ?? null;

/** The vault app — the one destination every CTA points at. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app-production-c038.up.railway.app";

export const CTA = {
  navPill: LAUNCHED ? "Deposit" : "Open the vault",
  heroPrimary: LAUNCHED ? "Deposit" : "Open the vault",
  appButton: LAUNCHED ? "Deposit" : "Enter the vault",
} as const;

/**
 * Pass 7 C2 — ONE truth about what today is. Every surface that mentions the
 * present tense reads this map; no section may invent its own version of NOW.
 * "demo": the vault app is open and real, deposits arm at epoch 1; the demo
 * table on this page is live. "live": deposits are on.
 */
export const LAUNCH_STATE: "demo" | "live" = LAUNCHED ? "live" : "demo";

export const NOW = {
  /** Mega section status chip. */
  megaChip: LAUNCHED ? "Live" : "Demo table live · real pot at epoch 1",
  /** Mega section closing line (label + link text). */
  megaCtaLabel: LAUNCHED ? "Next draw · Sunday 18:00 UTC" : "Epoch 1 opens soon",
  megaCtaLink: LAUNCHED ? null : "the vault app is already open — step inside →",
  /** Final CTA subline. */
  finalSub: LAUNCHED
    ? "Deposits are open. Your SOL stays yours — withdraw anytime."
    : "Epoch 1 is the smallest the vault will ever be — you'll never win more often than at the start. The app is open today; deposits arm at epoch 1.",
} as const;
