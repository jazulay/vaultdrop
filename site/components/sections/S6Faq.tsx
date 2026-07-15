"use client";

import { useState } from "react";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is my deposit ever at risk?",
    a: "No. Prizes are funded entirely from staking yield. The program can only move yield into the prize escrow — your principal is not able to fund prizes. You can withdraw your full balance at any time.",
  },
  {
    q: "How do withdrawals work?",
    a: "Redeem jpSOL at the program rate, any time, with no exit fee and no lockup. You receive JitoSOL (optionally swapped back to SOL). Withdrawing ends your entries in future draws; prizes you already won remain claimable.",
  },
  {
    q: "What is JitoSOL doing here?",
    a: "Deposits are held as JitoSOL, a liquid-staked SOL token. Its staking yield is what funds the draws. Your share token, jpSOL, tracks SOL value and is redeemable for the underlying JitoSOL.",
  },
  {
    q: "What are the fees?",
    a: "We take 15% of yield — never your deposit. The remaining yield funds the weekly draws and the Mega Vault.",
  },
  {
    q: "How are winners chosen?",
    a: "By time-weighted balance: weight = your balance × time held. The depositor set is committed on-chain before each draw, then on-chain verifiable randomness (VRF) picks winners from the locked set. Every draw ships with its proof — see the Proof section.",
  },
  {
    q: "Where is VaultDrop available?",
    a: "Availability depends on your jurisdiction. Details will be published here before launch. [COUNSEL TO REPLACE — see STUBS.md]",
  },
];

export default function S6Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="relative bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Questions
        </h2>
        <dl className="mt-10 divide-y divide-bone/10">
          {FAQ.map((item, i) => (
            <div key={item.q} className="py-5">
              <dt>
                <button
                  className="flex w-full items-start justify-between text-left text-lg text-bone/90"
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  aria-expanded={openIdx === i}
                >
                  <span>{item.q}</span>
                  <span className="ml-4 font-mono text-bone/40">{openIdx === i ? "−" : "+"}</span>
                </button>
              </dt>
              {openIdx === i && (
                <dd className="mt-3 pr-8 text-base leading-relaxed text-bone/65">{item.a}</dd>
              )}
            </div>
          ))}
        </dl>
        <div className="mt-10 flex gap-6 font-mono text-xs text-bone/45">
          <a href="/legal#tos" className="link-quiet">
            Terms of Service
          </a>
          <a href="/legal#privacy" className="link-quiet">
            Privacy
          </a>
        </div>
      </div>
    </section>
  );
}
