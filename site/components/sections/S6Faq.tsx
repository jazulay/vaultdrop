"use client";

import { useState } from "react";
import { FAQ } from "@/lib/faq";

export default function S6Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="relative bg-ink py-16 sm:py-24">
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
                  aria-controls={`faq-panel-${i}`}
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden
                    className="faq-chevron ml-4 inline-block font-mono text-xl text-bone/40"
                    style={{ transform: openIdx === i ? "rotate(45deg)" : "none" }}
                  >
                    +
                  </span>
                </button>
              </dt>
              {openIdx === i && (
                <dd id={`faq-panel-${i}`} className="mt-3 pr-8 text-base leading-relaxed text-bone/65">
                  {item.a}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
