"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, RotateCcw, Table2, Users } from "lucide-react";
import { ApplicantsTable } from "@/components/ats/applicants-table";
import { CandidateDetailSheet } from "@/components/ats/candidate-detail-sheet";
import { useApplicantRows, useCompanyApplications, type ApplicantRow } from "@/components/ats/ats-utils";
import { useAtsWorkflow } from "@/components/ats/use-ats-workflow";
import { Button, buttonVariants } from "@/components/ui/button";
import { CandidateCard } from "@/components/shared/candidate-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { ATS_STAGE_LABEL, EXPERIENCE_LEVELS } from "@/lib/constants";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";

type SortKey = "match" | "recent" | "experience";
type ViewMode = "grid" | "table";

const SORT_OPTIONS = [
  { value: "match", label: "Best match" },
  { value: "recent", label: "Most recent" },
  { value: "experience", label: "Most experienced" },
];

const MATCH_OPTIONS = [
  { value: "0", label: "Any match score" },
  { value: "60", label: "60+ match" },
  { value: "70", label: "70+ match" },
  { value: "80", label: "80+ match" },
  { value: "90", label: "90+ match" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.entries(ATS_STAGE_LABEL).map(([value, label]) => ({ value, label })),
  { value: "withdrawn", label: "Withdrawn" },
];

/** Most recent live application wins; withdrawn ones only if nothing else exists. */
function pickRepresentative(rows: ApplicantRow[]): ApplicantRow {
  const live = rows.filter((r) => r.application.status !== "withdrawn");
  const pool = live.length > 0 ? live : rows;
  return pool.reduce((best, row) =>
    Date.parse(row.application.appliedAt) > Date.parse(best.application.appliedAt) ? row : best,
  );
}

function TalentPool() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";

  const hydrated = useHydrated();
  const jobs = useAppStore((s) => s.jobs);
  const applications = useCompanyApplications();
  const rows = useApplicantRows(applications);
  const workflow = useAtsWorkflow();

  const [query, setQuery] = useState(qParam);
  const [lastQ, setLastQ] = useState(qParam);
  if (qParam !== lastQ) {
    setLastQ(qParam);
    setQuery(qParam);
  }
  const [jobFilter, setJobFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const [minMatch, setMinMatch] = useState("0");
  const [skill, setSkill] = useState("all");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState<SortKey>("match");
  const [view, setView] = useState<ViewMode>("grid");
  const [openId, setOpenId] = useState<string | null>(null);

  const jobOptions = useMemo(() => {
    const ids = new Set(rows.map((r) => r.application.jobId));
    return [
      { value: "all", label: "All jobs" },
      ...jobs.filter((j) => ids.has(j.id)).map((j) => ({ value: j.id, label: j.title })),
    ];
  }, [rows, jobs]);

  const skillOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { candidate } of rows) for (const s of candidate.skills) counts.set(s, (counts.get(s) ?? 0) + 1);
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([s]) => s);
    return [{ value: "all", label: "Any skill" }, ...sorted.slice(0, 40).sort().map((s) => ({ value: s, label: s }))];
  }, [rows]);

  const candidatesFound = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = Number(minMatch);
    // application-level filters first, then group per candidate
    const eligible = rows.filter(({ application }) => {
      if (jobFilter !== "all" && application.jobId !== jobFilter) return false;
      if (status !== "all" && application.status !== status) return false;
      if (application.matchScore < min) return false;
      return true;
    });
    const byCandidate = new Map<string, ApplicantRow[]>();
    for (const row of eligible) {
      const list = byCandidate.get(row.candidate.id) ?? [];
      list.push(row);
      byCandidate.set(row.candidate.id, list);
    }
    const reps = [...byCandidate.values()].map(pickRepresentative).filter(({ candidate }) => {
      if (level !== "all" && candidate.experienceLevel !== level) return false;
      if (skill !== "all" && !candidate.skills.includes(skill)) return false;
      if (!q) return true;
      return (
        candidate.name.toLowerCase().includes(q) ||
        candidate.headline.toLowerCase().includes(q) ||
        candidate.location.toLowerCase().includes(q) ||
        candidate.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
    reps.sort((a, b) => {
      if (sort === "recent") return Date.parse(b.application.appliedAt) - Date.parse(a.application.appliedAt);
      if (sort === "experience") return b.candidate.yearsOfExperience - a.candidate.yearsOfExperience;
      return b.application.matchScore - a.application.matchScore;
    });
    return reps;
  }, [rows, query, jobFilter, status, minMatch, skill, level, sort]);

  const filtersActive =
    query.trim() !== "" || jobFilter !== "all" || status !== "all" || minMatch !== "0" || skill !== "all" || level !== "all";
  const uniqueCandidates = useMemo(() => new Set(rows.map((r) => r.candidate.id)).size, [rows]);

  function resetFilters() {
    setQuery("");
    setJobFilter("all");
    setStatus("all");
    setMinMatch("0");
    setSkill("all");
    setLevel("all");
  }

  if (!hydrated) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description={
          rows.length === 0
            ? "Everyone who applies to your jobs lands in your talent pool."
            : `${pluralize(uniqueCandidates, "candidate")} across ${pluralize(applications.length, "application")} to your jobs.`
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants yet"
          description="Once candidates apply to your published jobs, they will show up here with match scores and full profiles."
          action={
            <Link href="/employer/jobs" className={buttonVariants({ variant: "gradient" })}>
              Manage jobs
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search by name, headline, location or skill…"
                aria-label="Search candidates"
                className="lg:max-w-md"
              />
              <div className="flex items-center gap-2 lg:ml-auto">
                <SelectField
                  aria-label="Sort candidates"
                  value={sort}
                  onChange={(v) => setSort(v as SortKey)}
                  options={SORT_OPTIONS}
                  className="w-44"
                />
                <div role="group" aria-label="View mode" className="flex rounded-lg border border-border p-0.5">
                  {(
                    [
                      { mode: "grid", label: "Grid view", icon: LayoutGrid },
                      { mode: "table", label: "Table view", icon: Table2 },
                    ] as const
                  ).map(({ mode, label, icon: Icon }) => (
                    <Button
                      key={mode}
                      type="button"
                      variant={view === mode ? "secondary" : "ghost"}
                      size="icon-sm"
                      aria-label={label}
                      aria-pressed={view === mode}
                      onClick={() => setView(mode)}
                    >
                      <Icon aria-hidden />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              <SelectField aria-label="Filter by job" value={jobFilter} onChange={setJobFilter} options={jobOptions} />
              <SelectField aria-label="Filter by status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
              <SelectField aria-label="Minimum match score" value={minMatch} onChange={setMinMatch} options={MATCH_OPTIONS} />
              <SelectField aria-label="Filter by skill" value={skill} onChange={setSkill} options={skillOptions} />
              <SelectField
                aria-label="Filter by experience level"
                value={level}
                onChange={setLevel}
                options={[{ value: "all", label: "Any level" }, ...EXPERIENCE_LEVELS.map((l) => ({ value: l, label: l }))]}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground" aria-live="polite">
                Showing {candidatesFound.length} of {uniqueCandidates} candidates
              </p>
              {filtersActive && (
                <Button variant="ghost" size="xs" onClick={resetFilters}>
                  <RotateCcw aria-hidden />
                  Reset filters
                </Button>
              )}
            </div>
          </div>

          {candidatesFound.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No candidates match these filters"
              description="Widen the match score, skill or job filters to see more of your talent pool."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  <RotateCcw aria-hidden />
                  Reset filters
                </Button>
              }
            />
          ) : view === "grid" ? (
            <ul className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3")}>
              {candidatesFound.map(({ application, candidate, job }) => (
                <li key={candidate.id}>
                  <CandidateCard
                    candidate={candidate}
                    application={application}
                    job={job}
                    onOpen={() => setOpenId(application.id)}
                    className="h-full"
                  />
                  {job && (
                    <p className="mt-1.5 truncate px-1 text-xs text-muted-foreground">
                      Applied for <span className="font-medium text-foreground">{job.title}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <ApplicantsTable rows={candidatesFound} workflow={workflow} onOpen={setOpenId} showToolbar={false} />
          )}
        </>
      )}

      <CandidateDetailSheet
        applicationId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        onApplicationChange={setOpenId}
      />
      {workflow.dialogs}
    </div>
  );
}

export default function EmployerCandidatesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="page" />}>
      <TalentPool />
    </Suspense>
  );
}
