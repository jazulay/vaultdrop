/**
 * S5 — jpSOL, for builders. Lives below the FAQ, out of the consumer narrative
 * (audit P1-12). Sentences in body type; mono reserved for the invariant
 * (data-like) per P2-17.
 */
export default function S5Jpsol() {
  return (
    <section className="relative border-y border-bone/10 bg-steel/40 py-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-bone/50">
            for builders
          </div>
          <div className="mt-2 font-display text-3xl font-semibold">jpSOL</div>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm leading-relaxed text-bone/80">
            Under the hood: deposits mint jpSOL, a SOL-value-stable share token.
            1 jpSOL redeems for its SOL value at the program rate, any time —
            draw exposure rides along for free.
          </p>
          <p className="mt-4 font-mono text-xs leading-relaxed text-bone/60">
            invariant: sum(jpSOL supply × rate) ≤ vault assets · deposits mint at rate ·
            withdrawals burn at rate · yield never mints shares
          </p>
          <a
            href="#"
            data-stub="docs-link"
            className="link-quiet mt-6 inline-block text-sm text-bone/70"
          >
            Read the docs ↗
          </a>
        </div>
      </div>
    </section>
  );
}
