import SmoothScroll from "@/components/SmoothScroll";
import HeroOrrery from "@/components/HeroOrrery";
import S2How from "@/components/sections/S2How";
import S3Mega from "@/components/sections/S3Mega";
import S4Proof from "@/components/sections/S4Proof";
import S5Jpsol from "@/components/sections/S5Jpsol";
import S6Faq from "@/components/sections/S6Faq";
import S7Cta from "@/components/sections/S7Cta";

export default function Home() {
  return (
    <main className="relative">
      <SmoothScroll />

      <header className="absolute left-0 right-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="font-display text-xl font-semibold tracking-tight">
          VaultDrop
        </div>
        <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.15em] text-bone/60">
          <a href="#how" className="hidden hover:text-bone sm:block">
            How
          </a>
          <a href="#proof" className="hidden hover:text-bone sm:block">
            Proof
          </a>
          <a
            href="#waitlist"
            className="rounded-full border border-gold/50 px-5 py-2 normal-case tracking-normal text-gold transition hover:bg-gold hover:text-ink"
          >
            Deposit
          </a>
        </nav>
      </header>

      <HeroOrrery />
      <S2How />
      <S3Mega />
      <S4Proof />
      <S5Jpsol />
      <S6Faq />
      <S7Cta />

      <footer className="border-t border-bone/10 bg-ink px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 font-mono text-xs text-bone/40 sm:flex-row">
          <span>VaultDrop — prize savings on Solana</span>
          <div className="flex gap-6">
            <a href="/proofs" className="link-quiet">
              Proofs
            </a>
            <a href="/legal" className="link-quiet">
              Legal
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
