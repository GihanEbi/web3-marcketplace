"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  Briefcase,
  Building2,
  CheckCircle2,
  EyeOff,
  Flag,
  Hourglass,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  PanelRightOpen,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldOff,
  User as UserIcon,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { appNow } from "@/lib/clock";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { moderateJob, setCompanySuspended, setCompanyVerified, setReportStatus, setUserStatus } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import type { Company, Job, Report, ReportStatus, User } from "@/types";
import { TagPill } from "./admin-badges";
import { FilterPills, type FilterPillOption } from "./filter-pills";
import { useAdminAction } from "./use-admin-action";
import { useUrlEnum, useUrlState } from "./use-url-state";

const STATUS_VALUES = ["all", "open", "in_review", "resolved", "dismissed"] as const;
type StatusFilter = (typeof STATUS_VALUES)[number];

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  all: "All",
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const STATUS_RANK: Record<ReportStatus, number> = { open: 0, in_review: 1, resolved: 2, dismissed: 3 };

const TYPE_META: Record<Report["targetType"], { label: string; icon: LucideIcon; tone: StatusTone }> = {
  job: { label: "Job", icon: Briefcase, tone: "info" },
  company: { label: "Company", icon: Building2, tone: "primary" },
  user: { label: "User", icon: UserIcon, tone: "warning" },
  message: { label: "Message", icon: MessageSquare, tone: "neutral" },
};

interface ReportRow {
  report: Report;
  job?: Job;
  company?: Company;
  targetUser?: User;
  /** user who can be sanctioned from this report (target user, or related user for messages) */
  subject?: User;
  href?: string;
}

type ReportTransition = "review" | "resolve" | "dismiss" | "reopen";

const TRANSITION: Record<ReportTransition, { status: ReportStatus; label: string; toast: string; icon: LucideIcon }> = {
  review: { status: "in_review", label: "Start review", toast: "Report moved to review.", icon: Hourglass },
  resolve: { status: "resolved", label: "Resolve", toast: "Report marked as resolved.", icon: CheckCircle2 },
  dismiss: { status: "dismissed", label: "Dismiss", toast: "Report dismissed.", icon: XCircle },
  reopen: { status: "open", label: "Reopen", toast: "Report reopened.", icon: RotateCcw },
};

function transitionsFor(status: ReportStatus): ReportTransition[] {
  switch (status) {
    case "open":
      return ["review", "resolve", "dismiss"];
    case "in_review":
      return ["resolve", "dismiss"];
    default:
      return ["reopen"];
  }
}

interface PendingAction {
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
  perform: () => Promise<boolean>;
}

