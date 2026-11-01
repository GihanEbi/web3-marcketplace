"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Crown,
  FileText,
  FolderKanban,
  Plus,
  Sparkles,
  Star,
  TriangleAlert,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AIMatchScore } from "@/components/shared/ai-match-score";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InterviewCard } from "@/components/shared/interview-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatRelative, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AI_EMPLOYER_SUGGESTIONS } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentCompany, useCurrentUser, useHydrated } from "@/store/hooks";
import { ApplicationsOverTimeChart, ChartCard, PipelineChart, TopJobsChart } from "./employer-charts";
import { useEmployerData, type JobPerformance } from "./use-employer-data";

function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {action.label}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

const performanceColumns: DataTableColumn<JobPerformance>[] = [
  {
    key: "job",
    header: "Job",
    sortValue: (p) => p.job.title,
    cell: (p) => (
      <Link
        href={`/employer/jobs/${p.job.id}/applicants`}
        className="block max-w-56 truncate rounded-sm font-medium outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {p.job.title}
      </Link>
    ),
  },
  { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.job.status} size="sm" /> },
  {
    key: "applications",
    header: "Applications",
    sortValue: (p) => p.applications,
    cell: (p) => <span className="font-medium tabular-nums">{p.applications}</span>,
  },
  {
    key: "advanced",
    header: "Advanced",
    sortValue: (p) => p.shortlisted,
    cell: (p) => <span className="tabular-nums">{p.shortlisted}</span>,
  },
  {
    key: "match",
    header: "Avg. match",
    sortValue: (p) => p.avgMatch,
    cell: (p) => <AIMatchScore score={p.avgMatch} size="sm" />,
  },
];

