"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CalendarClock, Clock, Plus, SearchX, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Pagination, usePagination, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { JOB_CATEGORIES } from "@/lib/constants";
import { daysUntil, formatDate, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCurrentCompany, useHydrated } from "@/store/hooks";
import type { Job, JobStatus } from "@/types";
import { JobActionsMenu } from "./job-status-actions";
import { JobPreviewDialog } from "./job-preview-dialog";

type TabKey = "all" | "published" | "draft" | "paused" | "closed" | "pending" | "moderated";

const TABS: { key: TabKey; label: string; statuses?: JobStatus[] }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published", statuses: ["published"] },
  { key: "draft", label: "Draft", statuses: ["draft"] },
  { key: "paused", label: "Paused", statuses: ["paused"] },
  { key: "closed", label: "Closed", statuses: ["closed"] },
  { key: "pending", label: "Pending", statuses: ["pending"] },
  { key: "moderated", label: "Rejected / Hidden", statuses: ["rejected", "hidden"] },
];

type SortKey = "newest" | "oldest" | "applications" | "title" | "deadline";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "applications", label: "Most applications" },
  { value: "title", label: "Title A–Z" },
  { value: "deadline", label: "Deadline (soonest)" },
];

function statusNote(job: Job): string | null {
  switch (job.status) {
    case "pending":
      return "Awaiting admin approval before it goes live.";
    case "rejected":
    case "hidden":
      return "Hidden by moderators. Edit and resubmit, or contact support.";
    case "draft":
      return "Draft: not visible to candidates.";
    default:
      return null;
  }
}

function TitleCell({ job }: { job: Job }) {
  const note = statusNote(job);
  return (
    <div className="min-w-0 max-w-xs">
      <Link
        href={`/employer/jobs/${job.id}/edit`}
        className="block truncate rounded-sm font-medium outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {job.title}
      </Link>
      <p className="truncate text-xs text-muted-foreground">
        {job.type} · {job.workMode} · {job.location}
      </p>
      {note && (
        <p
          className={cn(
            "mt-0.5 text-xs text-pretty",
            job.status === "rejected" || job.status === "hidden" ? "text-destructive" : "text-muted-foreground",
            job.status === "pending" && "text-warning",
          )}
        >
          {note}
        </p>
      )}
    </div>
  );
}

function DeadlineCell({ job }: { job: Job }) {
  const days = daysUntil(job.deadline);
  const expired = days < 0 && job.status === "published";
  return (
    <div className="whitespace-nowrap">
      <span>{formatDate(job.deadline)}</span>
      {expired && <span className="ml-1.5 text-xs font-medium text-destructive">Expired</span>}
      {!expired && days >= 0 && days <= 7 && job.status === "published" && (
        <span className="ml-1.5 text-xs font-medium text-warning">{days === 0 ? "Today" : `${days}d left`}</span>
      )}
    </div>
  );
}

