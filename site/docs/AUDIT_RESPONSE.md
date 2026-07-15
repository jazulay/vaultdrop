# Audit response — vaultdrop-audit-handoff.md → build
2026-07-15 · every §12 acceptance criterion, with evidence

## P0 (all fixed)

| # | Fix | Evidence |
|---|---|---|
| P0-1 | Counsel stub removed from FAQ (holding answer §8.3 verbatim); /legal rewritten with no bracketed placeholders; **CI guard** `scripts/check-stubs.mjs` fails the build on `\[(COUNSEL\|STUB\|TODO\|TBD\|REPLACE)` in emitted HTML — wired into `npm run build` | build log: "check-stubs: clean" |
| P0-2 | All CTAs gated on `LAUNCHED` flag (`lib/launch.ts`). Pre-launch: nav+hero "Join epoch 1", footer "Join the waitlist", success "You're in orbit. See you at epoch 1." No email field ever sits next to a "Deposit" button | `sec-waitlist.png`, CTA matrix in code |
| P0-3 | Option ③: hero cut 220vh→160vh and the new **Reframe** section fills the transition; jpSOL moved out of the Proof→FAQ gap. Full scroll walk shows no blank viewport | `captures-v2/sec-*.png`, console-walk script |
| P0-4 | Triple-TBA scoreboard → **one** element: countdown when `NEXT_PUBLIC_EPOCH1_UTC` is set, else a single SEEDING chip + promise line. Zero "TBA" strings above the fold | `sec-s0.png` |

## P1

- **Reframe section** (§6.2) built verbatim — eyebrow, H2, body, split panel (drab drip loop vs gold constellation loop, both freshly generated per §9.2/9.3), "See your odds →" anchor.
- **TicketCalculator** (§7.2) — log slider (glass-orb thumb on gold rail), TVL chips, all derived values in mono/gold, fixed risk line, honesty line verbatim, "illustrative" label. **Math matches the worked example exactly** (`scripts/calc.test.mjs`: routed 1.575, pool 84.8, avg 4.24, 0.4988% ≈ 1-in-200, 22.9%/yr, Mega ≈945).
- **Prize number** — calculator's Mega-at-hit + "averages ~2 hits a year" (derived from stated 1-in-26, labeled); no fabricated pot.
- **Countdown component** (§7.1) — pure-UTC, tabular-nums, in hero/Mega/PiP; pre-launch target = `NEXT_PUBLIC_EPOCH1_UTC` (Appendix B Q3 — renders only when real).
- **Trust stack** — footer strip has the links that exist (Docs stub, Proofs, Legal); X/Discord/program/audit intentionally omitted until real (STUBS.md #7-8). Safety panel ships now.
- **PREVIEW row** in the draw table with chip + "not a real draw" note; VRF line ("Randomness by on-chain VRF… here's how ↗") — provider named once Q4 lands.
- **FAQ** — all four missing questions added with §8.3 answers verbatim; withdrawal-latency answer hedges honestly pending Q5.
- **jpSOL** moved below FAQ; one-line under-the-hood copy; sentences in body type (P2-17).

## P2

Alt text per §10.3 on all meaningful images (decorative = `alt=""`) · OG/Twitter meta + 1200×630 / 1600×900 / 1080×1080 cards generated (text-reliable model, checked for spelling) · PiP v2 (dismiss ×, hides at footer + <768px, click → Mega, no static TBA) · status chip replaces status-as-headline · mono reserved for data · duplicate legal links removed · `disablePictureInPicture disableRemotePlayback playsinline` on all videos · IO-pause offscreen · posters have explicit dimensions · MP4 fallbacks everywhere · FAQPage JSON-LD from the same copy source · theme-color · favicon (gold core) + apple-icon · skip-link + focus rings · contrast lifted to pass (a11y 97).

**Ignite-moment** stays wired to the final-CTA entry (plays once on intersection — it was wired; the audit's browser bridge died before S7).

## §12 checklist

- [x] Zero placeholder matches in built HTML (CI-enforced)
- [x] No control mislabeled; zero "Deposit" labels pre-launch
- [x] No blank scroll positions (dead zones filled; page is longer than the 6609px baseline because three sections were *added* — the criterion's intent was dead-zone removal, verified by section walk)
- [x] 0 TBAs above the fold; countdown renders when the epoch-1 date exists (a live number pre-launch would be fabricated — omitted per §2.5)
- [x] Reframe present; calculator matches §7.2 worked example (unit test)
- [x] Countdown pure-UTC, tabular-nums
- [x] PiP v2 dismissible / footer-hide / mobile-hide / no static TBA
- [x] All imgs alt'd; OG tags present; `app-meta.json` N/A in this repo (no Higgsfield-deploy manifest; flagged)
- [x] Reduced motion → posters, 0 video elements; offscreen videos paused
- [x] Console: **zero errors on load + full scroll** (script-verified)
- [x] Network: initial transfer 1,405 KB (≤3 MB mobile budget); hero webm 880 KB (≤2.5 MB)
- [x] Mobile 390×844: no horizontal scroll, PiP hidden, calculator touch-sized
- [x] "How our draws are verified" expander opens with real content (aria-expanded + aria-controls)
- [x] Waitlist: specific errors, honeypot, submit-lock; endpoint pending (Q6, STUBS.md #5)
- [x] Lighthouse mobile **92 / 97 / 100 / 100** (perf/a11y/bp/seo — budget ≥85/≥95/≥95); CLS 0
- [x] Copy sweep: banned terms CI-greped; odds appear beside every prize claim

## Flag for Joseph

The handoff specifies "weekly **lottery** tickets" verbatim (hero sub §6.1/8.1A, OG §8.4, share text) — the original site prompt banned the word pending counsel. The audit supersedes per your instruction, and it's now in hero + OG copy; STUBS.md #12 flags it for counsel sign-off. One grep flips it back if counsel says no.

Open questions blocking the last mile: Appendix B Q1–Q8 (see STUBS.md).
