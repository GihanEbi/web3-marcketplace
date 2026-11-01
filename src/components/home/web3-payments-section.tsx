import Link from "next/link";
import { ArrowRight, CircleCheck, Coins, FlaskConical, Lock, ShieldCheck, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const POINTS = [
  { icon: Wallet, title: "Connect any wallet", text: "MetaMask, WalletConnect, Coinbase Wallet, Phantom or Rainbow, no seed phrases ever touch the app." },
  { icon: Lock, title: "Milestone-based escrow", text: "Clients fund each milestone up front. Funds are released only after the work is approved." },
  { icon: Coins, title: "Paid in the token you prefer", text: "USDC, DAI, ETH and more, across Ethereum, Base, Arbitrum and Polygon." },
];

const MILESTONES = [
  { title: "Threat model & initial report", amount: "3,500", state: "Released", tone: "text-success bg-success/15" },
  { title: "Gas optimisation pass", amount: "4,500", state: "In escrow", tone: "text-info bg-info/15" },
  { title: "Fix review & final report", amount: "4,000", state: "Pending", tone: "text-muted-foreground bg-muted" },
];

export function Web3PaymentsSection() {
  return (
    <section className="container mx-auto px-4 py-16 sm:py-20" aria-labelledby="web3-payments">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal className="order-2 lg:order-1">
          <div className="card-glow relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg gradient-brand text-white">
                  <Wallet className="size-4" aria-hidden />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">Chainhire Wallet</p>
                  <p className="font-mono text-[11px] text-muted-foreground">0x7a3F…c91D · Base</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-warning/50 bg-warning/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-warning uppercase">
                <FlaskConical className="size-3" aria-hidden />
                Simulated
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
              {[
                { token: "USDC", amount: "12,450.50" },
                { token: "ETH", amount: "4.2381" },
                { token: "DAI", amount: "3,200.00" },
              ].map((b) => (
                <div key={b.token} className="px-2 py-4">
                  <p className="font-heading text-lg font-semibold tabular-nums">{b.amount}</p>
                  <p className="text-xs text-muted-foreground">{b.token}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Audit &amp; gas-optimise vault</p>
                  <p className="text-xs text-muted-foreground">Escrow contract · 0x91bC…44e0</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <ShieldCheck className="size-4" aria-hidden />
                  Escrow active
                </span>
              </div>
              <ul className="space-y-2">
                {MILESTONES.map((m) => (
                  <li key={m.title} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
                    <CircleCheck className={`size-4 shrink-0 ${m.state === "Released" ? "text-success" : "text-muted-foreground/50"}`} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm">{m.title}</span>
                    <span className="text-sm font-semibold tabular-nums">{m.amount} USDC</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${m.tone}`}>{m.state}</span>
                  </li>
                ))}
              </ul>
              <p className="text-center text-[11px] text-muted-foreground">
                Illustration only. No real wallet, token or smart contract is used anywhere in this demo.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <SectionHeading
            eyebrow="Web3 payments & wallet"
            title={
              <span id="web3-payments">
                Get paid <span className="gradient-text">trustlessly</span>
              </span>
            }
            description="Freelance contracts and DAO bounties run on a simulated escrow that mirrors how on-chain payments work, so you can explore the full flow risk-free."
            className="mb-8 sm:mb-8"
          />
          <ul className="space-y-5">
            {POINTS.map((p) => (
              <li key={p.title} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-pretty text-muted-foreground">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/projects" className={buttonVariants({ variant: "gradient", size: "lg" })}>
              Explore freelance projects
              <ArrowRight aria-hidden />
            </Link>
            <Link href="/bounties" className={buttonVariants({ variant: "outline", size: "lg" })}>
              View bounties
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
