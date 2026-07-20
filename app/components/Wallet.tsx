"use client";

import { useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { CLUSTER, RPC_URL } from "@/lib/config";

/**
 * REAL wallet connection — live from day one, no env required. Phantom and
 * Solflare declared explicitly; any Wallet-Standard wallet (Backpack etc.) is
 * auto-detected by the adapter. autoConnect keeps returning users signed in.
 */
export function WalletCtx({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => RPC_URL ?? clusterApiUrl(CLUSTER), []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function short(pk: string): string {
  return `${pk.slice(0, 4)}…${pk.slice(-4)}`;
}

/** House-styled connect button (replaces the WS0 hardcoded address chip). */
export function WalletButton({ label = "Connect wallet" }: { label?: string }) {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    return (
      <button
        onClick={() => disconnect().catch(() => {})}
        title="Click to disconnect"
        className="group rounded-full border border-bone/25 px-4 py-1.5 font-mono text-xs text-bone/80 transition hover:border-fail/50 hover:text-fail"
      >
        <span className="group-hover:hidden">{short(publicKey.toBase58())}</span>
        <span className="hidden group-hover:inline">disconnect</span>
      </button>
    );
  }
  return (
    <button
      onClick={() => setVisible(true)}
      disabled={connecting}
      className="rounded-full bg-gold px-5 py-1.5 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-60"
    >
      {connecting ? "Connecting…" : label}
    </button>
  );
}

/** Full-width connect gate for money screens. */
export function ConnectGate({ action }: { action: string }) {
  return (
    <div className="glass flex flex-col items-start gap-3 rounded-2xl p-5">
      <p className="text-sm text-bone/70">Connect a wallet to {action}.</p>
      <WalletButton />
    </div>
  );
}
