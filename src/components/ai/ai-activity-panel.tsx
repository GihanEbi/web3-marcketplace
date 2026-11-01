"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIMatchScore } from "@/components/shared/ai-match-score";
import { CompanyLogo } from "@/components/shared/company-logo";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatJobSalary, formatRelative } from "@/lib/format";
import { getPublicJobs } from "@/lib/job-filters";
import { computeMatch } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useHydrated } from "@/store/hooks";
import type { AIHistoryType } from "@/types";
import { AI_HISTORY_META, EMPLOYER_HISTORY_TYPES, SEEKER_HISTORY_TYPES } from "./ai-meta";

const PAGE_SIZE = 8;

/** Top 3 deterministic job matches for the current candidate. */
export function RecentRecommendations({ className }: { className?: string }) {
  const candidate = useCurrentCandidate();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);

  const top = useMemo(() => {
    if (!candidate) return [];
    return getPublicJobs(jobs, companies)
      .map((job) => ({ job, match: computeMatch(candidate, job), company: companies.find((c) => c.id === job.companyId) }))
      .sort((a, b) => b.match.score - a.match.score || a.job.id.localeCompare(b.job.id))
      .slice(0, 3);
  }, [candidate, jobs, companies]);

  return (
    <section aria-labelledby="ai-recs-heading" className={cn("rounded-xl border bg-card", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h3 id="ai-recs-heading" className="flex items-center gap-2 text-sm font-semibold">
          <Target className="size-4 text-primary" aria-hidden />
          Recent AI recommendations
        </h3>
        <Link href="/recommended-jobs" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          See all
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </header>
      {top.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">No open jobs to recommend right now. Check back soon.</p>
      ) : (
        <ul className="divide-y">
          {top.map(({ job, match, company }) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`} className="flex items-center gap-3 p-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50">
                {company && <CompanyLogo company={company} size="md" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{job.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {company?.name ?? "Company"} · {formatJobSalary(job)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {match.matchingSkills.length} of {job.skills.length} skills match
                  </span>
                </span>
                <AIMatchScore score={match.score} size="md" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface AIActivityPanelProps {
  role: "seeker" | "employer";
  className?: string;
}

/** History of AI actions for a role, with type filters and (for seekers) a recommendations block. */
export function AIActivityPanel({ role, className }: AIActivityPanelProps) {
  const hydrated = useHydrated();
  const history = useAppStore((s) => s.aiHistory);
  const [filter, setFilter] = useState<AIHistoryType | "all">("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const items = useMemo(
    () => history.filter((h) => h.role === role).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [history, role],
  );

  const types = useMemo(() => {
    const preferred = role === "seeker" ? SEEKER_HISTORY_TYPES : EMPLOYER_HISTORY_TYPES;
    const present = new Set(items.map((i) => i.type));
    return [...preferred.filter((t) => present.has(t)), ...Array.from(present).filter((t) => !preferred.includes(t))];
  }, [items, role]);

  const counts = useMemo(() => {
    const map = new Map<AIHistoryType, number>();
    for (const i of items) map.set(i.type, (map.get(i.type) ?? 0) + 1);
    return map;
  }, [items]);

  const filtered = useMemo(() => (filter === "all" ? items : items.filter((i) => i.type === filter)), [items, filter]);
  const shown = filtered.slice(0, visible);

  if (!hydrated) return <LoadingSkeleton variant="list" count={4} />;

  return (
    <div className={cn("space-y-6", className)}>
      {role === "seeker" && <RecentRecommendations />}

      <section aria-labelledby="ai-activity-heading" className="rounded-xl border bg-card">
        <header className="space-y-3 border-b px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h3 id="ai-activity-heading" className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" aria-hidden />
              AI activity
            </h3>
            <span className="text-xs text-muted-foreground">{items.length} total</span>
          </div>
          {items.length > 0 && (
            <div role="group" aria-label="Filter AI activity by type" className="flex flex-wrap gap-1.5">
              <FilterChip active={filter === "all"} onClick={() => { setFilter("all"); setVisible(PAGE_SIZE); }} label={`All (${items.length})`} />
              {types.map((t) => (
                <FilterChip
                  key={t}
                  active={filter === t}
                  onClick={() => { setFilter(t); setVisible(PAGE_SIZE); }}
                  label={`${AI_HISTORY_META[t].label} (${counts.get(t) ?? 0})`}
                />
              ))}
            </div>
          )}
        </header>

        {items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Sparkles}
              title="No AI activity yet"
              description={
                role === "seeker"
                  ? "Chat with the assistant, generate a cover letter or analyse your resume — your AI actions will be listed here."
                  : "Generate a job description, compare candidates or ask for insights — your AI actions will be listed here."
              }
              className="border-none bg-transparent"
            />
          </div>
        ) : (
          <>
            <ol className="divide-y">
              {shown.map((item) => {
                const meta = AI_HISTORY_META[item.type];
                const Icon = meta.icon;
                return (
                  <li key={item.id} className="flex items-start gap-3 p-4">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{meta.label}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-pretty text-muted-foreground">{item.summary}</p>
                    </div>
                    <time dateTime={item.createdAt} className="shrink-0 pt-0.5 text-[11px] whitespace-nowrap text-muted-foreground">
                      {formatRelative(item.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ol>
            {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No {filter === "all" ? "" : AI_HISTORY_META[filter].label.toLowerCase()} activity yet.</p>}
            {filtered.length > visible && (
              <div className="border-t p-3 text-center">
                <Button type="button" variant="ghost" size="sm" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Show more ({filtered.length - visible} older)
                </Button>
              </div>
            )}
          </>
        )}
      </section>

    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        active ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
