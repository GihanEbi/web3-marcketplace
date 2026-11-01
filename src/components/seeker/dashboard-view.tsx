"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Bot,
  CalendarClock,
  FileText,
  Hourglass,
  MapPin,
  MessageSquareText,
  Search,
  Sparkles,
  Target,
  UserCircle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CompanyLogo } from "@/components/shared/company-logo";
import { EmptyState } from "@/components/shared/empty-state";
import { InterviewCard } from "@/components/shared/interview-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AIMatchScore } from "@/components/shared/ai-match-score";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { appNow } from "@/lib/clock";
import { formatJobSalary, formatRelative } from "@/lib/format";
import { computeMatch, profileCompletion } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useCurrentUser, useHydrated, useMyApplications, useSavedJobIds } from "@/store/hooks";
import type { ApplicationStatus } from "@/types";
import { ApplicationsOverTime, StatusDonut, type StatusDatum, type TimeDatum } from "./dashboard-charts";
import { acceptsApplications, PENDING_STATUSES } from "./job-utils";
import { profileTabHref, tabForMissing } from "./profile-utils";

const WEEK_MS = 7 * 86_400_000;

const EVENT_VERB: Record<ApplicationStatus, string> = {
  applied: "You applied for",
  under_review: "Your application is under review for",
  shortlisted: "You were shortlisted for",
  interview: "Interview stage reached for",
  offered: "You received an offer for",
  hired: "You were hired as",
  rejected: "Application not progressed for",
  withdrawn: "You withdrew from",
};



