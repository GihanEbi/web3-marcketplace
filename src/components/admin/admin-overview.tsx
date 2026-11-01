"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CircleDollarSign,
  FileText,
  Flag,
  Loader2,
  Rocket,
  ShieldAlert,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CompanyLogo } from "@/components/shared/company-logo";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { formatCompact, formatCurrency, formatNumber, formatRelative } from "@/lib/format";
import { isJobPublic } from "@/lib/job-filters";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import type { Job } from "@/types";
import { JobActivityChart, PlanDistributionChart, RevenueChart, UserGrowthChart } from "./admin-charts";
import { jobActionKey, useModerateJob } from "./use-admin-action";

interface ActivityItem {
  id: string;
  icon: LucideIcon;
  text: string;
  at: string;
  href?: string;
}

export function AdminOverview() {
  const hydrated = useHydrated();
  const users = useAppStore((s) => s.users);
  const companies = useAppStore((s) => s.companies);
  const jobs = useAppStore((s) => s.jobs);
  const candidates = useAppStore((s) => s.candidates);
  const applications = useAppStore((s) => s.applications);
  const projects = useAppStore((s) => s.projects);
  const reports = useAppStore((s) => s.reports);
  const notifications = useAppStore((s) => s.notifications);
  const analytics = useAppStore((s) => s.adminAnalytics);

  const { moderate, isPending } = useModerateJob();
  const [rejectTarget, setRejectTarget] = useState<Job | null>(null);

  const stats = useMemo(() => {
    const seekers = users.filter((u) => u.role === "seeker").length;
    const employers = users.filter((u) => u.role === "employer").length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const activeJobs = jobs.filter((j) => isJobPublic(j, companies)).length;
    const pendingJobs = jobs.filter((j) => j.status === "pending").length;
    const inPipeline = applications.filter(
      (a) => a.status !== "rejected" && a.status !== "withdrawn" && a.status !== "hired",
    ).length;
    const openProjects = projects.filter((p) => p.status === "open").length;
    const runningProjects = projects.filter((p) => p.status === "in_progress").length;
    return {
      total: users.length,
      seekers,
      employers,
      activeUsers,
      activeJobs,
      pendingJobs,
      inPipeline,
      openProjects,
      runningProjects,
    };
  }, [users, companies, jobs, applications, projects]);

  const attention = useMemo(() => {
    const pendingJobs = jobs
      .filter((j) => j.status === "pending")
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    return {
      pendingJobs,
      openReports: reports.filter((r) => r.status === "open").length,
      inReviewReports: reports.filter((r) => r.status === "in_review").length,
      unverified: companies.filter((c) => !c.verified).length,
      pendingUsers: users.filter((u) => u.status === "pending").length,
    };
  }, [jobs, reports, companies, users]);

  const companyName = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies]);

  const activity = useMemo<ActivityItem[]>(() => {
    const candidateName = new Map(candidates.map((c) => [c.id, c.name]));
    const jobTitle = new Map(jobs.map((j) => [j.id, j.title]));
    const items: ActivityItem[] = [];
    [...applications]
      .sort((a, b) => Date.parse(b.appliedAt) - Date.parse(a.appliedAt))
      .slice(0, 6)
      .forEach((a) =>
        items.push({
          id: `app-${a.id}`,
          icon: FileText,
          text: `${candidateName.get(a.candidateId) ?? "A candidate"} applied for ${jobTitle.get(a.jobId) ?? "a job"}`,
          at: a.appliedAt,
        }),
      );
    [...jobs]
      .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))
      .slice(0, 6)
      .forEach((j) =>
        items.push({
          id: `job-${j.id}`,
          icon: Briefcase,
          text: `${companyName.get(j.companyId) ?? "A company"} posted ${j.title}${j.status === "pending" ? " (awaiting approval)" : ""}`,
          at: j.postedAt,
          href: "/admin/jobs",
        }),
      );
    [...users]
      .sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt))
      .slice(0, 4)
      .forEach((u) =>
        items.push({
          id: `usr-${u.id}`,
          icon: UserPlus,
          text: `${u.name} joined as ${u.role === "employer" ? "an employer" : u.role === "seeker" ? "a job seeker" : "an admin"}`,
          at: u.joinedAt,
          href: `/admin/users?q=${encodeURIComponent(u.name)}`,
        }),
      );
    notifications
      .filter((n) => n.role === "admin")
      .slice(0, 4)
      .forEach((n) =>
        items.push({
          id: `ntf-${n.id}`,
          icon: ShieldAlert,
          text: `${n.title}: ${n.body}`,
          at: n.createdAt,
          href: n.href,
        }),
      );
    return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 8);
  }, [applications, candidates, jobs, users, notifications, companyName]);

  const topCompanies = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach((j) => {
      if (j.status === "published") counts.set(j.companyId, (counts.get(j.companyId) ?? 0) + 1);
    });
    return companies
      .map((company) => ({ company, active: counts.get(company.id) ?? 0 }))
      .filter((row) => row.active > 0)
      .sort((a, b) => b.active - a.active || a.company.name.localeCompare(b.company.name))
      .slice(0, 5);
  }, [companies, jobs]);

  if (!hydrated) return <LoadingSkeleton variant="page" />;

  const maxActive = topCompanies[0]?.active ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Platform overview"
        description="Live marketplace health, moderation queues and revenue at a glance."
        actions={
          <>
            <Link href="/admin/jobs" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Job moderation
            </Link>
            <Link href="/admin/reports" className={buttonVariants({ variant: "gradient", size: "sm" })}>
              <Flag aria-hidden />
              Review reports
            </Link>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          label="Registered users"
          value={formatNumber(stats.total)}
          icon={Users}
          href="/admin/users"
          hint={`${stats.seekers} seekers · ${stats.activeUsers} active`}
        />
        <StatsCard
          label="Employers"
          value={formatNumber(stats.employers)}
          icon={Building2}
          accent="info"
          href="/admin/companies"
          hint={`${companies.length} companies on the platform`}
        />
        <StatsCard
          label="Active job listings"
          value={formatNumber(stats.activeJobs)}
          icon={Briefcase}
          accent="success"
          href="/admin/jobs"
          hint={stats.pendingJobs > 0 ? `${stats.pendingJobs} awaiting approval` : "Nothing awaiting approval"}
        />
        <StatsCard
          label="Applications"
          value={formatNumber(applications.length)}
          icon={FileText}
          accent="warning"
          hint={`${stats.inPipeline} still in the pipeline`}
        />
        <StatsCard
          label="Active freelance projects"
          value={formatNumber(stats.openProjects + stats.runningProjects)}
          icon={Rocket}
          accent="primary"
          hint={`${stats.openProjects} open · ${stats.runningProjects} in progress`}
        />
        <StatsCard
          label="Platform revenue"
          value={formatCurrency(analytics.totalRevenue)}
          icon={CircleDollarSign}
          accent="success"
          href="/admin/subscriptions"
          hint={`MRR ${formatCurrency(analytics.mrr)} (mock)`}
        />
      </section>

      <section aria-label="Analytics" className="grid gap-6 lg:grid-cols-2">
        <UserGrowthChart data={analytics.userGrowth} />
        <JobActivityChart data={analytics.jobActivity} />
        <RevenueChart data={analytics.revenue} />
        <PlanDistributionChart data={analytics.planDistribution} />
      </section>

      <section aria-label="Operations" className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-warning" aria-hidden />
              Needs attention
            </CardTitle>
            <CardDescription>Moderation work waiting for an administrator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Jobs awaiting approval{" "}
                  <span className="text-muted-foreground tabular-nums">({attention.pendingJobs.length})</span>
                </h3>
                {attention.pendingJobs.length > 0 && (
                  <Link href="/admin/jobs?status=pending" className="text-xs font-medium text-primary hover:underline">
                    View all
                  </Link>
                )}
              </div>
              {attention.pendingJobs.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                  All caught up. New listings will appear here when approval is required.
                </p>
              ) : (
                <ul className="space-y-2">
                  {attention.pendingJobs.slice(0, 4).map((job) => {
                    const approving = isPending(jobActionKey("approve", job.id));
                    const rejecting = isPending(jobActionKey("reject", job.id));
                    return (
                      <li key={job.id} className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="truncate text-sm font-medium">{job.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {companyName.get(job.companyId) ?? "Unknown company"} · {formatRelative(job.postedAt)}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="xs"
                            variant="default"
                            disabled={approving || rejecting}
                            onClick={() => void moderate(job, "approve")}
                            aria-label={`Approve ${job.title}`}
                          >
                            {approving ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={approving || rejecting}
                            onClick={() => setRejectTarget(job)}
                            aria-label={`Reject ${job.title}`}
                          >
                            {rejecting ? <Loader2 className="animate-spin" aria-hidden /> : <X aria-hidden />}
                            Reject
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {attention.pendingJobs.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{attention.pendingJobs.length - 4} more in the moderation queue
                </p>
              )}
            </div>

            <ul className="space-y-2 border-t border-border pt-4">
              <AttentionRow
                icon={Flag}
                label="Open reports"
                count={attention.openReports}
                detail={`${attention.inReviewReports} more in review`}
                href="/admin/reports?status=open"
                cta="Open queue"
              />
              <AttentionRow
                icon={Building2}
                label="Unverified companies"
                count={attention.unverified}
                detail="Verify legitimate organisations"
                href="/admin/companies?status=unverified"
                cta="Review"
              />
              <AttentionRow
                icon={Users}
                label="Accounts pending activation"
                count={attention.pendingUsers}
                detail="New sign-ups awaiting a decision"
                href="/admin/users?status=pending"
                cta="Review"
              />
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" aria-hidden />
              Recent platform activity
            </CardTitle>
            <CardDescription>Latest applications, listings and sign-ups</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState title="No activity yet" description="Activity appears here as people use the marketplace." />
            ) : (
              <ol className="space-y-4">
                {activity.map((item) => {
                  const Icon = item.icon;
                  const body = (
                    <>
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-pretty">{item.text}</span>
                        <span className="block text-xs text-muted-foreground">{formatRelative(item.at)}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="-m-1 flex gap-3 rounded-lg p-1 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/60"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="flex gap-3">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-info" aria-hidden />
              Top companies by active jobs
            </CardTitle>
            <CardDescription>Published listings per company</CardDescription>
          </CardHeader>
          <CardContent>
            {topCompanies.length === 0 ? (
              <EmptyState
                title="No active listings"
                description="Companies appear here once they have published jobs."
              />
            ) : (
              <ol className="space-y-4">
                {topCompanies.map(({ company, active }, index) => (
                  <li key={company.id} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-semibold text-muted-foreground tabular-nums">{index + 1}</span>
                    <CompanyLogo company={company} size="sm" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/companies/${company.id}`}
                          className="truncate text-sm font-medium hover:text-primary hover:underline"
                        >
                          {company.name}
                        </Link>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {active} {active === 1 ? "job" : "jobs"}
                          {company.suspended && <span className="ml-1.5 text-destructive">suspended</span>}
                        </span>
                      </div>
                      <Progress
                        value={(active / maxActive) * 100}
                        aria-label={`${company.name}: ${active} active jobs`}
                        className={cn("h-1.5", company.suspended && "opacity-50")}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <Link
              href="/admin/companies"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-4 w-full justify-center")}
            >
              Manage companies
              <ArrowRight aria-hidden />
            </Link>
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">
        Counts above are live from this browser&apos;s demo data. Revenue, growth and plan charts are mock analytics (
        {formatCompact(analytics.planDistribution.reduce((n, p) => n + p.users, 0))} modelled users).
      </p>

      <ConfirmationDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        title="Reject this job?"
        destructive
        confirmLabel="Reject job"
        description={
          rejectTarget
            ? `"${rejectTarget.title}" will not appear on public pages and the employer will be notified that it was rejected.`
            : ""
        }
        onConfirm={async () => {
          if (rejectTarget) await moderate(rejectTarget, "reject");
        }}
      />
    </div>
  );
}

function AttentionRow({
  icon: Icon,
  label,
  count,
  detail,
  href,
  cta,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  detail: string;
  href: string;
  cta: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          count > 0 ? "bg-warning/15 text-warning" : "bg-success/15 text-success",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {label} <span className="tabular-nums">({count})</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <Link href={href} className={buttonVariants({ variant: "outline", size: "xs" })} aria-label={`${cta}: ${label}`}>
        {cta}
      </Link>
    </li>
  );
}
