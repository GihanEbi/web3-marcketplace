"use client";

import { useMemo, type ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CopyButton } from "@/components/shared/copy-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { Transaction, TransactionType } from "@/types";

export const TX_LABEL: Record<TransactionType, string> = {
  fund: "Escrow funded",
  submit: "Work submitted",
  approve: "Milestone approved",
  release: "Payment released",
};

const TX_FUNCTION: Record<TransactionType, string> = {
  fund: "depositToEscrow(milestoneId)",
  submit: "submitWork(milestoneId, note)",
  approve: "approveMilestone(milestoneId)",
  release: "releasePayment(milestoneId)",
};

/** Deterministic number derived from a slice of the (fake) hash. */
function fromHash(hash: string, start: number, length: number): number {
  const n = parseInt(hash.slice(start, start + length), 16);
  return Number.isNaN(n) ? 0 : n;
}

function derivedAddress(hash: string, offset: number): string {
  return `0x${hash.slice(2 + offset, 42 + offset)}`;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="text-xs text-muted-foreground sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 text-sm break-all">{children}</dd>
    </div>
  );
}

function Mono({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex max-w-full items-start gap-1">
      <span className="font-mono text-xs leading-5">{value}</span>
      <CopyButton value={value} label={label} className="size-5 shrink-0" />
    </span>
  );
}

interface TransactionDetailDialogProps {
  tx: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** "View mock transaction" – every field is fabricated and the dialog says so. */
export function TransactionDetailDialog({ tx, open, onOpenChange }: TransactionDetailDialogProps) {
  const contracts = useAppStore((s) => s.contracts);
  const companies = useAppStore((s) => s.companies);
  const candidates = useAppStore((s) => s.candidates);

  const detail = useMemo(() => {
    if (!tx) return null;
    const contract = contracts.find((c) => c.id === tx.contractId);
    const milestone = contract?.milestones.find((m) => m.id === tx.milestoneId);
    const company = companies.find((c) => c.id === contract?.clientCompanyId);
    const freelancer = candidates.find((c) => c.id === contract?.freelancerId);
    const client = company?.walletAddress ?? derivedAddress(tx.hash, 0);
    const worker = freelancer?.walletAddress ?? derivedAddress(tx.hash, 12);
    const escrow = contract?.escrowAddress ?? derivedAddress(tx.hash, 24);
    const from = tx.type === "submit" ? worker : tx.type === "release" ? escrow : client;
    const to = tx.type === "release" ? worker : escrow;
    return {
      milestone,
      from,
      to,
      block: 19_000_000 + (fromHash(tx.hash, 2, 6) % 900_000),
      gasUsed: 48_000 + (fromHash(tx.hash, 8, 5) % 120_000),
      nonce: fromHash(tx.hash, 14, 2),
      movesFunds: tx.type === "fund" || tx.type === "release",
    };
  }, [tx, contracts, companies, candidates]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{tx ? TX_LABEL[tx.type] : "Transaction"}</DialogTitle>
          <DialogDescription>Mock transaction receipt generated for this demo.</DialogDescription>
        </DialogHeader>

        <div
          role="note"
          className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-200"
        >
          <FlaskConical className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-bold tracking-wide uppercase">Simulated — no on-chain activity</p>
            <p className="text-xs text-pretty opacity-90">
              This hash, block, gas and these addresses are fabricated locally. Nothing was broadcast to the {tx?.network ?? ""}{" "}
              network and no real funds moved.
            </p>
          </div>
        </div>

        {tx && detail && (
          <dl className="max-h-[50vh] divide-y divide-border overflow-y-auto">
            <Field label="Transaction hash">
              <Mono value={tx.hash} label="Transaction hash" />
            </Field>
            <Field label="Status">
              <StatusBadge status={tx.status} context="generic" size="sm" />
            </Field>
            <Field label="Action">
              <span className="font-medium">{TX_LABEL[tx.type]}</span>
              {detail.milestone && <span className="text-muted-foreground"> · {detail.milestone.title}</span>}
            </Field>
            <Field label="Contract call">
              <span className="font-mono text-xs">{TX_FUNCTION[tx.type]}</span>
            </Field>
            <Field label="Timestamp">{formatDateTime(tx.at)}</Field>
            <Field label="Network">{tx.network} (mock)</Field>
            <Field label="Block (mock)">
              <span className="font-mono text-xs">#{formatNumber(detail.block)}</span>
              <span className="text-muted-foreground"> · 12 confirmations</span>
            </Field>
            <Field label="From">
              <Mono value={detail.from} label="From address" />
            </Field>
            <Field label="To">
              <Mono value={detail.to} label="To address" />
            </Field>
            <Field label="Milestone amount">
              {formatNumber(tx.amount, 2)} {tx.token}
            </Field>
            <Field label="Value transferred">
              {detail.movesFunds ? `${formatNumber(tx.amount, 2)} ${tx.token} (simulated)` : "0 — state change only"}
            </Field>
            <Field label="Gas used (mock)">
              <span className="font-mono text-xs">{formatNumber(detail.gasUsed)}</span>
              <span className="text-muted-foreground"> · nonce {detail.nonce}</span>
            </Field>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}