export function ReportsQueue() {
  const hydrated = useHydrated();
  const reports = useAppStore((s) => s.reports);
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const users = useAppStore((s) => s.users);

  const [query, setQuery] = useUrlState("q");
  const [status, setStatus] = useUrlEnum<StatusFilter>("status", STATUS_VALUES, "all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const { run, isPending } = useAdminAction();

  const rows = useMemo<ReportRow[]>(() => {
    const jobById = new Map(jobs.map((j) => [j.id, j]));
    const companyById = new Map(companies.map((c) => [c.id, c]));
    const userById = new Map(users.map((u) => [u.id, u]));
    const userByName = new Map(users.map((u) => [u.name.toLowerCase(), u]));
    return reports.map((report) => {
      const job = report.targetType === "job" ? jobById.get(report.targetId) : undefined;
      const company = report.targetType === "company" ? companyById.get(report.targetId) : undefined;
      const targetUser = report.targetType === "user" ? userById.get(report.targetId) : undefined;
      const subject =
        report.targetType === "user"
          ? targetUser
          : report.targetType === "message"
            ? userByName.get(report.relatedUser.toLowerCase())
            : undefined;
      const href = job
        ? `/jobs/${job.id}`
        : company
          ? `/companies/${company.id}`
          : targetUser
            ? `/admin/users?q=${encodeURIComponent(targetUser.name)}`
            : undefined;
      return { report, job, company, targetUser, subject, href };
    });
  }, [reports, jobs, companies, users]);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: reports.length,
      open: 0,
      in_review: 0,
      resolved: 0,
      dismissed: 0,
    };
    reports.forEach((r) => {
      result[r.status] += 1;
    });
    return result;
  }, [reports]);

  const resolvedRecently = useMemo(() => {
    const cutoff = appNow().getTime() - 30 * 86_400_000;
    return reports.filter((r) => r.status === "resolved" && Date.parse(r.reportedAt) >= cutoff).length;
  }, [reports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter(({ report }) => {
        if (status !== "all" && report.status !== status) return false;
        if (!q) return true;
        return [
          report.targetLabel,
          report.targetId,
          report.reason,
          report.details,
          report.reportedBy,
          report.relatedUser,
          report.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort(
        (a, b) =>
          STATUS_RANK[a.report.status] - STATUS_RANK[b.report.status] ||
          Date.parse(b.report.reportedAt) - Date.parse(a.report.reportedAt),
      );
  }, [rows, query, status]);

  const detail = useMemo(() => rows.find((r) => r.report.id === detailId) ?? null, [rows, detailId]);

  function transition(report: Report, kind: ReportTransition) {
    const meta = TRANSITION[kind];
    return run(`report:${report.id}`, () => setReportStatus(report.id, meta.status), meta.toast);
  }

  const columns: DataTableColumn<ReportRow>[] = [
    {
      key: "content",
      header: "Reported content",
      sortValue: (r) => r.report.targetLabel,
      cell: (r) => {
        const meta = TYPE_META[r.report.targetType];
        const Icon = meta.icon;
        return (
          <div className="min-w-56 max-w-80 space-y-1">
            <TagPill tone={meta.tone}>
              <Icon className="mr-1 size-3" aria-hidden />
              {meta.label}
            </TagPill>
            {r.href ? (
              <Link href={r.href} className="block truncate font-medium hover:text-primary hover:underline">
                {r.report.targetLabel}
              </Link>
            ) : (
              <p className="truncate font-medium">{r.report.targetLabel}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "related",
      header: "Related user",
      sortValue: (r) => r.report.relatedUser,
      cell: (r) => (
        <div className="min-w-32 text-sm">
          <p className="truncate">{r.report.relatedUser}</p>
          <p className="truncate text-xs text-muted-foreground">Reported by {r.report.reportedBy}</p>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      sortValue: (r) => r.report.reason,
      cell: (r) => (
        <div className="min-w-56 max-w-80">
          <p className="font-medium">{r.report.reason}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{r.report.details}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Reported",
      sortValue: (r) => Date.parse(r.report.reportedAt),
      cell: (r) => (
        <div className="whitespace-nowrap">
          <p>{formatDate(r.report.reportedAt)}</p>
          <p className="text-xs text-muted-foreground">{formatRelative(r.report.reportedAt)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => STATUS_RANK[r.report.status],
      cell: (r) => <StatusBadge status={r.report.status} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-px whitespace-nowrap text-right",
      cell: (r) => {
        const kinds = transitionsFor(r.report.status);
        const quick = kinds[0];
        const QuickIcon = TRANSITION[quick].icon;
        const busy = isPending(`report:${r.report.id}`);
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="xs"
              variant={quick === "review" ? "default" : "outline"}
              disabled={busy}
              onClick={() => void transition(r.report, quick)}
              aria-label={`${TRANSITION[quick].label}: ${r.report.targetLabel}`}
            >
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <QuickIcon aria-hidden />}
              {TRANSITION[quick].label}
            </Button>
            <span data-no-row-click onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label={`More actions for report ${r.report.id}`} />
                  }
                >
                  <MoreHorizontal aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Report</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setDetailId(r.report.id)}>
                      <PanelRightOpen aria-hidden /> View details
                    </DropdownMenuItem>
                    {kinds.slice(1).map((kind) => {
                      const Icon = TRANSITION[kind].icon;
                      return (
                        <DropdownMenuItem key={kind} disabled={busy} onClick={() => void transition(r.report, kind)}>
                          <Icon aria-hidden /> {TRANSITION[kind].label}
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

  const options: FilterPillOption<StatusFilter>[] = STATUS_VALUES.map((value) => ({
    value,
    label: STATUS_FILTER_LABEL[value],
    count: counts[value],
    attention: value === "open",
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Reports & disputes"
        description="Triage reports from employers and job seekers. Nothing is actioned automatically; you choose the outcome."
      />

      <section aria-label="Report summary" className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Open" value={counts.open} icon={Flag} accent="danger" hint="Awaiting first review" />
        <StatsCard
          label="In review"
          value={counts.in_review}
          icon={Hourglass}
          accent="warning"
          hint="Being investigated"
        />
        <StatsCard
          label="Resolved this month"
          value={resolvedRecently}
          icon={ShieldCheck}
          accent="success"
          hint="Reported within the last 30 days"
        />
      </section>

      <div className="space-y-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search reports by content, reason, user or ID…"
          aria-label="Search reports"
          className="sm:max-w-md"
        />
        <FilterPills options={options} value={status} onChange={setStatus} aria-label="Filter by report status" />
      </div>

      <DataTable
        caption="Moderation reports"
        columns={columns}
        data={filtered}
        rowKey={(r) => r.report.id}
        onRowClick={(r) => setDetailId(r.report.id)}
        pageSize={8}
        emptyState={
          <EmptyState
            icon={query ? Search : ShieldCheck}
            title={query || status !== "all" ? "No reports match your filters" : "The queue is clear"}
            description={
              query || status !== "all"
                ? "Try a different search term or status."
                : "New reports from the community will appear here."
            }
            action={
              query || status !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ReportSheet
        row={detail}
        onClose={() => setDetailId(null)}
        isPending={isPending}
        onTransition={(report, kind) => void transition(report, kind)}
        onAction={setPendingAction}
        run={run}
      />

      <ConfirmationDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={pendingAction?.title ?? ""}
        description={pendingAction?.description ?? ""}
        confirmLabel={pendingAction?.confirmLabel}
        destructive={pendingAction?.destructive}
        onConfirm={async () => {
          await pendingAction?.perform();
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detail sheet                                                        */
/* ------------------------------------------------------------------ */

function ReportSheet({
  row,
  onClose,
  isPending,
  onTransition,
  onAction,
  run,
}: {
  row: ReportRow | null;
  onClose: () => void;
  isPending: (key: string) => boolean;
  onTransition: (report: Report, kind: ReportTransition) => void;
  onAction: (action: PendingAction) => void;
  run: (key: string, action: () => Promise<unknown>, success: string) => Promise<boolean>;
}) {
  const report = row?.report;
  const meta = report ? TYPE_META[report.targetType] : null;

  const actions: PendingAction[] = [];
  if (row && report) {
    const { job, company, subject } = row;
    if (job) {
      if (job.status === "published") {
        actions.push({
          title: "Hide this job?",
          description: `"${job.title}" will be removed from public pages until restored. The employer will be notified.`,
          confirmLabel: "Hide job",
          destructive: true,
          perform: () =>
            run(
              `act:${report.id}:hide`,
              () => moderateJob(job.id, "hide"),
              `"${job.title}" hidden from public listings.`,
            ),
        });
      }
      if (job.status !== "rejected") {
        actions.push({
          title: "Reject this job?",
          description: `"${job.title}" will be marked as rejected and the employer will be notified.`,
          confirmLabel: "Reject job",
          destructive: true,
          perform: () =>
            run(`act:${report.id}:reject`, () => moderateJob(job.id, "reject"), `"${job.title}" rejected.`),
        });
      }
    }
    if (company) {
      actions.push(
        company.suspended
          ? {
              title: `Reinstate ${company.name}?`,
              description: "The company's published jobs will become visible on public pages again.",
              confirmLabel: "Reinstate listings",
              destructive: false,
              perform: () =>
                run(
                  `act:${report.id}:suspend`,
                  () => setCompanySuspended(company.id, false),
                  `${company.name} reinstated.`,
                ),
            }
          : {
              title: `Suspend ${company.name}?`,
              description: "All of the company's jobs will disappear from public pages until it is reinstated.",
              confirmLabel: "Suspend listings",
              destructive: true,
              perform: () =>
                run(
                  `act:${report.id}:suspend`,
                  () => setCompanySuspended(company.id, true),
                  `${company.name} suspended.`,
                ),
            },
      );
      if (company.verified) {
        actions.push({
          title: `Remove verification from ${company.name}?`,
          description: "The verified badge will be removed everywhere on the site.",
          confirmLabel: "Remove verification",
          destructive: false,
          perform: () =>
            run(
              `act:${report.id}:verify`,
              () => setCompanyVerified(company.id, false),
              `Verification removed from ${company.name}.`,
            ),
        });
      }
    }
    if (subject && subject.status !== "suspended") {
      actions.push({
        title: `Suspend ${subject.name}?`,
        description: `${subject.name} will not be able to log in while suspended. You can reactivate the account from Users.`,
        confirmLabel: "Suspend account",
        destructive: true,
        perform: () =>
          run(`act:${report.id}:user`, () => setUserStatus(subject.id, "suspended"), `${subject.name} suspended.`),
      });
    }
  }

  const kinds = report ? transitionsFor(report.status) : [];
  const busy = report ? isPending(`report:${report.id}`) : false;

  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {row && report && meta && (
          <>
            <SheetHeader className="pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <TagPill tone={meta.tone}>
                  <meta.icon className="mr-1 size-3" aria-hidden />
                  {meta.label}
                </TagPill>
                <StatusBadge status={report.status} />
              </div>
              <SheetTitle className="mt-2 text-lg text-balance">{report.reason}</SheetTitle>
              <SheetDescription>
                Report {report.id} · {formatDateTime(report.reportedAt)}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-4 text-sm">
              <section className="space-y-1.5">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Reported content
                </h3>
                {row.href ? (
                  <Link href={row.href} className="font-medium text-primary hover:underline">
                    {report.targetLabel}
                  </Link>
                ) : (
                  <p className="font-medium">{report.targetLabel}</p>
                )}
                {report.targetType === "message" && (
                  <p className="text-xs text-muted-foreground">
                    Message content is not stored in this demo, so there is no direct link.
                  </p>
                )}
              </section>

              <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2.5">
                <dt className="text-muted-foreground">Reported by</dt>
                <dd>{report.reportedBy}</dd>
                <dt className="text-muted-foreground">Related user</dt>
                <dd>
                  {row.subject ? (
                    <Link
                      href={`/admin/users?q=${encodeURIComponent(row.subject.name)}`}
                      className="text-primary hover:underline"
                    >
                      {report.relatedUser}
                    </Link>
                  ) : (
                    report.relatedUser
                  )}
                </dd>
                <dt className="text-muted-foreground">Reported</dt>
                <dd>{formatRelative(report.reportedAt)}</dd>
              </dl>

              <section className="space-y-1.5">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Details</h3>
                <p className="rounded-lg border border-border bg-muted/30 p-3 leading-relaxed text-pretty">
                  {report.details}
                </p>
              </section>

              <Separator />

              <section className="space-y-2" aria-label="Take action">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Take action</h3>
                {actions.length === 0 ? (
                  <p className="text-muted-foreground">
                    No moderation action is available for this item. You can still resolve or dismiss the report below.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Optional and never automatic. Choose an action, then update the report status when you are done.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <Button
                          key={action.title}
                          size="sm"
                          variant={action.destructive ? "destructive" : "outline"}
                          onClick={() => onAction(action)}
                        >
                          {action.title.startsWith("Hide") ? (
                            <EyeOff aria-hidden />
                          ) : action.title.startsWith("Remove verification") ? (
                            <ShieldOff aria-hidden />
                          ) : (
                            <Ban aria-hidden />
                          )}
                          {action.confirmLabel}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <Separator />

              <section className="space-y-2 pb-4" aria-label="Report status">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Report status</h3>
                <div className="flex flex-wrap gap-2">
                  {kinds.map((kind) => {
                    const Icon = TRANSITION[kind].icon;
                    return (
                      <Button
                        key={kind}
                        size="sm"
                        variant={kind === "resolve" || kind === "review" ? "default" : "outline"}
                        disabled={busy}
                        onClick={() => onTransition(report, kind)}
                      >
                        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Icon aria-hidden />}
                        {TRANSITION[kind].label}
                      </Button>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
