/**
 * SAFETY (audit §6.7, new) — "What can go wrong (and what can't)".
 * Risks stated plainly with mitigations; hiding them just moves the
 * conversation to X. Only true claims; unknowns say "published before launch".
 */
export default function Safety() {
  return (
    <section className="relative bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          What can go wrong (and what can&apos;t)
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="glass rounded-2xl border-signal/25 p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal">
              Can&apos;t
            </div>
            <ul className="mt-4 space-y-4 text-sm leading-relaxed text-bone/85">
              <li>
                <span className="text-bone">Your principal funding prizes.</span>{" "}
                The program can only move yield into the prize escrow — deposits
                are structurally out of its reach. The invariant is one line of
                math, published with the docs before deposits open.
              </li>
              <li>
                <span className="text-bone">Being locked in.</span> jpSOL
                redeems at the program rate any time. No lockups, no exit fee,
                no permission.
              </li>
            </ul>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-bone/50">
              Can — and what we do about it
            </div>
            <ul className="mt-4 space-y-4 text-sm leading-relaxed text-bone/75">
              <li>
                <span className="text-bone">Smart-contract bugs.</span> The
                program source and its audit status are published on this page
                before deposits open — if they aren&apos;t here yet, deposits
                aren&apos;t open yet.
              </li>
              <li>
                <span className="text-bone">JitoSOL exposure.</span> Deposits
                are held as JitoSOL, a liquid-staked SOL token — its own
                contract and stake-pool risk exist. If the stake pool ever took
                a loss, withdrawals switch to a uniform pro-rata rate: everyone
                exits at the same rate, order doesn&apos;t matter.
              </li>
              <li>
                <span className="text-bone">VRF liveness.</span> If randomness
                is delayed, the draw is delayed. Funds are unaffected —
                withdrawals keep working.
              </li>
              <li>
                <span className="text-bone">Upgrade authority.</span> Who holds
                it, and under what multisig, is disclosed here before launch.
              </li>
            </ul>
          </div>
        </div>

        {/* Pass 6 #8: the six scattered "published before launch" promises,
            gathered into one dated commitment. Mirrored on /legal. */}
        <div className="mt-8 rounded-2xl border border-bone/15 bg-ink/50 p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-bone/50">
            Before deposits open, this page will show
          </div>
          <p className="mt-3 text-sm leading-relaxed text-bone/70">
            Program addresses and source · audit status and report · upgrade
            authority and its multisig · the docs, including the deposit-safety
            invariant · final parameters · official draw rules and withdrawal
            mechanics.{" "}
            <a href="/legal" className="link-quiet text-bone/80">
              The full checklist lives on the Legal page
            </a>{" "}
            — until every item is filled in, deposits stay closed.
          </p>
        </div>
      </div>
    </section>
  );
}