function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton variant="stats" />
      <div className="grid gap-6 xl:grid-cols-3">
        <LoadingSkeleton variant="detail" className="xl:col-span-3" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const candidate = useCurrentCandidate();
  const myApps = useMyApplications();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const interviews = useAppStore((s) => s.interviews);
  const savedIds = useSavedJobIds();
  const reduceMotion = useReducedMotion();

  const firstName = (candidate?.name ?? user?.name ?? "there").split(" ")[0];

  const data = useMemo(() => {
    if (!candidate) return null;
    const active = myApps.filter((a) => a.status !== "withdrawn");
    const appliedJobIds = new Set(active.map((a) => a.jobId));
    const now = appNow().getTime();

    const pending = myApps.filter((a) => PENDING_STATUSES.includes(a.status)).length;

    const upcoming = interviews
      .filter((i) => i.candidateId === candidate.id && i.status === "scheduled" && Date.parse(i.scheduledAt) >= now)
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));

    const recommended = jobs
      .filter((j) => acceptsApplications(j, companies) && !appliedJobIds.has(j.id))
      .map((job) => ({ job, match: computeMatch(candidate, job) }))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 4);

    const activity = myApps
      .flatMap((app) => app.timeline.map((event) => ({ app, event })))
      .sort((a, b) => Date.parse(b.event.at) - Date.parse(a.event.at))
      .slice(0, 6);

    const statusData: StatusDatum[] = APPLICATION_STATUSES.map((status) => ({
      status,
      count: myApps.filter((a) => a.status === status).length,
    })).filter((d) => d.count > 0);

    const weeks: TimeDatum[] = Array.from({ length: 8 }, (_, i) => {
      const end = now - (7 - i) * WEEK_MS;
      const start = end - WEEK_MS;
      return {
        label: format(new Date(start), "MMM d"),
        count: myApps.filter((a) => {
          const t = Date.parse(a.appliedAt);
          return t > start && t <= end;
        }).length,
      };
    });

    return { pending, upcoming, recommended, activity, statusData, weeks, completion: profileCompletion(candidate) };
  }, [candidate, myApps, interviews, jobs, companies]);

  if (!hydrated || !candidate || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading your job search overview…" />
        <DashboardSkeleton />
      </div>
    );
  }

  const { pending, upcoming, recommended, activity, statusData, weeks, completion } = data;
  const topJob = recommended[0]?.job;
  const aiPrompts = [
    { label: "What jobs match my skills?", href: "/ai-assistant?tab=chat" },
    topJob
      ? { label: `Write a cover letter for ${topJob.title}`, href: `/ai-assistant?tab=cover-letter&job=${topJob.id}` }
      : { label: "Write a cover letter", href: "/ai-assistant?tab=cover-letter" },
    { label: "Analyze my CV", href: "/resume-analysis" },
  ];
  const lookup = (jobId: string) => jobs.find((j) => j.id === jobId);
  const companyOf = (id: string) => companies.find((c) => c.id === id);
  const fade = reduceMotion ? undefined : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28 } };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Job seeker dashboard"
        title={
          <>
            Welcome back, <span className="gradient-text">{firstName}</span>
          </>
        }
        description="Here is where your job search stands today — applications, interviews and the roles that fit you best."
        actions={
          <>
            <Link href="/profile" className={buttonVariants({ variant: "outline" })}>
              <UserCircle aria-hidden />
              Edit profile
            </Link>
            <Link href="/jobs" className={buttonVariants({ variant: "gradient" })}>
              <Search aria-hidden />
              Browse jobs
            </Link>
          </>
        }
      />

      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total applications" value={myApps.length} icon={FileText} href="/applications" accent="primary" hint="All time" />
        <StatsCard label="Pending review" value={pending} icon={Hourglass} href="/applications" accent="warning" hint="Applied, in review or shortlisted" />
        <StatsCard label="Interview invitations" value={upcoming.length} icon={CalendarClock} href="/interviews" accent="info" hint="Upcoming and scheduled" />
        <StatsCard label="Saved jobs" value={savedIds.length} icon={Bookmark} href="/saved-jobs" accent="success" hint="Bookmarked for later" />
      </section>

      <section className="grid gap-6 xl:grid-cols-3" aria-label="Profile and application analytics">
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="size-5 text-primary" aria-hidden />
              Profile strength
            </CardTitle>
            <CardDescription>A complete profile gets noticed by more employers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <p className="font-heading text-4xl font-semibold tabular-nums">{completion.percent}%</p>
              <p className="text-xs text-muted-foreground">
                {completion.missing.length === 0 ? "Profile complete" : `${completion.missing.length} to go`}
              </p>
            </div>
            <Progress value={completion.percent} aria-label="Profile completion" />
            {completion.missing.length > 0 ? (
              <ul className="space-y-1.5" aria-label="Suggested profile improvements">
                {completion.missing.slice(0, 4).map((item) => (
                  <li key={item}>
                    <Link
                      href={profileTabHref(tabForMissing(item))}
                      className="group flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span>Add {item.toLowerCase()}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                Great work — every profile section is filled in.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications by status</CardTitle>
            <CardDescription>Where each of your applications stands.</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <StatusDonut data={statusData} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Apply to a job to see your pipeline here.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications over time</CardTitle>
            <CardDescription>Submitted per week, last 8 weeks.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationsOverTime data={weeks} />
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-primary" aria-hidden />
                Recommended opportunities
              </CardTitle>
              <CardDescription>Top matches for your skills, experience and preferences.</CardDescription>
              <CardAction>
                <Link href="/recommended-jobs" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  View all
                  <ArrowRight aria-hidden />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              {recommended.length === 0 ? (
                <EmptyState
                  title="No open matches right now"
                  description="You have applied to every open role we found. Check back soon or browse all jobs."
                  action={
                    <Link href="/jobs" className={buttonVariants({ variant: "gradient" })}>
                      Browse jobs
                    </Link>
                  }
                />
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {recommended.map(({ job, match }, index) => {
                    const company = companyOf(job.companyId);
                    return (
                      <motion.li key={job.id} {...(fade ? { ...fade, transition: { duration: 0.28, delay: index * 0.04 } } : {})}>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="group flex h-full items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                        >
                          {company && <CompanyLogo company={company} size="md" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium group-hover:text-primary">{job.title}</p>
                            <p className="truncate text-sm text-muted-foreground">{company?.name ?? "Company"}</p>
                            <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <MapPin className="size-3 shrink-0" aria-hidden />
                              {job.location} · {formatJobSalary(job)}
                            </p>
                          </div>
                          <AIMatchScore score={match.score} size="md" />
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="size-5 text-primary" aria-hidden />
                Recent application activity
              </CardTitle>
              <CardDescription>The latest updates across all of your applications.</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No activity yet"
                  description="Once you apply for a job, every status change shows up here."
                  action={
                    <Link href="/jobs" className={buttonVariants({ variant: "gradient" })}>
                      Find a job
                    </Link>
                  }
                />
              ) : (
                <ol className="divide-y divide-border">
                  {activity.map(({ app, event }) => {
                    const job = lookup(app.jobId);
                    const company = companyOf(app.companyId);
                    return (
                      <li key={`${app.id}-${event.id}`}>
                        <Link
                          href={`/applications/${app.id}`}
                          className="flex items-start gap-3 py-3 transition-colors hover:bg-muted/30 sm:px-2"
                        >
                          {company ? (
                            <CompanyLogo company={company} size="sm" className="mt-0.5" />
                          ) : (
                            <span className="size-8 shrink-0 rounded-lg bg-muted" aria-hidden />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-pretty">
                              {EVENT_VERB[event.status]} <span className="font-medium">{job?.title ?? "a role"}</span>
                              {company ? <span className="text-muted-foreground"> at {company.name}</span> : null}
                            </p>
                            {event.note && <p className="mt-0.5 truncate text-xs text-muted-foreground">{event.note}</p>}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <StatusBadge status={event.status} size="sm" />
                            <time dateTime={event.at} className="text-[11px] text-muted-foreground">
                              {formatRelative(event.at)}
                            </time>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-5 text-primary" aria-hidden />
                Upcoming interviews
              </CardTitle>
              <CardDescription>Your next scheduled conversations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No interviews scheduled. Employers will invite you here once they shortlist you.
                </p>
              ) : (
                upcoming.slice(0, 3).map((interview) => <InterviewCard key={interview.id} interview={interview} viewer="seeker" />)
              )}
              <Link href="/interviews" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
                View all interviews
                <ArrowRight aria-hidden />
              </Link>
            </CardContent>
          </Card>

          <section
            aria-label="AI career assistant"
            className="relative overflow-hidden rounded-xl border border-primary/30 bg-linear-to-br from-indigo-600/90 via-violet-600/90 to-fuchsia-600/80 p-5 text-white shadow-lg shadow-violet-500/20"
          >
            <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  <Bot className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-heading text-base font-semibold">AI career assistant</h2>
                  <p className="text-xs text-white/80">Cover letters, CV feedback and job matching in seconds.</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {aiPrompts.map((prompt) => (
                  <li key={prompt.label}>
                    <Link
                      href={prompt.href}
                      className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/15 transition-colors hover:bg-white/20"
                    >
                      <Sparkles className="size-3.5 shrink-0" aria-hidden />
                      {prompt.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/ai-assistant" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "bg-white text-violet-700 hover:bg-white/90")}>
                Open assistant
                <ArrowRight aria-hidden />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
