"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarClock, CalendarPlus, FileText, MessageSquare, Video } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanyLogo } from "@/components/shared/company-logo";
import { EmptyState } from "@/components/shared/empty-state";
import { InterviewCard } from "@/components/shared/interview-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { appNow } from "@/lib/clock";
import { formatDateTime, formatRelative } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser, useHydrated } from "@/store/hooks";
import type { Interview } from "@/types";

function endMs(i: Interview): number {
  return Date.parse(i.scheduledAt) + i.durationMin * 60_000;
}

export default function SeekerInterviewsPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const interviews = useAppStore((s) => s.interviews);
  const conversations = useAppStore((s) => s.conversations);
  const companies = useAppStore((s) => s.companies);
  const jobs = useAppStore((s) => s.jobs);

  const { upcoming, past } = useMemo(() => {
    if (!hydrated || !user?.candidateId) return { upcoming: [], past: [] };
    const nowMs = appNow().getTime();
    const mine = interviews.filter((i) => i.candidateId === user.candidateId);
    const isLive = (i: Interview) => (i.status === "scheduled" || i.status === "rescheduled") && endMs(i) >= nowMs;
    return {
      upcoming: mine.filter(isLive).sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt)),
      past: mine.filter((i) => !isLive(i)).sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt)),
    };
  }, [hydrated, interviews, user]);

  function threadHref(interview: Interview): string {
    const thread =
      conversations.find((c) => c.applicationId === interview.applicationId) ??
      conversations.find((c) => c.candidateId === interview.candidateId && c.companyId === interview.companyId);
    return thread ? `/messages?c=${thread.id}` : "/messages";
  }

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <PageHeader title="Interviews" description="Your upcoming and past interviews with hiring teams." />
        <LoadingSkeleton variant="list" count={3} />
      </div>
    );
  }

  const next = upcoming[0];
  const nextCompany = next ? companies.find((c) => c.id === next.companyId) : undefined;
  const nextJob = next ? jobs.find((j) => j.id === next.jobId) : undefined;

  function renderList(list: Interview[], emptyTitle: string, showCta: boolean) {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={CalendarClock}
          title={emptyTitle}
          description={
            showCta
              ? "When a company invites you to interview, it will show up here with the meeting link and details."
              : "Completed and cancelled interviews are kept here for reference."
          }
          action={
            showCta ? (
              <Link href="/jobs" className={buttonVariants({ variant: "gradient" })}>
                Browse jobs
              </Link>
            ) : undefined
          }
        />
      );
    }
    return (
      <ul className="grid gap-4 lg:grid-cols-2">
        {list.map((interview) => {
          const upcomingNow = interview.status === "scheduled";
          return (
            <li key={interview.id} className="flex flex-col">
              <InterviewCard interview={interview} viewer="seeker" className="flex-1 rounded-b-none" />
              <div className="flex flex-wrap items-center gap-2 rounded-b-xl border border-t-0 border-border bg-muted/30 px-4 py-2.5">
                {upcomingNow && (
                  <span className="mr-auto inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    <CalendarClock className="size-3.5" aria-hidden />
                    Starts {formatRelative(interview.scheduledAt)}
                  </span>
                )}
                <Link
                  href={`/applications/${interview.applicationId}`}
                  className={buttonVariants({ variant: "ghost", size: "xs" })}
                >
                  <FileText aria-hidden />
                  Application
                </Link>
                <Link href={threadHref(interview)} className={buttonVariants({ variant: "ghost", size: "xs" })}>
                  <MessageSquare aria-hidden />
                  Message
                </Link>
                {upcomingNow && (
                  <Tooltip>
                    <TooltipTrigger
                      render={<span tabIndex={0} className="inline-flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />}
                    >
                      <Button variant="ghost" size="xs" disabled aria-label="Add to calendar (mock, unavailable)">
                        <CalendarPlus aria-hidden />
                        Add to calendar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Calendar sync is a mock in this demo</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Interviews" description="Your upcoming and past interviews with hiring teams." />

      {next && (
        <section
          aria-label="Next interview"
          className="card-glow flex flex-col gap-4 rounded-xl border border-primary/30 bg-linear-to-br from-indigo-500/10 to-violet-500/10 p-5 sm:flex-row sm:items-center"
        >
          {nextCompany && <CompanyLogo company={nextCompany} size="lg" />}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">Next up · {formatRelative(next.scheduledAt)}</p>
            <h2 className="truncate font-heading text-lg font-semibold">
              {next.type} with {nextCompany?.name ?? "the hiring team"}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {nextJob?.title ?? "Role"} · {formatDateTime(next.scheduledAt)} · {next.durationMin} min
            </p>
          </div>
          {next.meetingLink && (
            <a
              href={next.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "gradient" })}
            >
              <Video aria-hidden />
              Join meeting
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </section>
      )}

      <Tabs defaultValue="upcoming" className="gap-5">
        <TabsList>
          <TabsTrigger value="upcoming" className="px-3">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past" className="px-3">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">{renderList(upcoming, "No upcoming interviews", true)}</TabsContent>
        <TabsContent value="past">{renderList(past, "No past interviews yet", false)}</TabsContent>
      </Tabs>
    </div>
  );
}
