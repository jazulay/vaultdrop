export const metadata = {
  title: "VaultDrop — Legal",
};

/**
 * Holding copy only — final language ships from counsel (STUBS.md #2).
 * No bracketed placeholders may appear here: the check-stubs CI guard fails
 * the build if one reaches emitted HTML.
 */
export default function LegalPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <a href="/" className="link-quiet font-mono text-xs text-bone/60">
        ← back
      </a>
      <h1 className="mt-8 font-display text-4xl font-semibold">Legal</h1>

      <p className="mt-6 text-sm leading-relaxed text-bone/70">
        VaultDrop is pre-launch. The documents below are being finalized with
        counsel and will be published on this page before deposits open.
        Nothing on this site is an offer to accept deposits.
      </p>

      <section id="tos" className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Terms of Service</h2>
        <p className="mt-4 text-sm leading-relaxed text-bone/60">
          Published before deposits open. They will cover the non-custodial
          nature of the protocol, prize-draw mechanics and eligibility,
          geographic availability, fees — taken only from yield, never your
          deposit, with the exact percentage published in these Terms — and
          dispute resolution.
        </p>
      </section>

      <section id="privacy" className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Privacy Policy</h2>
        <p className="mt-4 text-sm leading-relaxed text-bone/60">
          Published before deposits open. It will cover on-chain data
          visibility, analytics, and how any contact details you share with us
          are stored and used.
        </p>
      </section>

      <section id="draw-rules" className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Draw Rules</h2>
        <p className="mt-4 text-sm leading-relaxed text-bone/60">
          Official rules for the weekly draws and the Mega Vault — odds,
          eligibility, and claim windows — will be published here before the
          first draw. Every draw ships with its on-chain proof regardless.
        </p>
      </section>

      {/* Pass 6 #8: every scattered "published before launch" promise, in one
          accountable place. This list becomes receipts on launch day. */}
      <section id="before-deposits" className="mt-12">
        <h2 className="font-display text-2xl font-semibold">
          Before deposits open, this page will show
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-bone/60">
          <li>The program addresses, and a link to the program source.</li>
          <li>Audit status — who audited, and the report.</li>
          <li>The upgrade authority, and the multisig that holds it.</li>
          <li>The protocol documentation, including the deposit-safety invariant.</li>
          <li>Final protocol parameters: fee, winner count, Mega share, APY source.</li>
          <li>Official draw rules, withdrawal mechanics, and geographic availability.</li>
        </ol>
        <p className="mt-3 text-sm text-bone/50">
          Until every item above is filled in, deposits stay closed. That is the
          order of operations.
        </p>
      </section>
    </main>
  );
}
