"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveFilterChips, FilterPanel, MobileFilterSheet } from "@/components/shared/filter-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { JobCard, JobCardSkeleton } from "@/components/shared/job-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { formatNumber } from "@/lib/format";
import {
  DEFAULT_JOB_FILTERS,
  countActiveFilters,
  filterAndSortJobs,
  getPublicJobs,
  type JobFilters,
  type JobSort,
} from "@/lib/job-filters";
import { computeMatch } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useHydrated } from "@/store/hooks";
import { ViewToggle, type BrowseView } from "./browse-controls";
import { JobFiltersPanel } from "./job-filters-panel";

const PAGE_SIZE = 9;

function BrowserSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <div className="hidden h-96 animate-pulse rounded-xl border border-border bg-card lg:block" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function JobsBrowserInner({ initial }: { initial: JobFilters }) {
  const hydrated = useHydrated();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const candidate = useCurrentCandidate();

  const [filters, setFilters] = useState<JobFilters>(initial);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [view, setView] = useState<BrowseView>("grid");

  const publicJobs = useMemo(() => getPublicJobs(jobs, companies), [jobs, companies]);
  const results = useMemo(
    () => filterAndSortJobs(publicJobs, companies, filters, candidate),
    [publicJobs, companies, filters, candidate],
  );
  const matchScores = useMemo(() => {
    if (!candidate || filters.sort !== "relevance") return null;
    return new Map(results.map((j) => [j.id, computeMatch(candidate, j).score]));
  }, [candidate, filters.sort, results]);

  function update(patch: Partial<JobFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setVisible(PAGE_SIZE);
  }
  function reset() {
    setFilters({ ...DEFAULT_JOB_FILTERS, sort: filters.sort });
    setVisible(PAGE_SIZE);
  }

  const activeCount = countActiveFilters(filters);

  const chips = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (filters.query) list.push({ key: "query", label: `“${filters.query}”` });
    if (filters.category) list.push({ key: "category", label: filters.category });
    if (filters.location) list.push({ key: "location", label: `Location: ${filters.location}` });
    filters.workModes.forEach((m) => list.push({ key: `mode:${m}`, label: m }));
    filters.types.forEach((t) => list.push({ key: `type:${t}`, label: t }));
    filters.experience.forEach((e) => list.push({ key: `exp:${e}`, label: `${e} level` }));
    if (filters.minSalary > 0) list.push({ key: "salary", label: `$${Math.round(filters.minSalary / 1000)}k+ / yr` });
    filters.ecosystems.forEach((e) => list.push({ key: `eco:${e}`, label: e }));
    filters.skills.forEach((s) => list.push({ key: `skill:${s}`, label: s }));
    if (filters.cryptoOnly) list.push({ key: "crypto", label: "Crypto payment" });
    return list;
  }, [filters]);

  function removeChip(key: string) {
    const [kind, ...rest] = key.split(":");
    const value = rest.join(":");
    switch (kind) {
      case "query":
        return update({ query: "" });
      case "category":
        return update({ category: "" });
      case "location":
        return update({ location: "" });
      case "mode":
        return update({ workModes: filters.workModes.filter((m) => m !== value) });
      case "type":
        return update({ types: filters.types.filter((t) => t !== value) });
      case "exp":
        return update({ experience: filters.experience.filter((e) => e !== value) });
      case "salary":
        return update({ minSalary: 0 });
      case "eco":
        return update({ ecosystems: filters.ecosystems.filter((e) => e !== value) });
      case "skill":
        return update({ skills: filters.skills.filter((s) => s !== value) });
      case "crypto":
        return update({ cryptoOnly: false });
    }
  }

  if (!hydrated) return <BrowserSkeleton />;

  const shown = results.slice(0, visible);
  const remaining = results.length - shown.length;

  const panel = <JobFiltersPanel filters={filters} onChange={update} jobs={publicJobs} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
      <div className="hidden lg:sticky lg:top-20 lg:block">
        <FilterPanel activeCount={activeCount} onReset={reset} className="max-h-[calc(100dvh-6rem)] overflow-y-auto scrollbar-thin">
          {panel}
        </FilterPanel>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={filters.query}
            onChange={(query) => update({ query })}
            placeholder="Search by title, skill or company…"
            aria-label="Search jobs"
            debounceMs={200}
            className="sm:flex-1"
          />
          <div className="flex items-center gap-2">
            <MobileFilterSheet activeCount={activeCount}>
              <div className="-mx-4 -my-4">
                <FilterPanel activeCount={activeCount} onReset={reset} className="rounded-none border-0">
                  {panel}
                </FilterPanel>
              </div>
            </MobileFilterSheet>
            <SelectField
              aria-label="Sort jobs"
              value={filters.sort}
              onChange={(sort) => update({ sort: sort as JobSort })}
              className="w-44"
              options={[
                { value: "newest", label: "Newest first" },
                { value: "relevance", label: candidate ? "Best match for you" : "Most relevant" },
                { value: "salary", label: "Salary: high to low" },
              ]}
            />
            <ViewToggle value={view} onChange={setView} className="hidden sm:inline-flex" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground tabular-nums">{formatNumber(results.length)}</span>{" "}
            {results.length === 1 ? "job" : "jobs"} found
          </p>
        </div>

        <ActiveFilterChips chips={chips} onRemove={removeChip} onClearAll={reset} />

        {results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No jobs match your filters"
            description="Try removing a filter or broadening your search. New roles are published every day."
            action={
              activeCount > 0 ? (
                <Button variant="outline" onClick={reset}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className={cn("grid gap-4", view === "grid" ? "md:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1")}>
              {shown.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  variant={view}
                  match={matchScores?.get(job.id)}
                />
              ))}
            </div>
            {remaining > 0 && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Load more jobs
                </Button>
                <p className="text-xs text-muted-foreground">
                  Showing {shown.length} of {results.length}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function JobsBrowserWithParams() {
  const params = useSearchParams();
  const key = params.toString();
  const initial: JobFilters = {
    ...DEFAULT_JOB_FILTERS,
    query: params.get("q") ?? "",
    location: params.get("location") ?? "",
    category: params.get("category") ?? "",
  };
  return <JobsBrowserInner key={key} initial={initial} />;
}

export function JobsBrowser() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="card" />}>
      <JobsBrowserWithParams />
    </Suspense>
  );
}
