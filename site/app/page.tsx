import SmoothScroll from "@/components/SmoothScroll";
import SiteHeader from "@/components/SiteHeader";
import HeroOrrery from "@/components/HeroOrrery";
import Reframe from "@/components/sections/Reframe";
import S2How from "@/components/sections/S2How";
import Calculator from "@/components/sections/Calculator";
import S3Mega from "@/components/sections/S3Mega";
import S4Proof from "@/components/sections/S4Proof";
import Safety from "@/components/sections/Safety";
import S5Jpsol from "@/components/sections/S5Jpsol";
import S6Faq from "@/components/sections/S6Faq";
import S7Cta from "@/components/sections/S7Cta";
import { FAQ } from "@/lib/faq";

/* Section order per audit §6:
   Hero → Reframe → How → Calculator → Mega → Proof → Safety → FAQ → (builders) → Final CTA */

export default function Home() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="relative">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-steel focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <SmoothScroll />

      {/* Pass 6 #15: header returns on scroll-up (components/SiteHeader). */}
      <SiteHeader />

      {/* Skip-link target: top of main content, directly past the header nav
          (audit pass 2 NF-5 — #how skipped keyboard users past Reframe). */}
      <div id="content" tabIndex={-1} />
      <HeroOrrery />
      <Reframe />
      <S2How />
      <Calculator />
      <S3Mega />
      <S4Proof />
      <Safety />
      <S6Faq />
      <S5Jpsol />
      <S7Cta />

      <footer className="border-t border-bone/10 bg-ink px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row">
          <span className="text-xs text-bone/40">VaultDrop — prize savings on Solana</span>
          {/* Trust strip (audit §6.10) — only live links render; X / Discord /
              Program / Audit land here as they become real (STUBS.md). */}
          <div className="flex flex-wrap gap-6 font-mono text-xs text-bone/40">
            {/* Pass 6 #8: no dead anchors — "Docs" returns as a link when the
                URL exists (STUBS.md #4). */}
            <span title="Published before deposits open">Docs — soon</span>
            <a href="/proofs" className="link-quiet">
              Proofs
            </a>
            <a href="/legal" className="link-quiet">
              Legal
            </a>
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}
