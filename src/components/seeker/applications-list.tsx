"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, CalendarClock, CircleCheck, Eye, FileText, MoreHorizontal, Trophy, Undo2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyLogo } from "@/components/shared/company-logo";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatJobSalary, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useHydrated, useMyApplications } from "@/store/hooks";
import type { Application, ApplicationStatus, Company, Job } from "@/types";
import { canWithdraw } from "./job-utils";
import { WithdrawDialog } from "./withdraw-dialog";

interface Row {
  app: Application;
  job?: Job;
  company?: Company;
}

type StatusFilter = "all" | ApplicationStatus;

function RowActions({ row, onWithdraw }: { row: Row; onWithdraw: (row: Row) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.job?.title ?? "application"}`} />}
      >
        <MoreHorizontal aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem render={<Link href={`/applications/${row.app.id}`} />}>
          <Eye aria-hidden />
          View details
        </DropdownMenuItem>
        {row.job && (
          <DropdownMenuItem render={<Link href={`/jobs/${row.job.id}`} />}>
            <Briefcase aria-hidden />
            View job
          </DropdownMenuItem>
        )}
        {canWithdraw(row.app.status) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onWithdraw(row)}>
              <Undo2 aria-hidden />
              Withdraw
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function JobCell({ row }: { row: Row }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {row.company ? (
        <CompanyLogo company={row.company} size="md" />
      ) : (
        <span aria-hidden className="size-11 shrink-0 rounded-xl bg-muted" />
      )}
      <div className="min-w-0">
        <p className="truncate font-medium">{row.job?.title ?? "Job no longer available"}</p>
        <p className="truncate text-xs text-muted-foreground">{row.company?.name ?? "Unknown company"}</p>
      </div>
    </div>
  );
}

export function ApplicationsList() {
  const router = useRouter();
  const hydrated = useHydrated();
  const candidate = useCurrentCandidate();
  const myApps = useMyApplications();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [withdrawRow, setWithdrawRow] = useState<Row | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const rows = useMemo<Row[]>(
    () =>
      [...myApps]
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .map((app) => ({
          app,
          job: jobs.find((j) => j.id === app.jobId),
          company: companies.find((c) => c.id === app.companyId),
        })),
    [myApps, jobs, companies],
  );

  const counts = useMemo(() => {
    const map = new Map<ApplicationStatus, number>();
    rows.forEach((r) => map.set(r.app.status, (map.get(r.app.status) ?? 0) + 1));
    return map;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.app.status !== filter) return false;
      if (!q) return true;
      return `${r.job?.title ?? ""} ${r.company?.name ?? ""}`.toLowerCase().includes(q);
    });
  }, [rows, query, filter]);

  if (!hydrated || !candidate) {
    return (
      <div className="space-y-6">
        <PageHeader title="My applications" description="Track every role you have applied for." />
        <LoadingSkeleton variant="table" />
      </div>
    );
  }

  const activeCount = rows.filter((r) => canWithdraw(r.app.status)).length;
  const interviewCount = counts.get("interview") ?? 0;
  const offerCount = (counts.get("offered") ?? 0) + (counts.get("hired") ?? 0);

  const summary = [
    { label: "Total", value: rows.length, icon: FileText, tone: "text-primary bg-primary/10" },
    { label: "In progress", value: activeCount, icon: CircleCheck, tone: "text-info bg-info/10" },
    { label: "Interviews", value: interviewCount, icon: CalendarClock, tone: "text-primary bg-primary/10" },
    { label: "Offers & hires", value: offerCount, icon: Trophy, tone: "text-success bg-success/10" },
  ];

  const columns: DataTableColumn<Row>[] = [
    {
      key: "job",
      header: "Job",
      cell: (r) => <JobCell row={r} />,
      sortValue: (r) => r.job?.title ?? "",
      className: "min-w-64",
    },
    {
      key: "applied",
      header: "Applied",
      cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(r.app.appliedAt)}</span>,
      sortValue: (r) => Date.parse(r.app.appliedAt),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={r.app.status} />,
      sortValue: (r) => APPLICATION_STATUSES.indexOf(r.app.status),
    },
    {
      key: "salary",
      header: "Salary",
      cell: (r) => <span className="whitespace-nowrap">{r.job ? formatJobSalary(r.job) : "—"}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{r.job?.type ?? "—"}</span>,
      sortValue: (r) => r.job?.type ?? "",
    },
    {
      key: "updated",
      header: "Last updated",
      cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatRelative(r.app.updatedAt)}</span>,
      sortValue: (r) => Date.parse(r.app.updatedAt),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      cell: (r) => (
        // stopPropagation: menu content is portalled, so its clicks would otherwise reach the row's onClick
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <RowActions
            row={r}
            onWithdraw={(row) => {
              setWithdrawRow(row);
              setWithdrawOpen(true);
            }}
          />
        </div>
      ),
      className: "w-12",
    },
  ];

  const emptyAll = rows.length === 0;
  const empty = emptyAll ? (
    <EmptyState
      icon={FileText}
      title="You haven't applied to any jobs yet"
      description="Find a role that fits your skills and your applications will be tracked here, from submission to offer."
      action={
        <>
          <Link href="/jobs" className={buttonVariants({ variant: "gradient" })}>
            Browse jobs
          </Link>
          <Link href="/recommended-jobs" className={buttonVariants({ variant: "outline" })}>
            See recommendations
          </Link>
        </>
      }
    />
  ) : (
    <EmptyState
      title="No applications match your filters"
      description="Try a different search term or status."
      action={
        <Button
          variant="outline"
          onClick={() => {
            setQuery("");
            setFilter("all");
          }}
        >
          Clear filters
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My applications"
        description="Track every role you have applied for — statuses update as employers move you through their pipeline."
        actions={
          <Link href="/jobs" className={buttonVariants({ variant: "gradient" })}>
            <Briefcase aria-hidden />
            Find more jobs
          </Link>
        }
      />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Application summary">
        {summary.map((item) => (
          <li key={item.label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <span className={cn("flex size-9 items-center justify-center rounded-lg", item.tone)}>
              <item.icon className="size-4" aria-hidden />
            </span>
            <div>
              <p className="font-heading text-xl leading-none font-semibold tabular-nums">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
            </div>
          </li>
        ))}
      </ul>

      {!emptyAll && (
        <div className="space-y-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by job title or company…"
            aria-label="Search applications"
            className="sm:max-w-md"
          />
          <div role="group" aria-label="Filter by status" className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {(["all", ...APPLICATION_STATUSES] as StatusFilter[]).map((status) => {
              const count = status === "all" ? rows.length : (counts.get(status) ?? 0);
              const active = filter === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(status)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    count === 0 && !active && "opacity-60",
                  )}
                >
                  {status === "all" ? "All" : APPLICATION_STATUS_LABEL[status]}
                  <span className="rounded-full bg-muted px-1.5 py-px text-[10px] tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {emptyAll ? (
        empty
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={visible}
              rowKey={(r) => r.app.id}
              onRowClick={(r) => router.push(`/applications/${r.app.id}`)}
              emptyState={empty}
              caption="Your job applications"
              pageSize={8}
            />
          </div>

          <div className="space-y-3 md:hidden">
            {visible.length === 0
              ? empty
              : visible.map((r) => (
                  <article key={r.app.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/applications/${r.app.id}`} className="min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                        <JobCell row={r} />
                      </Link>
                      <RowActions
                        row={r}
                        onWithdraw={(row) => {
                          setWithdrawRow(row);
                          setWithdrawOpen(true);
                        }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={r.app.status} />
                      {r.job && <span className="text-xs text-muted-foreground">{r.job.type}</span>}
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Applied</dt>
                        <dd className="font-medium">{formatDate(r.app.appliedAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Updated</dt>
                        <dd className="font-medium">{formatRelative(r.app.updatedAt)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">Salary</dt>
                        <dd className="font-medium">{r.job ? formatJobSalary(r.job) : "—"}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
          </div>
        </>
      )}

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        applicationId={withdrawRow?.app.id ?? null}
        jobTitle={withdrawRow?.job?.title}
        companyName={withdrawRow?.company?.name}
      />
    </div>
  );
}
