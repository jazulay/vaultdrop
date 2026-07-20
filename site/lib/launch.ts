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
