"use client";

/**
 * TRANSACTION MACHINERY — complete and real: blockhash, simulation-first,
 * wallet signature, send, confirmation, explorer link, honest error mapping
 * (the WS0 state matrix is the runtime state machine).
 *
 * The ONLY missing piece is instruction encoding, which requires
 * `idl/vault.json` + the program id from Hermes (BLOCKER.md — launch-gating).
 * Until those land, builders throw ProgramNotDeployed and the UI shows the
 * honest "transaction-ready, program pending" state. The day they land, these
 * three builders are implemented against the IDL and everything downstream —
 * signing, states, receipts — already works.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { VAULT_PROGRAM_ID, explorerTx } from "./config";

export class ProgramNotDeployed extends Error {
  constructor() {
    super("vault program not deployed — see BLOCKER.md launch-gating list");
  }
}

/** Runtime tx lifecycle — the deposit/withdraw/claim screens render these. */
export type TxLifecycle =
  | { phase: "idle" }
  | { phase: "program-pending" } // honest: signing works, program doesn't exist yet
  | { phase: "building" }
  | { phase: "simulating" }
  | { phase: "awaiting-signature" }
  | { phase: "pending"; sig: string; explorer: string }
  | { phase: "confirmed"; sig: string; explorer: string }
  | { phase: "wallet-reject" }
  | { phase: "sim-fail"; error: string }
  | { phase: "failed"; error: string; sig?: string };

/* eslint-disable @typescript-eslint/no-unused-vars -- the _params are the
   documented signatures the IDL implementations will consume */
/* ------------------------------------------------------------------ */
/* Instruction builders — THE IDL SEAM (implemented when Hermes ships) */
/* ------------------------------------------------------------------ */

export function programId(): PublicKey {
  if (!VAULT_PROGRAM_ID) throw new ProgramNotDeployed();
  return new PublicKey(VAULT_PROGRAM_ID);
}

export function buildDepositIx(_owner: PublicKey, _amountLamports: bigint): TransactionInstruction {
  programId(); // throws until the program id exists
  // Implemented against idl/vault.json `deposit` the day it ships.
  throw new ProgramNotDeployed();
}

export function buildWithdrawIx(_owner: PublicKey, _amountLamports: bigint): TransactionInstruction {
  programId();
  throw new ProgramNotDeployed();
}

export function buildClaimIx(_owner: PublicKey, _prizeId: string): TransactionInstruction {
  programId();
  throw new ProgramNotDeployed();
}

/* ------------------------------------------------------------------ */
/* Lifecycle runner — real end to end                                  */
/* ------------------------------------------------------------------ */

function isUserRejection(e: unknown): boolean {
  const msg = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();
  const name = e instanceof Error ? e.name : "";
  return (
    name === "WalletSignTransactionError" ||
    name === "WalletSendTransactionError" && msg.includes("reject") ||
    msg.includes("user rejected") ||
    msg.includes("rejected the request") ||
    msg.includes("declined")
  );
}

export async function runTx(opts: {
  connection: Connection;
  wallet: WalletContextState;
  build: () => TransactionInstruction[];
  onPhase: (l: TxLifecycle) => void;
}): Promise<void> {
  const { connection, wallet, build, onPhase } = opts;
  if (!wallet.publicKey) return;

  let ixs: TransactionInstruction[];
  onPhase({ phase: "building" });
  try {
    ixs = build();
  } catch (e) {
    if (e instanceof ProgramNotDeployed) {
      onPhase({ phase: "program-pending" });
      return;
    }
    onPhase({ phase: "failed", error: e instanceof Error ? e.message : String(e) });
    return;
  }

  try {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    const tx = new Transaction({
      feePayer: wallet.publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(...ixs);

    // Simulation-first: a failing program call must be caught BEFORE the
    // wallet ever opens (sim-fail state carries the program's own error).
    onPhase({ phase: "simulating" });
    const sim = await connection.simulateTransaction(tx);
    if (sim.value.err) {
      const logs = sim.value.logs?.filter((l) => /error|failed/i.test(l)).slice(-2) ?? [];
      onPhase({
        phase: "sim-fail",
        error: `simulation failed before send: ${logs.join(" · ") || JSON.stringify(sim.value.err)}`,
      });
      return;
    }

    onPhase({ phase: "awaiting-signature" });
    const sig = await wallet.sendTransaction(tx, connection);
    onPhase({ phase: "pending", sig, explorer: explorerTx(sig) });

    const conf = await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    if (conf.value.err) {
      onPhase({ phase: "failed", error: JSON.stringify(conf.value.err), sig });
      return;
    }
    onPhase({ phase: "confirmed", sig, explorer: explorerTx(sig) });
  } catch (e) {
    if (isUserRejection(e)) {
      onPhase({ phase: "wallet-reject" });
      return;
    }
    onPhase({ phase: "failed", error: e instanceof Error ? e.message : String(e) });
  }
}
