/**
 * Analytics events (pass 3 §11). No provider is wired yet — events push to
 * window.dataLayer (and console.debug in dev) so a tag manager can be attached
 * without touching call sites. Logged in STUBS.md.
 */

export type VdEvent =
  | "demo_draw_watched"
  | "demo_orb_added"
  | "demo_personal_win"
  | "mega_ignition_seen"
  | "year_sim_run"
  | "cta_click"
  // Pass 6: the site's sole KPI was invisible — every waitlist outcome now fires.
  | "waitlist_submit"
  | "waitlist_result"
  | "sound_toggled";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: VdEvent, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  (window.dataLayer ??= []).push({ event, ...props, ts: Date.now() });
  if (process.env.NODE_ENV !== "production") {
    console.debug("[vd-analytics]", event, props);
  }
}
