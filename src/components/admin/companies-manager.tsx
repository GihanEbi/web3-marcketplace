"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Ban,
  Briefcase,
  Building2,
  ExternalLink,
  Loader2,
  MapPin,
  RotateCcw,
  ShieldOff,
  Users,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/shared/company-logo";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { DemoOrgBadge, VerifiedBadge } from "@/components/shared/verified-badge";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setCompanySuspended, setCompanyVerified } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import type { Company } from "@/types";
import { TagPill } from "./admin-badges";
import { FilterPills, type FilterPillOption } from "./filter-pills";
import { useAdminAction } from "./use-admin-action";
import { useUrlEnum, useUrlState } from "./use-url-state";

const STATUS_VALUES = ["all", "verified", "unverified", "suspended"] as const;
type StatusFilter = (typeof STATUS_VALUES)[number];

interface CompanyRow {
  company: Company;
  activeJobs: number;
  totalJobs: number;
  pendingJobs: number;
}

export function CompaniesManager() {
  const hydrated = useHydrated();
  const companies = useAppStore((s) => s.companies);
  const jobs = useAppStore((s) => s.jobs);
  const [query, setQuery] = useUrlState("q");
  const [status, setStatus] = useUrlEnum<StatusFilter>("status", STATUS_VALUES, "all");
  const [daoOnly, setDaoOnly] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<CompanyRow | null>(null);
  const { run, isPending } = useAdminAction();

  const rows = useMemo<CompanyRow[]>(() => {
    return companies
      .map((company) => {
        const own = jobs.filter((j) => j.companyId === company.id);
        return {
          company,
          activeJobs: own.filter((j) => j.status === "published").length,
          totalJobs: own.length,
          pendingJobs: own.filter((j) => j.status === "pending").length,
        };
      })
      .sort((a, b) => b.activeJobs - a.activeJobs || a.company.name.localeCompare(b.company.name));
  }, [companies, jobs]);

  const counts = useMemo(
    () => ({
      all: companies.length,
      verified: companies.filter((c) => c.verified).length,
      unverified: companies.filter((c) => !c.verified).length,
      suspended: companies.filter((c) => c.suspended).length,
    }),
    [companies],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ company }) => {
      if (status === "verified" && !company.verified) return false;
      if (status === "unverified" && company.verified) return false;
      if (status === "suspended" && !company.suspended) return false;
      if (daoOnly && !company.isDao) return false;
      if (!q) return true;
      return [company.name, company.industry, company.location, company.tagline].join(" ").toLowerCase().includes(q);
    });
  }, [rows, query, status, daoOnly]);

  if (!hydrated) return <LoadingSkeleton variant="card" />;

  const options: FilterPillOption<StatusFilter>[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "verified", label: "Verified", count: counts.verified },
    { value: "unverified", label: "Unverified", count: counts.unverified, attention: true },
    { value: "suspended", label: "Suspended", count: counts.suspended },
  ];

  function toggleVerified(company: Company) {
    const next = !company.verified;
    return run(
      `verify:${company.id}`,
      () => setCompanyVerified(company.id, next),
      next ? `${company.name} is now verified.` : `Verification removed from ${company.name}.`,
    );
  }

  function reinstate(company: Company) {
    return run(
      `suspend:${company.id}`,
      () => setCompanySuspended(company.id, false),
      `${company.name} reinstated. Its published jobs are visible again.`,
    );
  }

  const hasFilters = query.trim() !== "" || status !== "all" || daoOnly;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Companies"
        description="Verify organisations and suspend listings when a company breaks marketplace rules."
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name, industry or location…"
            aria-label="Search companies"
            className="sm:max-w-sm"
          />
          <Button
            variant={daoOnly ? "default" : "outline"}
            size="sm"
            aria-pressed={daoOnly}
            onClick={() => setDaoOnly((v) => !v)}
          >
            <Users aria-hidden />
            DAOs only
          </Button>
        </div>
        <FilterPills options={options} value={status} onChange={setStatus} aria-label="Filter by verification status" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies match your filters"
          description="Try a different search term or clear the filters."
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setDaoOnly(false);
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Companies">
          {filtered.map((row) => (
            <li key={row.company.id}>
              <CompanyAdminCard
                row={row}
                verifyPending={isPending(`verify:${row.company.id}`)}
                suspendPending={isPending(`suspend:${row.company.id}`)}
                onToggleVerified={() => void toggleVerified(row.company)}
                onSuspend={() => setSuspendTarget(row)}
                onReinstate={() => void reinstate(row.company)}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmationDialog
        open={suspendTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSuspendTarget(null);
        }}
        title={suspendTarget ? `Suspend ${suspendTarget.company.name}?` : "Suspend company?"}
        destructive
        confirmLabel="Suspend listings"
        description={
          suspendTarget
            ? `${suspendTarget.activeJobs > 0 ? pluralize(suspendTarget.activeJobs, "published job") : "None of this company's jobs are currently published, but any it publishes later"} will disappear from public pages (job search, company profile and project listings) while the company is suspended. Existing applications and the employer's dashboard are not affected, and you can reinstate the company at any time.`
            : ""
        }
        onConfirm={async () => {
          if (!suspendTarget) return;
          const { company } = suspendTarget;
          await run(
            `suspend:${company.id}`,
            () => setCompanySuspended(company.id, true),
            `${company.name} suspended. Its jobs are hidden from public pages.`,
          );
        }}
      />
    </div>
  );
}

