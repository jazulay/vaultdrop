/**
 * Single launch gate (audit P0-2 / §10.1). Everything label- or state-dependent
 * on launch reads from here — never from scattered conditions.
 */
export const LAUNCHED = process.env.NEXT_PUBLIC_LAUNCHED === "1";

/** Epoch-1 open, UTC ISO (Appendix B Q3). Unset → no countdown is rendered. */
export const EPOCH1_UTC: string | null = process.env.NEXT_PUBLIC_EPOCH1_UTC ?? null;

export const CTA = {
  navPill: LAUNCHED ? "Deposit" : "Join epoch 1",
  heroPrimary: LAUNCHED ? "Deposit" : "Join epoch 1",
  footerButton: LAUNCHED ? "Deposit" : "Join the waitlist",
  formSuccess: LAUNCHED
    ? "Deposit confirmed — you're in Sunday's draw."
    : "You're in orbit. See you at epoch 1.",
} as const;
