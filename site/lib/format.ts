export function formatSol(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Next Sunday 18:00 UTC from `now` — used only when API supplies no next_draw_utc but state is live. */
export function nextSunday18UTC(now: Date): Date {
  const d = new Date(now);
  const day = d.getUTCDay(); // 0 = Sunday
  let addDays = (7 - day) % 7;
  if (addDays === 0 && d.getUTCHours() >= 18) addDays = 7;
  d.setUTCDate(d.getUTCDate() + addDays);
  d.setUTCHours(18, 0, 0, 0);
  return d;
}

export function countdownParts(target: Date, now: Date) {
  let ms = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(ms / 86_400_000);
  ms -= days * 86_400_000;
  const hours = Math.floor(ms / 3_600_000);
  ms -= hours * 3_600_000;
  const minutes = Math.floor(ms / 60_000);
  ms -= minutes * 60_000;
  const seconds = Math.floor(ms / 1_000);
  const pad = (x: number) => String(x).padStart(2, "0");
  return { days, text: `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` };
}
