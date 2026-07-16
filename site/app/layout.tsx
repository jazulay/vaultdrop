import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// LCP budget (≤2.5s on 4G): the H1 is the LCP element and its paint waits on
// this file, so ship one 600 instance instead of the variable font, and use
// "optional" so a late arrival can't re-trigger LCP. Every display use on the
// site is weight 600.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: "600",
  display: "optional",
  // Not preloaded: preloading pulls the font into the H1's simulated critical
  // path. With display:optional the fallback paint is authoritative anyway.
  preload: false,
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  // Production domain lands via NEXT_PUBLIC_SITE_ORIGIN (STUBS.md #9); the
  // localhost fallback keeps rel=canonical auditable on local builds.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3311"),
  alternates: { canonical: "/" },
  title: "VaultDrop — Never lose. Sometimes win big.",
  description:
    "Prize savings on Solana. Deposit SOL, keep your principal, withdraw anytime — all yield funds weekly prize draws and a rolling Mega Vault.",
  openGraph: {
    title: "VaultDrop — Never lose. Sometimes win big.",
    description:
      "Your staking yield becomes weekly tickets. Principal never plays. Withdraw anytime.",
    type: "website",
    images: [{ url: "/og/vaultdrop-og.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VaultDrop — Never lose. Sometimes win big.",
    description:
      "Your staking yield becomes weekly tickets. Principal never plays. Withdraw anytime.",
    images: ["/og/vaultdrop-og.jpg"],
  },
};

export const viewport = {
  themeColor: "#0B1F24",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${instrument.variable} ${plexMono.variable} grain bg-ink font-body text-bone antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
