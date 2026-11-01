"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleDollarSign, FlaskConical, Handshake, ShieldCheck, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ContractCard } from "@/components/contracts/contract-card";
import { contractTotals } from "@/components/contracts/contract-utils";
import { StatusTabs } from "@/components/contracts/status-tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { toUsd } from "@/components/wallet/token-rates";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { useCurrentCompany, useHydrated } from "@/store/hooks";

type Tab = "all" | "active" | "completed";

export default function EmployerContractsPage() {
  const hydrated = useHydrated();
  const company = useCurrentCompany();
  const contracts = useAppStore((s) => s.contracts);
  const [tab, setTab] = useState<Tab>("all");

  const mine = useMemo(
    () =>
      company
        ? contracts.filter((c) => c.clientCompanyId === company.id).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
        : [],
    [contracts, company],
  );

  const totals = useMemo(() => {
    let activeValue = 0;
    let inEscrow = 0;
    let released = 0;
    for (const c of mine) {
      if (c.status === "active") activeValue += toUsd(c.totalAmount, c.token);
      inEscrow += toUsd(c.escrowBalance, c.token);
      released += toUsd(contractTotals(c).released, c.token);
    }
    return { activeValue, inEscrow, released };
  }, [mine]);

  const counts = useMemo(
    () => ({
      all: mine.length,
      active: mine.filter((c) => c.status === "active").length,
      completed: mine.filter((c) => c.status === "completed").length,
    }),
    [mine],
  );
  const visible = useMemo(() => (tab === "all" ? mine : mine.filter((c) => c.status === tab)), [mine, tab]);

  const header = (
    <PageHeader
      title="Contracts"
      description="Fund milestones, approve delivered work and release payments from a simulated smart-contract escrow."
      actions={
        <Link href="/employer/proposals" className={buttonVariants({ variant: "outline" })}>
          Review proposals
        </Link>
      }
    />
  );

  if (!hydrated) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingSkeleton variant="stats" count={3} />
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Active contract value" value={formatCurrency(totals.activeValue, "USD")} icon={Handshake} accent="primary" hint={`${counts.active} active`} />
        <StatsCard label="Held in escrow" value={formatCurrency(totals.inEscrow, "USD")} icon={ShieldCheck} accent="info" hint="Simulated balance" />
        <StatsCard label="Released to freelancers" value={formatCurrency(totals.released, "USD")} icon={CircleDollarSign} accent="success" hint="Across all contracts" />
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FlaskConical className="size-3.5 shrink-0" aria-hidden />
        Totals are approximate USD values using fixed mock exchange rates. Escrow is simulated — no real funds move.
      </p>

      <StatusTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "All", count: counts.all },
          { value: "active", label: "Active", count: counts.active },
          { value: "completed", label: "Completed", count: counts.completed },
        ]}
      />

      {mine.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No contracts yet"
          description="When you accept a freelancer's proposal, a contract with a simulated escrow workspace is created here."
          action={
            <Link href="/employer/proposals" className={buttonVariants({ variant: "gradient" })}>
              Review proposals
            </Link>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={Handshake} title={`No ${tab} contracts`} description="Contracts with this status will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((contract) => (
            <ContractCard key={contract.id} contract={contract} viewer="employer" />
          ))}
        </div>
      )}
    </div>
  );
}
