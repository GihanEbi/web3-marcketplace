"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ChevronRight, CircleCheck, FileUp, Send, type LucideIcon } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatNumber, formatRelative, shortenAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { Transaction, TransactionType } from "@/types";
import { TransactionDetailDialog, TX_LABEL } from "./transaction-detail-dialog";

const TX_ICON: Record<TransactionType, { icon: LucideIcon; tile: string }> = {
  fund: { icon: ArrowDownToLine, tile: "bg-info/15 text-info" },
  submit: { icon: FileUp, tile: "bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning" },
  approve: { icon: CircleCheck, tile: "bg-primary/15 text-primary" },
  release: { icon: Send, tile: "bg-success/15 text-success" },
};

interface TransactionHistoryProps {
  transactions: Transaction[];
  limit?: number;
  /** show the contract title under each row (useful across several contracts) */
  showContract?: boolean;
  emptyText?: string;
  className?: string;
}

/** Clickable simulated-transaction list; each row opens the "mock transaction" dialog. */
export function TransactionHistory({
  transactions,
  limit,
  showContract = false,
  emptyText = "No transactions yet.",
  className,
}: TransactionHistoryProps) {
  const contracts = useAppStore((s) => s.contracts);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    return limit ? sorted.slice(0, limit) : sorted;
  }, [transactions, limit]);

  const titles = useMemo(() => new Map(contracts.map((c) => [c.id, c.title])), [contracts]);

  if (rows.length === 0) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{emptyText}</p>;
  }

  return (
    <>
      <ul className={cn("divide-y divide-border", className)}>
        {rows.map((tx) => {
          const { icon: Icon, tile } = TX_ICON[tx.type];
          return (
            <li key={tx.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(tx);
                  setOpen(true);
                }}
                aria-label={`View mock transaction: ${TX_LABEL[tx.type]}, ${formatNumber(tx.amount, 2)} ${tx.token}`}
                className="group flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", tile)}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{TX_LABEL[tx.type]}</span>
                    {tx.status === "pending" && <StatusBadge status="pending" context="generic" size="sm" />}
                  </span>
                  {showContract && (
                    <span className="block truncate text-xs text-muted-foreground">{titles.get(tx.contractId) ?? "Contract"}</span>
                  )}
                  <span className="block text-xs text-muted-foreground">
                    <span className="font-mono">{shortenAddress(tx.hash, 4)}</span> · {formatRelative(tx.at)}
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
                  {formatNumber(tx.amount, 2)} <span className="text-xs font-normal text-muted-foreground">{tx.token}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 group-hover:text-foreground" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <TransactionDetailDialog tx={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}
