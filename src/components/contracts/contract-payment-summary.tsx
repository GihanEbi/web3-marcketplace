"use client";

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { Contract } from "@/types";
import { contractTotals } from "./contract-utils";

export function ContractPaymentSummary({ contract }: { contract: Contract }) {
  const totals = useMemo(() => contractTotals(contract), [contract]);
  const fmt = (n: number) => `${formatNumber(n, 2)} ${contract.token}`;

  const rows: { label: string; value: string; hint: string; strong?: boolean }[] = [
    { label: "Contract total", value: fmt(totals.total), hint: "Sum of all milestones", strong: true },
    { label: "Funded", value: fmt(totals.funded), hint: "Deposited into escrow so far" },
    { label: "Released", value: fmt(totals.released), hint: "Paid out to the freelancer" },
    { label: "In escrow", value: fmt(totals.inEscrow), hint: "Held until approval and release" },
    { label: "Remaining", value: fmt(totals.remaining), hint: "Total minus released" },
    { label: "Pending funding", value: fmt(totals.pending), hint: "Milestones not yet funded" },
  ];

  return (
    <section aria-label="Payment summary" className="rounded-xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
        <Wallet className="size-4 text-primary" aria-hidden />
        Payment summary
      </h3>
      <dl className="mt-3 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 py-2">
            <div className="min-w-0">
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd className="sr-only">{row.hint}</dd>
            </div>
            <dd className={row.strong ? "font-heading text-sm font-semibold tabular-nums" : "text-sm font-medium tabular-nums"}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
