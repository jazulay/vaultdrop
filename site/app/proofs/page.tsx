import S4Proof from "@/components/sections/S4Proof";

export const metadata = {
  title: "VaultDrop — Proofs",
  description: "Every draw, provable. Every number, on-chain.",
};

export default function ProofsPage() {
  return (
    <main className="relative min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <a href="/" className="font-display text-xl font-semibold tracking-tight">
          VaultDrop
        </a>
        <a href="/" className="link-quiet font-mono text-xs text-bone/60">
          ← back
        </a>
      </header>
      <S4Proof />
    </main>
  );
}