export function JobManagement() {
  const hydrated = useHydrated();
  const company = useCurrentCompany();
  const allJobs = useAppStore((s) => s.jobs);
  const applications = useAppStore((s) => s.applications);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [previewJob, setPreviewJob] = useState<Job | null>(null);

  const companyId = company?.id;
  const jobs = useMemo(() => allJobs.filter((j) => j.companyId === companyId), [allJobs, companyId]);

  const appCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of applications) {
      if (a.companyId === companyId) map.set(a.jobId, (map.get(a.jobId) ?? 0) + 1);
    }
    return map;
  }, [applications, companyId]);

  const tabCounts = useMemo(() => {
    const counts = {} as Record<TabKey, number>;
    for (const t of TABS) counts[t.key] = t.statuses ? jobs.filter((j) => t.statuses?.includes(j.status)).length : jobs.length;
    return counts;
  }, [jobs]);

  const visible = useMemo(() => {
    const statuses = TABS.find((t) => t.key === tab)?.statuses;
    const q = query.trim().toLowerCase();
    const list = jobs.filter(
      (j) =>
        (!statuses || statuses.includes(j.status)) &&
        (!category || j.category === category) &&
        (!q || j.title.toLowerCase().includes(q)),
    );
    const count = (j: Job) => appCounts.get(j.id) ?? 0;
    return [...list].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return Date.parse(a.postedAt) - Date.parse(b.postedAt);
        case "applications":
          return count(b) - count(a) || Date.parse(b.postedAt) - Date.parse(a.postedAt);
        case "title":
          return a.title.localeCompare(b.title);
        case "deadline":
          return Date.parse(a.deadline) - Date.parse(b.deadline);
        default:
          return Date.parse(b.postedAt) - Date.parse(a.postedAt);
      }
    });
  }, [jobs, tab, query, category, sort, appCounts]);

  const pagination = usePagination(visible, 8);

  const columns = useMemo<DataTableColumn<Job>[]>(
    () => [
      { key: "title", header: "Job title", cell: (j) => <TitleCell job={j} />, sortValue: (j) => j.title },
      { key: "category", header: "Category", cell: (j) => <span className="whitespace-nowrap">{j.category}</span>, sortValue: (j) => j.category },
      { key: "status", header: "Status", cell: (j) => <StatusBadge status={j.status} />, sortValue: (j) => j.status },
      {
        key: "applications",
        header: "Applications",
        cell: (j) => (
          <Link
            href={`/employer/jobs/${j.id}/applicants`}
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-medium tabular-nums outline-none hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
            aria-label={`${pluralize(appCounts.get(j.id) ?? 0, "application")} for ${j.title}`}
          >
            <Users className="size-3.5 text-muted-foreground" aria-hidden />
            {appCounts.get(j.id) ?? 0}
          </Link>
        ),
        sortValue: (j) => appCounts.get(j.id) ?? 0,
      },
      {
        key: "posted",
        header: "Posted",
        cell: (j) => <span className="whitespace-nowrap">{formatDate(j.postedAt)}</span>,
        sortValue: (j) => Date.parse(j.postedAt),
      },
      { key: "deadline", header: "Deadline", cell: (j) => <DeadlineCell job={j} />, sortValue: (j) => Date.parse(j.deadline) },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        className: "w-12 text-right",
        cell: (j) => <JobActionsMenu job={j} applicantCount={appCounts.get(j.id) ?? 0} onPreview={setPreviewJob} />,
      },
    ],
    [appCounts],
  );

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <PageHeader title="Manage jobs" description="Create, publish and track your job postings." />
        <LoadingSkeleton variant="table" />
      </div>
    );
  }

  if (!company) {
    return <EmptyState icon={BriefcaseBusiness} title="No company found" description="Sign in with an employer account to manage jobs." />;
  }

  const filtersActive = tab !== "all" || query.trim() !== "" || category !== "";

  function resetFilters() {
    setTab("all");
    setQuery("");
    setCategory("");
  }

  const emptyState =
    jobs.length === 0 ? (
      <EmptyState
        icon={BriefcaseBusiness}
        title="You haven't posted any jobs yet"
        description="Create your first job posting and start receiving applications from Web3 talent."
        action={
          <Link href="/employer/jobs/create" className={buttonVariants({ variant: "gradient" })}>
            <Plus aria-hidden />
            Create job
          </Link>
        }
        className="border-0 bg-transparent py-6"
      />
    ) : (
      <EmptyState
        icon={SearchX}
        title="No jobs match your filters"
        description="Try a different status, category or search term."
        action={
          filtersActive ? (
            <Button variant="outline" onClick={resetFilters}>
              Reset filters
            </Button>
          ) : undefined
        }
        className="border-0 bg-transparent py-6"
      />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage jobs"
        description={`${pluralize(jobs.length, "job")} for ${company.name}. Create, publish, pause and track your postings.`}
        actions={
          <Link href="/employer/jobs/create" className={buttonVariants({ variant: "gradient" })}>
            <Plus aria-hidden />
            Create job
          </Link>
        }
      />

      <div className="space-y-4">
        <div className="overflow-x-auto pb-1 scrollbar-thin">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList aria-label="Filter jobs by status" className="h-auto w-max">
              {TABS.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="h-8 gap-1.5 px-3">
                  {t.label}
                  <span
                    className={cn(
                      "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums",
                      tab === t.key ? "bg-primary/15 text-primary" : "bg-muted-foreground/15 text-muted-foreground",
                    )}
                  >
                    {tabCounts[t.key]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_14rem_12rem]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by job title…" aria-label="Search jobs by title" />
          <SelectField
            aria-label="Filter by category"
            value={category}
            onChange={setCategory}
            placeholder="All categories"
            options={[{ value: "", label: "All categories" }, ...JOB_CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <SelectField aria-label="Sort jobs" value={sort} onChange={(v) => setSort(v as SortKey)} options={SORTS} />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <DataTable
          caption="Your job postings"
          columns={columns}
          data={visible}
          rowKey={(j) => j.id}
          pageSize={8}
          emptyState={emptyState}
        />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {visible.length === 0 ? (
          <div className="rounded-xl border border-border bg-card">{emptyState}</div>
        ) : (
          <>
            {pagination.pageItems.map((job) => {
              const count = appCounts.get(job.id) ?? 0;
              return (
                <article key={job.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <TitleCell job={job} />
                    <JobActionsMenu job={job} applicantCount={count} onPreview={setPreviewJob} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <StatusBadge status={job.status} size="sm" />
                    <Link
                      href={`/employer/jobs/${job.id}/applicants`}
                      className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
                    >
                      <Users className="size-3.5" aria-hidden />
                      {pluralize(count, "application")}
                    </Link>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden />
                      {formatDate(job.postedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" aria-hidden />
                      <DeadlineCell job={job} />
                    </span>
                  </div>
                </article>
              );
            })}
            <div className="flex justify-center">
              <Pagination page={pagination.page} pageCount={pagination.pageCount} onPageChange={pagination.setPage} />
            </div>
          </>
        )}
      </div>

      <JobPreviewDialog open={previewJob !== null} onOpenChange={(open) => !open && setPreviewJob(null)} job={previewJob} company={company} />
    </div>
  );
}
