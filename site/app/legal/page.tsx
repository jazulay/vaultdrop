export const metadata = {
  title: "VaultDrop — Legal",
};

/**
 * Placeholder legal copy — every block below is [COUNSEL TO REPLACE]
 * (STUBS.md #2). Sweepstakes/PLS framing pending counsel lexicon.
 */
export default function LegalPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <a href="/" className="link-quiet font-mono text-xs text-bone/60">
        ← back
      </a>
      <h1 className="mt-8 font-display text-4xl font-semibold">Legal</h1>

      <div className="glass mt-8 rounded-xl p-5 font-mono text-xs text-bone/60">
        PLACEHOLDER — this page holds structural placeholders only. All copy below is
        marked [COUNSEL TO REPLACE] and is not legal language.
      </div>

      <section id="tos" className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Terms of Service</h2>
        <p className="mt-4 text-sm leading-relaxed text-bone/60">
          [COUNSEL TO REPLACE — Terms of Service covering: non-custodial nature of the
          protocol, prize savings mechanics, draw eligibility, geographic availability,
          fees (15% of yield), and dispute resolution.]
        </p>
      </section>

      <section id="privacy" className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Privacy Policy</h2>
        <p className="mt-4 text-sm leading-relaxed text-bone/60">
          [COUNSEL TO REPLACE — Privacy policy covering: on-chain data visibility,
          analytics, waitlist email handling.]
        </p>
      </section>

      <section id="sweepstakes" className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Draw Rules</h2>
        <p className="mt-4 text-sm leading-relaxed text-bone/60">
          [COUNSEL TO REPLACE — Official rules for prize draws under applicable
          prize-linked savings / sweepstakes framing.]
        </p>
      </section>
    </main>
  );
}
