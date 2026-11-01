"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/shared/company-logo";
import { GradientProgress } from "@/components/shared/milestone-tracker";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { daysUntil, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCandidate, useCompany } from "@/store/hooks";
import type { Contract } from "@/types";
import { contractHref, contractTotals, nextMilestone } from "./contract-utils";

interface ContractCardProps {
  contract: Contract;
  viewer: "seeker" | "employer";
  className?: string;
}

export function ContractCard({ contract, viewer, className }: ContractCardProps) {
  const company = useCompany(contract.clientCompanyId);
  const freelancer = useCandidate(contract.freelancerId);
  const totals = useMemo(() => contractTotals(contract), [contract]);
  const next = useMemo(() => nextMilestone(contract), [contract]);
  const href = contractHref(contract.id, viewer);

  const dueIn = next ? daysUntil(next.dueDate) : 0;
  const overdue = next !== undefined && dueIn < 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "group relative flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {viewer === "seeker" && company && <CompanyLogo company={company} size="md" />}
        {viewer === "employer" && freelancer && <UserAvatar name={freelancer.name} src={freelancer.avatar} size="md" />}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base leading-snug font-semibold text-balance">
            <Link
              href={href}
              className="rounded-sm outline-none after:absolute after:inset-0 after:content-[''] hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {contract.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {viewer === "seeker" ? (company?.name ?? "Client") : (freelancer?.name ?? "Freelancer")}
            {viewer === "employer" && freelancer && <span className="text-muted-foreground/70"> · {freelancer.headline}</span>}
          </p>
        </div>
        <StatusBadge status={contract.status} context="generic" size="sm" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Contract value</p>
          <p className="font-heading text-xl font-semibold tabular-nums">
            {formatNumber(contract.totalAmount, 2)}{" "}
            <span className="text-sm font-medium text-muted-foreground">{contract.token}</span>
          </p>
        </div>
        <span className="inline-flex h-6 items-center rounded-full bg-info/15 px-2.5 text-xs font-medium text-info ring-1 ring-info/30 ring-inset">
          {contract.network}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {totals.releasedCount} of {totals.milestoneCount} milestones released
          </span>
          <span className="tabular-nums">{Math.round(totals.progress)}%</span>
        </div>
        <GradientProgress value={totals.progress} label="Project progress" />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" aria-hidden /> Next milestone
          </dt>
          <dd className="mt-0.5 truncate font-medium" title={next?.title}>
            {next ? next.title : "All delivered"}
          </dd>
          {next && (
            <dd className={cn("text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
              {overdue ? "Overdue · " : "Due "}
              {formatDate(next.dueDate)}
            </dd>
          )}
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden /> Escrow balance
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {formatNumber(contract.escrowBalance, 2)} {contract.token}
          </dd>
          <dd className="text-xs text-muted-foreground">Simulated</dd>
        </div>
      </dl>

      <div className="mt-auto flex justify-end border-t border-border pt-4">
        <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none")}>
          Open workspace
          <ArrowRight aria-hidden />
        </span>
      </div>
    </motion.article>
  );
}
