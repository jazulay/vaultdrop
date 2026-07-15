import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Header, PrelaunchBanner, StateSwitcher } from "@/components/Chrome";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: "600",
  display: "optional",
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
  title: "VaultDrop App — prize savings vault",
  description: "Deposit, withdraw, prizes, transfers. Principal never at risk.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${instrument.variable} ${plexMono.variable} bg-ink font-body text-bone antialiased`}
      >
        <PrelaunchBanner />
        <Header />
        <main className="mx-auto w-full max-w-3xl px-4 pb-32 pt-4">{children}</main>
        <StateSwitcher />
      </body>
    </html>
  );
}