function CompanyAdminCard({
  row,
  verifyPending,
  suspendPending,
  onToggleVerified,
  onSuspend,
  onReinstate,
}: {
  row: CompanyRow;
  verifyPending: boolean;
  suspendPending: boolean;
  onToggleVerified: () => void;
  onSuspend: () => void;
  onReinstate: () => void;
}) {
  const { company, activeJobs, totalJobs, pendingJobs } = row;
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40",
        company.suspended && "border-destructive/40 bg-destructive/[0.03]",
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo company={company} size="lg" className={cn(company.suspended && "opacity-60 grayscale")} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="min-w-0 truncate font-heading text-base font-semibold">{company.name}</h2>
            <VerifiedBadge verified={company.verified} showUnverified />
          </div>
          <p className="truncate text-sm text-muted-foreground">{company.industry}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {company.location}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {company.verified ? <TagPill tone="info">Verified</TagPill> : <TagPill tone="warning">Unverified</TagPill>}
        {company.suspended && <TagPill tone="danger">Suspended</TagPill>}
        {company.isDao && <TagPill tone="primary">DAO</TagPill>}
        {company.isDemo && <DemoOrgBadge />}
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center">
        <div>
          <dt className="text-[11px] text-muted-foreground">Active jobs</dt>
          <dd className="font-heading text-lg font-semibold tabular-nums">{activeJobs}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted-foreground">All jobs</dt>
          <dd className="font-heading text-lg font-semibold tabular-nums">{totalJobs}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted-foreground">Pending</dt>
          <dd className="font-heading text-lg font-semibold tabular-nums">{pendingJobs}</dd>
        </div>
      </dl>

      {company.suspended && (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <Briefcase className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Listings are hidden from public pages until this company is reinstated.
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onToggleVerified} disabled={verifyPending}>
          {verifyPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : company.verified ? (
            <ShieldOff aria-hidden />
          ) : (
            <BadgeCheck aria-hidden />
          )}
          {company.verified ? "Remove verification" : "Mark verified"}
        </Button>
        {company.suspended ? (
          <Button size="sm" variant="outline" onClick={onReinstate} disabled={suspendPending}>
            {suspendPending ? <Loader2 className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
            Reinstate listings
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={onSuspend} disabled={suspendPending}>
            {suspendPending ? <Loader2 className="animate-spin" aria-hidden /> : <Ban aria-hidden />}
            Suspend listings
          </Button>
        )}
        <Link
          href={`/companies/${company.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-auto")}
          aria-label={`View public profile of ${company.name}`}
        >
          View profile
          <ExternalLink aria-hidden />
        </Link>
      </div>
    </motion.article>
  );
}
