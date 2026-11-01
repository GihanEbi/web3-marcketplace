"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Banknote, CalendarClock, Coins, FileText, Layers } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatNumber, formatRelative, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCompany } from "@/store/hooks";
import type { Company, FreelanceProject, Proposal } from "@/types";
import { CompanyLogo } from "./company-logo";
import { SkillTagList } from "./skill-tag";
import { StatusBadge } from "./status-badge";
import { VerifiedBadge } from "./verified-badge";

const STABLE = new Set(["USD", "USDC", "DAI"]);

/** Fixed: "$3,000 – $4,500 USDC"  ·  Hourly: "$80–$120 / hr" */
export function formatProjectBudget(project: Pick<FreelanceProject, "budgetType" | "budgetMin" | "budgetMax" | "currency">): string {
  const { budgetType, budgetMin, budgetMax, currency } = project;
  const stable = STABLE.has(currency);
  if (budgetType === "hourly") {
    return stable
      ? `${formatCurrency(budgetMin, "USD")}–${formatCurrency(budgetMax, "USD")} / hr`
      : `${formatNumber(budgetMin, 2)}–${formatNumber(budgetMax, 2)} ${currency} / hr`;
  }
  return stable
    ? `${formatCurrency(budgetMin, "USD")} – ${formatCurrency(budgetMax, currency)}`
    : `${formatNumber(budgetMin, budgetMin < 100 ? 2 : 0)} – ${formatCurrency(budgetMax, currency)}`;
}

interface ProjectCardProps {
  project: FreelanceProject;
  client?: Company;
  showAction?: boolean;
  className?: string;
}

export function ProjectCard({ project, client, showAction = true, className }: ProjectCardProps) {
  const storeClient = useCompany(client ? undefined : project.clientCompanyId);
  const company = client ?? storeClient;
  const proposals = useAppStore((s) => s.proposals);
  const proposalCount = useMemo(
    () => proposals.filter((p: Proposal) => p.projectId === project.id && p.status !== "withdrawn").length,
    [proposals, project.id],
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={cn(
        "group flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {company && <CompanyLogo company={company} size="md" />}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base leading-snug font-semibold">
            <Link
              href={`/projects/${project.id}`}
              className="rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {project.title}
            </Link>
          </h3>
          {company && (
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link
                href={`/companies/${company.id}`}
                className="truncate rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {company.name}
              </Link>
              <VerifiedBadge verified={company.verified} />
            </div>
          )}
        </div>
        <StatusBadge status={project.status} size="sm" />
      </div>

      <p className="line-clamp-2 text-sm text-pretty text-muted-foreground">{project.description}</p>

      <SkillTagList skills={project.skills} max={4} />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="col-span-2 flex items-center gap-1.5">
          <Banknote className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Budget</dt>
          <dd className="font-heading font-semibold">{formatProjectBudget(project)}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Duration</dt>
          <dd>{pluralize(project.durationWeeks, "week")}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Coins className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Payment currency</dt>
          <dd>Paid in {project.currency}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Layers className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Blockchain</dt>
          <dd>{project.blockchain}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FileText className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Proposals</dt>
          <dd>{pluralize(proposalCount, "proposal")}</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">Posted {formatRelative(project.postedAt)}</span>
        {showAction && project.status === "open" && (
          <Link href={`/projects/${project.id}`} className={buttonVariants({ variant: "gradient", size: "sm" })}>
            Submit Proposal
          </Link>
        )}
      </div>
    </motion.article>
  );
}
