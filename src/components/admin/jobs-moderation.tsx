"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, EyeOff, Eye, Flag, Loader2, MoreHorizontal, RotateCcw, ShieldCheck, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyLogo } from "@/components/shared/company-logo";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { SkillTagList } from "@/components/shared/skill-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { JOB_STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatJobSalary, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import type { Company, Job, JobStatus } from "@/types";
import { TagPill } from "./admin-badges";
import { FilterPills, type FilterPillOption } from "./filter-pills";
import { jobActionKey, useModerateJob, type JobModerationAction } from "./use-admin-action";
import { useUrlEnum, useUrlState } from "./use-url-state";

const STATUS_ORDER: JobStatus[] = ["pending", "published", "paused", "hidden", "rejected", "closed", "draft"];
const STATUS_VALUES = ["all", ...STATUS_ORDER] as const;
type StatusFilter = (typeof STATUS_VALUES)[number];

interface JobRow {
  job: Job;
  company: Company | undefined;
  applications: number;
  openReports: number;
}

/** Moderation actions that make sense for each job status. */
function actionsFor(status: JobStatus): JobModerationAction[] {
  switch (status) {
    case "pending":
      return ["approve", "reject"];
    case "published":
      return ["hide"];
    case "hidden":
      return ["restore"];
    case "rejected":
      return ["approve"];
    default:
      return [];
  }
}

const ACTION_LABEL: Record<JobModerationAction, string> = {
  approve: "Approve",
  reject: "Reject",
  hide: "Hide",
  restore: "Restore",
};

const ACTION_ICON = { approve: Check, reject: X, hide: EyeOff, restore: RotateCcw } as const;

export function JobsModeration() {
  const hydrated = useHydrated();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const applications = useAppStore((s) => s.applications);
  const reports = useAppStore((s) => s.reports);
  const categoriesSetting = useAppStore((s) => s.adminSettings.categories);

  const [query, setQuery] = useUrlState("q");
  const [status, setStatus] = useUrlEnum<StatusFilter>("status", STATUS_VALUES, "all");
  const [category, setCategory] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ job: Job; action: "reject" | "hide" } | null>(null);
  const { moderate, isPending } = useModerateJob();

  const rows = useMemo<JobRow[]>(() => {
    const companyById = new Map(companies.map((c) => [c.id, c]));
    const appCounts = new Map<string, number>();
    applications.forEach((a) => appCounts.set(a.jobId, (appCounts.get(a.jobId) ?? 0) + 1));
    const reportCounts = new Map<string, number>();
    reports.forEach((r) => {
      if (r.targetType === "job" && (r.status === "open" || r.status === "in_review")) {
        reportCounts.set(r.targetId, (reportCounts.get(r.targetId) ?? 0) + 1);
      }
    });
    return jobs.map((job) => ({
      job,
      company: companyById.get(job.companyId),
      applications: appCounts.get(job.id) ?? 0,
      openReports: reportCounts.get(job.id) ?? 0,
    }));
  }, [jobs, companies, applications, reports]);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: jobs.length,
      pending: 0,
      published: 0,
      paused: 0,
      hidden: 0,
      rejected: 0,
      closed: 0,
      draft: 0,
    };
    jobs.forEach((j) => {
      result[j.status] += 1;
    });
    return result;
  }, [jobs]);

  const categories = useMemo(() => {
    const set = new Set<string>([...categoriesSetting, ...jobs.map((j) => j.category)]);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [categoriesSetting, jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter(({ job, company }) => {
        if (status !== "all" && job.status !== status) return false;
        if (category && job.category !== category) return false;
        if (!q) return true;
        return [job.title, company?.name ?? "", job.category, job.id, ...job.skills]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        // pending first, then newest
        const pa = a.job.status === "pending" ? 0 : 1;
        const pb = b.job.status === "pending" ? 0 : 1;
        return pa - pb || Date.parse(b.job.postedAt) - Date.parse(a.job.postedAt);
      });
  }, [rows, query, status, category]);

  const detail = useMemo(() => rows.find((r) => r.job.id === detailId) ?? null, [rows, detailId]);

  function trigger(job: Job, action: JobModerationAction) {
    if (action === "reject" || action === "hide") setConfirm({ job, action });
    else void moderate(job, action);
  }

  const columns: DataTableColumn<JobRow>[] = [
    {
      key: "title",
      header: "Job",
      sortValue: (r) => r.job.title,
      cell: ({ job }) => (
        <div className="min-w-52 max-w-72">
          <p className="truncate font-medium">{job.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {job.type} · {job.workMode} · {job.location}
          </p>
        </div>
      ),
    },
    {
      key: "company",
      header: "Company",
      sortValue: (r) => r.company?.name ?? "",
      cell: ({ company }) =>
        company ? (
          <div className="flex min-w-36 items-center gap-2">
            <CompanyLogo company={company} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm">{company.name}</p>
              {company.suspended && <p className="text-[11px] text-destructive">Suspended</p>}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">Unknown</span>
        ),
    },
    {
      key: "category",
      header: "Category",
      sortValue: (r) => r.job.category,
      cell: ({ job }) => <span className="whitespace-nowrap text-muted-foreground">{job.category}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => STATUS_ORDER.indexOf(r.job.status),
      cell: ({ job }) => <StatusBadge status={job.status} />,
    },
    {
      key: "apps",
      header: "Applications",
      sortValue: (r) => r.applications,
      className: "tabular-nums",
      cell: (r) => r.applications,
    },
    {
      key: "posted",
      header: "Posted",
      sortValue: (r) => Date.parse(r.job.postedAt),
      cell: ({ job }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(job.postedAt)}</span>,
    },
    {
      key: "flags",
      header: "Flags",
      sortValue: (r) => r.openReports,
      cell: ({ job, openReports }) =>
        openReports > 0 ? (
          <Link
            href={`/admin/reports?q=${encodeURIComponent(job.id)}`}
            className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive ring-1 ring-destructive/25 ring-inset hover:bg-destructive/15"
            aria-label={`${openReports} open ${openReports === 1 ? "report" : "reports"} on ${job.title}`}
          >
            <Flag className="size-3" aria-hidden />
            {openReports}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-px whitespace-nowrap text-right",
      cell: ({ job }) => {
        const actions = actionsFor(job.status);
        const quick = actions[0];
        const busy = actions.some((a) => isPending(jobActionKey(a, job.id)));
        const QuickIcon = quick ? ACTION_ICON[quick] : null;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {quick && QuickIcon && (
              <Button
                size="xs"
                variant={quick === "approve" ? "default" : "outline"}
                disabled={busy}
                onClick={() => trigger(job, quick)}
                aria-label={`${ACTION_LABEL[quick]} ${job.title}`}
              >
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : <QuickIcon aria-hidden />}
                {ACTION_LABEL[quick]}
              </Button>
            )}
            <span data-no-row-click onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon-sm" aria-label={`More actions for ${job.title}`} />}
                >
                  <MoreHorizontal aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setDetailId(job.id)}>
                      <Eye aria-hidden /> View details
                    </DropdownMenuItem>
                    {actions.slice(quick ? 1 : 0).map((action) => {
                      const Icon = ACTION_ICON[action];
                      return (
                        <DropdownMenuItem
                          key={action}
                          variant={action === "reject" ? "destructive" : "default"}
                          disabled={busy}
                          onClick={() => trigger(job, action)}
                        >
                          <Icon aria-hidden /> {ACTION_LABEL[action]}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </div>
        );
      },
    },
  ];

  if (!hydrated) return <LoadingSkeleton variant="page" />;

  const options: FilterPillOption<StatusFilter>[] = [
    { value: "all", label: "All", count: counts.all },
    ...STATUS_ORDER.map((s) => ({
      value: s,
      label: JOB_STATUS_LABEL[s],
      count: counts[s],
      attention: s === "pending",
    })),
  ];

  const hasFilters = query.trim() !== "" || status !== "all" || category !== "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Job moderation"
        description={
          counts.pending > 0
            ? `${counts.pending} ${counts.pending === 1 ? "listing is" : "listings are"} waiting for approval. Employers are notified of every decision.`
            : "Review, approve and hide listings. Employers are notified of every decision."
        }
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by title, company, skill or ID…"
            aria-label="Search jobs"
            className="sm:max-w-sm"
          />
          <SelectField
            value={category}
            onChange={setCategory}
            placeholder="All categories"
            options={categories.map((c) => ({ value: c, label: c }))}
            aria-label="Filter by category"
            className="sm:w-56"
          />
        </div>
        <FilterPills options={options} value={status} onChange={setStatus} aria-label="Filter by job status" />
      </div>

      <DataTable
        caption="Job listings"
        columns={columns}
        data={filtered}
        rowKey={(r) => r.job.id}
        onRowClick={(r) => setDetailId(r.job.id)}
        pageSize={10}
        emptyState={
          <EmptyState
            icon={ShieldCheck}
            title={status === "pending" && !hasFilters ? "Nothing waiting for approval" : "No jobs match your filters"}
            description={
              status === "pending"
                ? "New listings will appear here when job approval is required."
                : "Try a different search term or clear the status and category filters."
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                    setCategory("");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        }
      />

      <JobDetailDialog
        row={detail}
        onClose={() => setDetailId(null)}
        onAction={(job, action) => {
          trigger(job, action);
        }}
        isPending={isPending}
      />

      <ConfirmationDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        destructive
        title={confirm?.action === "reject" ? "Reject this job?" : "Hide this job?"}
        confirmLabel={confirm?.action === "reject" ? "Reject job" : "Hide job"}
        description={
          confirm
            ? confirm.action === "reject"
              ? `"${confirm.job.title}" will not appear on public pages and the employer will be notified that it was rejected. It can still be approved later.`
              : `"${confirm.job.title}" will be removed from public job search and the company page until you restore it. The employer will be notified.`
            : ""
        }
        onConfirm={async () => {
          if (confirm) await moderate(confirm.job, confirm.action);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detail dialog                                                       */
/* ------------------------------------------------------------------ */

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function JobDetailDialog({
  row,
  onClose,
  onAction,
  isPending,
}: {
  row: JobRow | null;
  onClose: () => void;
  onAction: (job: Job, action: JobModerationAction) => void;
  isPending: (key: string) => boolean;
}) {
  const job = row?.job;
  const actions = job ? actionsFor(job.status) : [];
  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {row && job && (
          <>
            <DialogHeader className="pr-8">
              <div className="flex items-start gap-3">
                {row.company && <CompanyLogo company={row.company} size="md" />}
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg">{job.title}</DialogTitle>
                  <DialogDescription>
                    {row.company?.name ?? "Unknown company"} · {job.category}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={job.status} />
                {job.featured && <TagPill tone="primary">Featured</TagPill>}
                {job.isDao && <TagPill tone="primary">{job.daoName ?? "DAO"}</TagPill>}
                {row.company?.suspended && <TagPill tone="danger">Company suspended</TagPill>}
                {row.openReports > 0 && (
                  <TagPill tone="danger">
                    {row.openReports} open {row.openReports === 1 ? "report" : "reports"}
                  </TagPill>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-5 text-sm">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-muted/40 p-3 sm:grid-cols-3">
                <Meta label="Salary" value={formatJobSalary(job)} />
                <Meta label="Type" value={job.type} />
                <Meta label="Work mode" value={job.workMode} />
                <Meta label="Location" value={job.location} />
                <Meta label="Experience" value={job.experience} />
                <Meta label="Chain" value={job.blockchain} />
                <Meta label="Crypto pay" value={job.cryptoPayment ? job.paymentTokens.join(", ") || "Yes" : "No"} />
                <Meta label="Posted" value={formatRelative(job.postedAt)} />
                <Meta label="Deadline" value={formatDate(job.deadline)} />
                <Meta label="Applications" value={String(row.applications)} />
                <Meta label="Job ID" value={job.id} mono />
              </dl>

              <section className="space-y-1.5">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Description</h3>
                <p className="leading-relaxed whitespace-pre-line text-pretty">{job.description}</p>
              </section>

              <BulletList title="Responsibilities" items={job.responsibilities} />
              <BulletList title="Requirements" items={job.qualifications} />
              <BulletList title="Benefits" items={job.benefits} />

              {job.skills.length > 0 && (
                <section className="space-y-1.5">
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Skills</h3>
                  <SkillTagList skills={job.skills} size="md" />
                </section>
              )}
            </div>

            <DialogFooter className="items-center">
              {job.status === "published" && row.company && !row.company.suspended && (
                <Link href={`/jobs/${job.id}`} className={cn(buttonVariants({ variant: "ghost" }), "sm:mr-auto")}>
                  View public page
                </Link>
              )}
              {actions.map((action) => {
                const Icon = ACTION_ICON[action];
                const busy = isPending(jobActionKey(action, job.id));
                return (
                  <Button
                    key={action}
                    variant={action === "approve" || action === "restore" ? "default" : "outline"}
                    disabled={busy}
                    onClick={() => {
                      onAction(job, action);
                      onClose();
                    }}
                  >
                    {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Icon aria-hidden />}
                    {ACTION_LABEL[action]}
                  </Button>
                );
              })}
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn("truncate font-medium", mono && "font-mono text-xs")} title={value}>
        {value}
      </dd>
    </div>
  );
}