export function EmployerDashboard() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const candidates = useAppStore((s) => s.candidates);
  const jobsAll = useAppStore((s) => s.jobs);
  const plans = useAppStore((s) => s.adminSettings.plans);
  const data = useEmployerData();

  const candidateById = useMemo(() => new Map(candidates.map((c) => [c.id, c])), [candidates]);
  const jobById = useMemo(() => new Map(jobsAll.map((j) => [j.id, j])), [jobsAll]);

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employer dashboard" description="Loading your recruitment overview…" />
        <LoadingSkeleton variant="stats" count={5} />
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  if (!user || !company) {
    return (
      <EmptyState
        icon={BriefcaseBusiness}
        title="No company found"
        description="Sign in with an employer account to see your recruitment dashboard."
      />
    );
  }

  const { stats, pipeline, weekly, jobPerformance, recentApplications, upcomingInterviews } = data;
  const firstName = user.name.split(" ")[0];
  const plan = plans.find((p) => p.id === user.plan);

  const statCards: {
    label: string;
    value: number;
    icon: LucideIcon;
    accent: "primary" | "success" | "warning" | "info";
    href: string;
    hint: string;
    trend?: { value: string };
  }[] = [
    {
      label: "Active jobs",
      value: stats.activeJobs,
      icon: BriefcaseBusiness,
      accent: "primary",
      href: "/employer/jobs",
      hint: `of ${pluralize(stats.totalJobs, "job")} total`,
    },
    {
      label: "Total applications",
      value: stats.totalApplications,
      icon: FileText,
      accent: "info",
      href: "/employer/candidates",
      hint: stats.newApplicationsThisWeek > 0 ? "this week" : "none this week",
      trend: stats.newApplicationsThisWeek > 0 ? { value: `+${stats.newApplicationsThisWeek}` } : undefined,
    },
    {
      label: "Shortlisted candidates",
      value: stats.shortlisted,
      icon: UserCheck,
      accent: "success",
      href: "/employer/candidates",
      hint: "ready for interviews",
    },
    {
      label: "Upcoming interviews",
      value: stats.upcomingInterviews,
      icon: CalendarClock,
      accent: "warning",
      href: "/employer/interviews",
      hint: "scheduled",
    },
    {
      label: "Open freelance projects",
      value: stats.openProjects,
      icon: FolderKanban,
      accent: "primary",
      href: "/employer/projects",
      hint: "accepting proposals",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={company.name}
        title={`Welcome back, ${firstName}`}
        description={`Here's how hiring at ${company.name} is going. Everything below updates live as jobs and candidates change.`}
        actions={
          <>
            <Link href="/employer/jobs/create" className={buttonVariants({ variant: "gradient" })}>
              <Plus aria-hidden />
              Post a job
            </Link>
            <Link href="/employer/candidates" className={buttonVariants({ variant: "outline" })}>
              <Users aria-hidden />
              Review applicants
            </Link>
            <Link href="/employer/projects/create" className={buttonVariants({ variant: "outline" })}>
              <FolderKanban aria-hidden />
              Create project
            </Link>
          </>
        }
      />

      {company.suspended && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <p>
            <span className="font-medium">Your company is currently suspended.</span> Your jobs are hidden from candidates until
            an admin lifts the suspension.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {statCards.map((card) => (
          <StatsCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            accent={card.accent}
            href={card.href}
            hint={card.hint}
            trend={card.trend}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Applications over time"
          description="New applications per week, last 8 weeks"
          className="xl:col-span-2"
        >
          <ApplicationsOverTimeChart data={weekly} />
        </ChartCard>
        <ChartCard title="Recruitment pipeline" description="Applications by stage, Applied to Hired">
          <PipelineChart data={pipeline} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Recent applications"
          description="The latest candidates to apply to your jobs"
          action={{ href: "/employer/candidates", label: "All candidates" }}
          className="xl:col-span-2"
        >
          {recentApplications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications yet"
              description="Applications will show up here as soon as candidates apply."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <ul className="divide-y divide-border">
              {recentApplications.map((app) => {
                const candidate = candidateById.get(app.candidateId);
                const job = jobById.get(app.jobId);
                return (
                  <motion.li
                    key={app.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                      <UserAvatar name={candidate?.name ?? "Candidate"} src={candidate?.avatar} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{candidate?.name ?? "Unknown candidate"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {job?.title ?? "Role unavailable"} · {formatRelative(app.appliedAt)}
                        </p>
                      </div>
                    </div>
                    <AIMatchScore score={app.matchScore} size="sm" />
                    <StatusBadge status={app.status} context="ats" size="sm" />
                    <Link
                      href={`/employer/jobs/${app.jobId}/applicants?app=${app.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      aria-label={`Review application from ${candidate?.name ?? "candidate"}`}
                    >
                      Review
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Upcoming interviews"
          description="Your next scheduled conversations"
          action={{ href: "/employer/interviews", label: "View all" }}
        >
          {upcomingInterviews.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No interviews scheduled"
              description="Shortlist a candidate and schedule an interview from the applicant tracker."
              className="border-0 bg-transparent px-2 py-8"
            />
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.slice(0, 3).map((interview) => (
                <InterviewCard key={interview.id} interview={interview} viewer="employer" className="p-4" />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Top-performing jobs" description="Applications per job (top 5)">
          <TopJobsChart data={jobPerformance} />
        </ChartCard>
        <Panel
          title="Job performance"
          description="How each posting converts applicants"
          action={{ href: "/employer/jobs", label: "Manage jobs" }}
          className="xl:col-span-2"
        >
          <DataTable
            caption="Top job performance"
            columns={performanceColumns}
            data={jobPerformance}
            rowKey={(p) => p.job.id}
            pageSize={5}
            className="border-0"
            emptyState={
              <EmptyState
                icon={BriefcaseBusiness}
                title="No job activity yet"
                description="Publish a job and its applicant statistics will appear here."
                action={
                  <Link href="/employer/jobs/create" className={buttonVariants({ variant: "gradient" })}>
                    <Plus aria-hidden />
                    Post a job
                  </Link>
                }
                className="border-0 bg-transparent py-4"
              />
            }
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="relative overflow-hidden rounded-xl border border-primary/25 bg-linear-to-br from-indigo-500/10 via-violet-500/10 to-fuchsia-500/10 p-5">
          <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-violet-500/30">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-base font-semibold">AI recruitment assistant</h2>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">
                Summarise candidates, draft job descriptions, prepare interview questions and get pipeline insights. The AI
                only recommends. You decide who moves forward.
              </p>
            </div>
          </div>
          <ul className="relative mt-4 flex flex-wrap gap-2" aria-label="Example prompts">
            {AI_EMPLOYER_SUGGESTIONS.slice(0, 3).map((prompt) => (
              <li key={prompt} className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                {prompt}
              </li>
            ))}
          </ul>
          <Link href="/employer/ai-assistant" className={cn(buttonVariants({ variant: "gradient" }), "relative mt-5")}>
            <Sparkles aria-hidden />
            Open AI assistant
          </Link>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
                <Crown className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-heading text-base font-semibold">Your plan</h2>
                <p className="text-sm text-muted-foreground">
                  {plan ? `${plan.name} · ${plan.priceMonthly === 0 ? "Free" : `$${plan.priceMonthly}/month`}` : user.plan}
                </p>
              </div>
            </div>
            <span className="inline-flex h-6 items-center rounded-full bg-success/15 px-2.5 text-xs font-medium text-success ring-1 ring-success/30 ring-inset">
              Active
            </span>
          </div>
          {plan && (
            <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
              {plan.features.slice(0, 4).map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Star className="size-3.5 shrink-0 text-primary" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {user.plan === "business"
              ? "You have access to the full recruitment suite. Plans are simulated; no payment is ever taken."
              : "Upgrade to Business for the full recruitment suite, applicant tracking and AI tools."}
          </p>
          <Link href="/pricing" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
            {user.plan === "business" ? "View plans" : "Compare plans"}
          </Link>
        </section>
      </div>
    </div>
  );
}
