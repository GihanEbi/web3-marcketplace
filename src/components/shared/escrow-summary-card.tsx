"use client";

import { useMemo } from "react";
import { ArrowDownToLine, CircleCheck, FileUp, FlaskConical, Landmark, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import { formatNumber, formatRelative, shortenAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Contract, Transaction, TransactionType } from "@/types";
import { CopyButton } from "./copy-button";
import { GradientProgress } from "./milestone-tracker";
import { StatusBadge } from "./status-badge";

/** Amber "Simulated · no real funds" pill. */
export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 text-xs font-semibold whitespace-nowrap text-amber-700 ring-1 ring-amber-500/30 ring-inset dark:text-amber-300",
        className,
      )}
    >
      <FlaskConical className="size-3.5" aria-hidden />
      Simulated · no real funds
    </span>
  );
}

const TX_META: Record<TransactionType, { label: string; icon: LucideIcon; tile: string }> = {
  fund: { label: "Escrow funded", icon: ArrowDownToLine, tile: "bg-info/15 text-info" },
  submit: { label: "Work submitted", icon: FileUp, tile: "bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning" },
  approve: { label: "Milestone approved", icon: CircleCheck, tile: "bg-primary/15 text-primary" },
  release: { label: "Payment released", icon: Send, tile: "bg-success/15 text-success" },
};

interface TransactionListProps {
  transactions: Transaction[];
  limit?: number;
  className?: string;
}

export function TransactionList({ transactions, limit = 5, className }: TransactionListProps) {
  const rows = useMemo(
    () => [...transactions].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit),
    [transactions, limit],
  );

  if (rows.length === 0) {
    return <p className={cn("text-sm text-muted-foreground", className)}>No transactions yet.</p>;
  }

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {rows.map((tx) => {
        const meta = TX_META[tx.type];
        const Icon = meta.icon;
        return (
          <li key={tx.id} className="flex items-center gap-3 py-2.5">
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.tile)}>
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{meta.label}</p>
                {tx.status === "pending" && <StatusBadge status="pending" context="generic" size="sm" />}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-mono">{shortenAddress(tx.hash, 4)}</span>
                <CopyButton value={tx.hash} label="Transaction hash" className="size-5" />
                <span aria-hidden>·</span>
                <span>{formatRelative(tx.at)}</span>
              </div>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums">
              {formatNumber(tx.amount, 2)} <span className="text-xs font-normal text-muted-foreground">{tx.token}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}

interface EscrowSummaryCardProps {
  contract: Contract;
  transactions?: Transaction[];
  className?: string;
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-heading text-base font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function EscrowSummaryCard({ contract, transactions, className }: EscrowSummaryCardProps) {
  const { funded, pending, released } = useMemo(() => {
    let fundedCount = 0;
    let pendingCount = 0;
    let releasedAmount = 0;
    for (const m of contract.milestones) {
      if (m.status === "pending") pendingCount += 1;
      else fundedCount += 1;
      if (m.status === "released") releasedAmount += m.amount;
    }
    return { funded: fundedCount, pending: pendingCount, released: releasedAmount };
  }, [contract.milestones]);

  const pct = contract.totalAmount > 0 ? (released / contract.totalAmount) * 100 : 0;

  return (
    <section
      aria-label="Escrow summary"
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-5",
        "before:pointer-events-none before:absolute before:-top-24 before:-right-24 before:size-64 before:rounded-full before:bg-linear-to-br before:from-indigo-500/15 before:to-violet-500/10 before:blur-3xl",
        className,
      )}
    >
      <div className="relative space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-violet-500/30">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-heading text-base font-semibold">Smart-contract escrow</h3>
              <p className="text-xs text-muted-foreground">Funds are held until milestones are approved</p>
            </div>
          </div>
          <SimulatedBadge />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Total contract value</p>
            <p className="font-heading text-3xl font-bold tracking-tight tabular-nums">
              <span className="gradient-text">{formatNumber(contract.totalAmount, 2)}</span>{" "}
              <span className="text-lg font-semibold text-muted-foreground">{contract.token}</span>
            </p>
          </div>
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-info/15 px-2.5 text-xs font-medium text-info ring-1 ring-info/30 ring-inset">
            <Landmark className="size-3.5" aria-hidden />
            {contract.network}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Released</span>
            <span className="tabular-nums">{Math.round(pct)}%</span>
          </div>
          <GradientProgress value={pct} label="Contract funds released" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="In escrow" value={`${formatNumber(contract.escrowBalance, 2)} ${contract.token}`} sub="Available balance" />
          <Metric label="Released" value={`${formatNumber(released, 2)} ${contract.token}`} />
          <Metric label="Funded" value={String(funded)} sub={funded === 1 ? "milestone" : "milestones"} />
          <Metric label="Pending" value={String(pending)} sub={pending === 1 ? "milestone" : "milestones"} />
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Escrow address</span>
          <span className="font-mono">{shortenAddress(contract.escrowAddress, 6)}</span>
          <CopyButton value={contract.escrowAddress} label="Escrow address" />
        </div>

        {transactions && (
          <div>
            <h4 className="mb-1 text-sm font-semibold">Recent transactions</h4>
            <TransactionList transactions={transactions} limit={4} />
          </div>
        )}
      </div>
    </section>
  );
}
