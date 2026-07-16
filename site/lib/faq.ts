/** FAQ copy — single source for the accordion and the FAQPage JSON-LD. */
import { PARAMS } from "./calc";

const FEE_PCT = Math.round(PARAMS.protocolFee * 100);

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Is my deposit ever at risk?",
    a: "No. Prizes are funded entirely from staking yield. The program can only move yield into the prize escrow — your principal is not able to fund prizes. You can withdraw your full balance at any time. For the full picture of what can and can't go wrong, see 'What can go wrong' above.",
  },
  {
    q: "What can I actually win?",
    a: "Two things. Weekly prizes, paid from the yield the whole vault earned that week — the bigger the vault, the bigger the pool. And the Mega Vault: a rolling jackpot with a 1-in-26 chance of landing every Sunday, growing every week it doesn't. Your share of tickets is simply your balance over time. Try your own numbers in the calculator above.",
  },
  {
    q: "What happens if I never win?",
    a: "Nothing bad. Your deposit stays yours, redeemable at the program rate any time. The trade is explicit: the yield your SOL earns goes to the prize pool instead of dripping to you. Some weeks — maybe many — that buys you nothing but a ticket's worth of Sunday-evening hope. That's the whole deal, stated plainly.",
  },
  {
    q: "Can whales win everything?",
    a: "They can buy more tickets, not better ones. Weight is strictly proportional to balance × time — every lamport-week has identical odds. And each draw pays multiple winners, so outcomes spread. A whale's 10,000 SOL earns exactly 400× the chances of your 25 — never more.",
  },
  {
    q: "Why balance × time?",
    a: "So no one can swoop in an hour before Sunday's draw, snipe it, and leave. Weight accrues as you hold. It rewards actually saving — and withdrawing mid-epoch simply pro-rates your weight for that week.",
  },
  {
    q: "How do withdrawals work?",
    a: "Redeem jpSOL at the program rate, any time, with no exit fee and no lockup. You receive JitoSOL (optionally swapped back to SOL). Withdrawing ends your entries in future draws; prizes you already won remain claimable. Whether large exits are instant or briefly queued depends on the liquidity buffer — the exact mechanics are published before launch.",
  },
  {
    q: "What is JitoSOL doing here?",
    a: "Deposits are held as JitoSOL, a liquid-staked SOL token. Its staking yield is what funds the draws. Your share token, jpSOL, tracks SOL value and is redeemable for the underlying JitoSOL.",
  },
  {
    q: "What are the fees?",
    a: `We take ${FEE_PCT}% of yield — never your deposit. The remaining yield funds the weekly draws and the Mega Vault.`,
  },
  {
    q: "How are winners chosen?",
    a: "By time-weighted balance: weight = your balance × time held. The depositor set is committed on-chain before each draw, then on-chain verifiable randomness (VRF) picks winners from the locked set. Every draw ships with its proof — see the Proof section.",
  },
  {
    q: "Where is VaultDrop available?",
    a: "We're finalizing the list of supported regions with counsel. It will be published on this page before deposits open — and if you're on the waitlist, we'll tell you the moment your region is confirmed. VaultDrop will not accept deposits from unsupported regions.",
  },
];
