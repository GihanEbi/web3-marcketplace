"use client";

import { useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, format, startOfDay } from "date-fns";
import { Ban, CalendarClock, CalendarDays, CalendarPlus, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { InterviewCard } from "@/components/shared/interview-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SearchInput } from "@/components/shared/search-input";
import { StatsCard } from "@/components/shared/stats-card";
import { appNow } from "@/lib/clock";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser, useHydrated } from "@/store/hooks";
import type { Interview } from "@/types";
import { useInterviewActions } from "./use-interview-actions";

type BoardTab = "upcoming" | "past" | "cancelled";

const ACTIVE_STATUSES: Interview["status"][] = ["scheduled", "rescheduled"];

function startMs(i: Interview): number {
  return Date.parse(i.scheduledAt);
}

function endMs(i: Interview): number {
  return startMs(i) + i.durationMin * 60_000;
}

function dayLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  const diff = differenceInCalendarDays(date, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

interface InterviewsBoardProps {
  /** Opens the schedule dialog (used by the empty state CTA) */
  onSchedule?: () => void;
}

export function InterviewsBoard({ onSchedule }: InterviewsBoardProps) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const allInterviews = useAppStore((s) => s.interviews);
  const candidates = useAppStore((s) => s.candidates);
  const jobs = useAppStore((s) => s.jobs);
  const actions = useInterviewActions();

  const [tab, setTab] = useState<BoardTab>("upcoming");
  const [query, setQuery] = useState("");
  const [day, setDay] = useState<string | null>(null);

  const companyInterviews = useMemo(
    () => (user?.companyId ? allInterviews.filter((i) => i.companyId === user.companyId) : []),
    [allInterviews, user],
  );

  const data = useMemo(() => {
    if (!hydrated) return null;
    const now = appNow();
    const nowMs = now.getTime();
    const weekEnd = startOfDay(addDays(now, 7)).getTime();
    const q = query.trim().toLowerCase();

    const matchesQuery = (i: Interview) => {
      if (!q) return true;
      const candidate = candidates.find((c) => c.id === i.candidateId)?.name ?? "";
      const job = jobs.find((j) => j.id === i.jobId)?.title ?? "";
      return `${candidate} ${job} ${i.type}`.toLowerCase().includes(q);
    };

    const isActive = (i: Interview) => ACTIVE_STATUSES.includes(i.status);
    const upcomingAll = companyInterviews.filter((i) => isActive(i) && endMs(i) >= nowMs).sort((a, b) => startMs(a) - startMs(b));
    const pastAll = companyInterviews
      .filter((i) => i.status === "completed" || (isActive(i) && endMs(i) < nowMs))
      .sort((a, b) => startMs(b) - startMs(a));
    const cancelledAll = companyInterviews.filter((i) => i.status === "cancelled").sort((a, b) => startMs(b) - startMs(a));

    const strip = Array.from({ length: 7 }, (_, n) => {
      const date = addDays(startOfDay(now), n);
      const key = format(date, "yyyy-MM-dd");
      return {
        key,
        date,
        label: n === 0 ? "Today" : format(date, "EEE"),
        count: upcomingAll.filter((i) => format(new Date(i.scheduledAt), "yyyy-MM-dd") === key).length,
      };
    });

    const filterDay = (list: Interview[]) =>
      day ? list.filter((i) => format(new Date(i.scheduledAt), "yyyy-MM-dd") === day) : list;

    const lists: Record<BoardTab, Interview[]> = {
      upcoming: filterDay(upcomingAll).filter(matchesQuery),
      past: pastAll.filter(matchesQuery),
      cancelled: cancelledAll.filter(matchesQuery),
    };

    return {
      now,
      lists,
      counts: { upcoming: upcomingAll.length, past: pastAll.length, cancelled: cancelledAll.length },
      stats: {
        upcoming: upcomingAll.length,
        thisWeek: upcomingAll.filter((i) => startMs(i) < weekEnd).length,
        completed: companyInterviews.filter((i) => i.status === "completed").length,
        cancelled: cancelledAll.length,
      },
      strip,
    };
  }, [hydrated, companyInterviews, candidates, jobs, query, day]);

  if (!data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="stats" />
        <LoadingSkeleton variant="list" count={3} />
      </div>
    );
  }

  function renderList(key: BoardTab) {
    if (!data) return null;
    const list = data.lists[key];
    if (list.length === 0) {
      const none = data.counts[key] === 0;
      return (
        <EmptyState
          icon={CalendarClock}
          title={
            none
              ? key === "upcoming"
                ? "No upcoming interviews"
                : key === "past"
                  ? "No past interviews yet"
                  : "No cancelled interviews"
              : "No interviews match your filters"
          }
          description={
            none && key === "upcoming"
              ? "Schedule an interview with a shortlisted candidate to see it here."
              : none
                ? undefined
                : "Try clearing the search or the day filter."
          }
          action={
            none && key === "upcoming" && onSchedule ? (
              <Button variant="gradient" onClick={onSchedule}>
                <CalendarPlus aria-hidden />
                Schedule interview
              </Button>
            ) : undefined
          }
        />
      );
    }

    // group by calendar day
    const groups: { label: string; key: string; items: Interview[] }[] = [];
    for (const interview of list) {
      const k = format(new Date(interview.scheduledAt), "yyyy-MM-dd");
      const last = groups[groups.length - 1];
      if (last && last.key === k) last.items.push(interview);
      else groups.push({ key: k, label: dayLabel(interview.scheduledAt, data.now), items: [interview] });
    }

    return (
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.key} aria-label={group.label} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {group.label}
              <span className="ml-2 text-xs font-normal">
                {group.items.length} interview{group.items.length === 1 ? "" : "s"}
              </span>
            </h3>
            <ul className="grid gap-3 lg:grid-cols-2">
              {group.items.map((interview) => (
                <li key={interview.id}>
                  <InterviewCard
                    interview={interview}
                    viewer="employer"
                    onReschedule={actions.onReschedule}
                    onCancel={actions.onCancel}
                    onComplete={actions.onComplete}
                    onNotes={actions.onNotes}
                    className="h-full"
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Upcoming" value={data.stats.upcoming} icon={CalendarClock} accent="primary" hint="scheduled interviews" />
        <StatsCard label="This week" value={data.stats.thisWeek} icon={CalendarDays} accent="info" hint="next 7 days" />
        <StatsCard label="Completed" value={data.stats.completed} icon={CircleCheckBig} accent="success" hint="all time" />
        <StatsCard label="Cancelled" value={data.stats.cancelled} icon={Ban} accent="danger" hint="all time" />
      </div>

      <section aria-label="Week at a glance" className="rounded-xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">Next 7 days</h2>
          {day && (
            <Button variant="ghost" size="xs" onClick={() => setDay(null)}>
              Clear day filter
            </Button>
          )}
        </div>
        <ul className="grid grid-cols-7 gap-1.5">
          {data.strip.map((d) => {
            const active = day === d.key;
            return (
              <li key={d.key}>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={`${format(d.date, "EEEE, MMM d")}: ${d.count} interview${d.count === 1 ? "" : "s"}`}
                  onClick={() => {
                    setDay(active ? null : d.key);
                    setTab("upcoming");
                  }}
                  className={cn(
                    "flex w-full flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
                    active ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted",
                  )}
                >
                  <span className="text-[11px] text-muted-foreground">{d.label}</span>
                  <span className="font-heading text-base font-semibold tabular-nums">{format(d.date, "d")}</span>
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                      d.count > 0 ? "gradient-brand text-white" : "bg-muted text-muted-foreground/60",
                    )}
                  >
                    {d.count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Tabs value={tab} onValueChange={(v) => setTab(v as BoardTab)} className="gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="upcoming" className="px-3">Upcoming ({data.counts.upcoming})</TabsTrigger>
            <TabsTrigger value="past" className="px-3">Past ({data.counts.past})</TabsTrigger>
            <TabsTrigger value="cancelled" className="px-3">Cancelled ({data.counts.cancelled})</TabsTrigger>
          </TabsList>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search candidate or job…"
            aria-label="Search interviews"
            className="sm:max-w-xs"
          />
        </div>
        <TabsContent value="upcoming">{renderList("upcoming")}</TabsContent>
        <TabsContent value="past">{renderList("past")}</TabsContent>
        <TabsContent value="cancelled">{renderList("cancelled")}</TabsContent>
      </Tabs>

      {actions.dialogs}
    </div>
  );
}
