"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Banknote, Check, ExternalLink, FilterX, Gauge, MapPin, Sparkles, Target } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AIMatchScore, MatchBreakdown } from "@/components/shared/ai-match-score";
import { CompanyLogo } from "@/components/shared/company-logo";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SaveJobButton } from "@/components/shared/save-job-button";
import { SelectField } from "@/components/shared/select-field";
import { SkillTagList } from "@/components/shared/skill-tag";
import { BLOCKCHAINS, WORK_MODES } from "@/lib/constants";
import { formatDate, formatJobSalary } from "@/lib/format";
import { computeMatch, matchLabel } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useHydrated, useMyApplications } from "@/store/hooks";
import type { Company, Job, MatchResult } from "@/types";
import { CoverLetterPanel } from "./cover-letter-panel";
import { acceptsApplications } from "./job-utils";

interface Scored {
  job: Job;
  company?: Company;
  match: MatchResult;
}

const MIN_MATCH_OPTIONS = [
  { value: "0", label: "Any match" },
  { value: "50", label: "50% and up" },
  { value: "65", label: "65% and up" },
  { value: "75", label: "75% and up" },
  { value: "85", label: "85% and up" },
];

export function RecommendedView() {
  const hydrated = useHydrated();
  const candidate = useCurrentCandidate();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const myApps = useMyApplications();
  const detailRef = useRef<HTMLDivElement>(null);

  const [minMatch, setMinMatch] = useState("0");
  const [workMode, setWorkMode] = useState("");
  const [ecosystem, setEcosystem] = useState("");
  const [cryptoOnly, setCryptoOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scored = useMemo<Scored[]>(() => {
    if (!candidate) return [];
    const applied = new Set(myApps.filter((a) => a.status !== "withdrawn").map((a) => a.jobId));
    return jobs
      .filter((j) => acceptsApplications(j, companies) && !applied.has(j.id))
      .map((job) => ({ job, company: companies.find((c) => c.id === job.companyId), match: computeMatch(candidate, job) }))
      .sort((a, b) => b.match.score - a.match.score || Date.parse(b.job.postedAt) - Date.parse(a.job.postedAt));
  }, [candidate, jobs, companies, myApps]);

  const filtered = useMemo(
    () =>
      scored.filter(
        (s) =>
          s.match.score >= Number(minMatch) &&
          (!workMode || s.job.workMode === workMode) &&
          (!ecosystem || s.job.blockchain === ecosystem) &&
          (!cryptoOnly || s.job.cryptoPayment),
      ),
    [scored, minMatch, workMode, ecosystem, cryptoOnly],
  );

  const stats = useMemo(() => {
    const strong = scored.filter((s) => s.match.score >= 72).length;
    const average = scored.length ? Math.round(scored.reduce((sum, s) => sum + s.match.score, 0) / scored.length) : 0;
    return { strong, average };
  }, [scored]);

  const active = filtered.find((s) => s.job.id === selectedId) ?? filtered[0];
  const filtersActive = minMatch !== "0" || workMode !== "" || ecosystem !== "" || cryptoOnly;

  function select(id: string) {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function resetFilters() {
    setMinMatch("0");
    setWorkMode("");
    setEcosystem("");
    setCryptoOnly(false);
  }

  if (!hydrated || !candidate) {
    return (
      <div className="space-y-6">
        <PageHeader title="Recommended jobs" description="Roles ranked by how well they fit you." />
        <LoadingSkeleton variant="list" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommended jobs"
        description="Open roles ranked by how well they match your skills, experience, salary and work preferences."
        actions={
          <Link href="/profile?tab=skills" className={buttonVariants({ variant: "outline" })}>
            <Target aria-hidden />
            Improve my matches
          </Link>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-3" aria-label="Recommendation summary">
        <li className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-success/10 text-success">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-xl leading-none font-semibold tabular-nums">{stats.strong}</p>
            <p className="mt-1 text-xs text-muted-foreground">Strong matches (72%+)</p>
          </div>
        </li>
        <li className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gauge className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-xl leading-none font-semibold tabular-nums">{stats.average}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Average match score</p>
          </div>
        </li>
        <li className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-info/10 text-info">
            <Target className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-xl leading-none font-semibold tabular-nums">{scored.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Open roles you haven&apos;t applied to</p>
          </div>
        </li>
      </ul>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="rec-min">Minimum match</Label>
          <SelectField id="rec-min" value={minMatch} onChange={setMinMatch} options={MIN_MATCH_OPTIONS} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rec-mode">Work mode</Label>
          <SelectField
            id="rec-mode"
            value={workMode}
            onChange={setWorkMode}
            options={[{ value: "", label: "Any work mode" }, ...WORK_MODES.map((m) => ({ value: m, label: m }))]}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rec-eco">Ecosystem</Label>
          <SelectField
            id="rec-eco"
            value={ecosystem}
            onChange={setEcosystem}
            options={[{ value: "", label: "Any ecosystem" }, ...BLOCKCHAINS.map((b) => ({ value: b, label: b }))]}
          />
        </div>
        <div className="flex h-9 items-center gap-2">
          <Switch id="rec-crypto" checked={cryptoOnly} onCheckedChange={(v) => setCryptoOnly(Boolean(v))} />
          <Label htmlFor="rec-crypto">Paid in crypto only</Label>
        </div>
        <div className="flex h-9 items-center sm:justify-end">
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <FilterX className="size-4" aria-hidden />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 || !active ? (
        <EmptyState
          icon={Target}
          title={scored.length === 0 ? "No open roles to recommend right now" : "No jobs match these filters"}
          description={
            scored.length === 0
              ? "You have applied to every open role we found. New jobs are added all the time — check back soon."
              : "Try lowering the minimum match or clearing a filter to see more roles."
          }
          action={
            scored.length === 0 ? (
              <Link href="/jobs" className={buttonVariants({ variant: "gradient" })}>
                Browse all jobs
              </Link>
            ) : (
              <button type="button" onClick={resetFilters} className={buttonVariants({ variant: "outline" })}>
                Reset filters
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
          <div className="lg:col-span-2">
            <p className="mb-2 text-xs text-muted-foreground" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "role" : "roles"} · best match first
            </p>
            <ul className="space-y-2 lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto lg:pr-1 scrollbar-thin" aria-label="Recommended jobs">
              {filtered.map(({ job, company, match }) => {
                const isActive = job.id === active.job.id;
                return (
                  <li key={job.id}>
                    <button
                      type="button"
                      onClick={() => select(job.id)}
                      aria-pressed={isActive}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        isActive ? "border-primary/60 bg-primary/10 shadow-sm" : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      {company && <CompanyLogo company={company} size="md" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{job.title}</span>
                        <span className="block truncate text-sm text-muted-foreground">{company?.name ?? "Unknown company"}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden />
                            {job.workMode}
                          </span>
                          <span>{formatJobSalary(job)}</span>
                        </span>
                      </span>
                      <AIMatchScore score={match.score} size="md" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div ref={detailRef} className="scroll-mt-24 space-y-5 lg:col-span-3 lg:sticky lg:top-24">
            <RecommendationDetail key={active.job.id} item={active} candidateId={candidate.id} />
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationDetail({ item, candidateId }: { item: Scored; candidateId: string }) {
  const { job, company, match } = item;
  return (
    <article className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {company && <CompanyLogo company={company} size="lg" />}
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-semibold tracking-tight text-balance">{job.title}</h2>
            <p className="text-sm text-muted-foreground">
              {company?.name ?? "Unknown company"} · {job.location} · {job.workMode}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              <Banknote className="size-4 text-muted-foreground" aria-hidden />
              {formatJobSalary(job)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AIMatchScore score={match.score} size="lg" />
          <div className="leading-tight">
            <p className="text-sm font-semibold">{matchLabel(match.score)} match</p>
            <p className="text-xs text-muted-foreground">Deterministic AI score</p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/jobs/${job.id}/apply`} className={buttonVariants({ variant: "gradient" })}>
          <Check aria-hidden />
          Apply now
        </Link>
        <SaveJobButton jobId={job.id} variant="button" />
        <Link href={`/jobs/${job.id}`} className={buttonVariants({ variant: "outline" })}>
          <ExternalLink aria-hidden />
          View job
        </Link>
      </div>

      <section aria-label="Why this was recommended" className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden />
          Why this was recommended
        </h3>
        <MatchBreakdown match={match} />
      </section>

      <section aria-label="Job requirements" className="space-y-3">
        <h3 className="text-sm font-semibold">Requirements at a glance</h3>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Experience</dt>
            <dd className="font-medium">{job.experience} level</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Employment</dt>
            <dd className="font-medium">{job.type}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Apply by</dt>
            <dd className="font-medium">{formatDate(job.deadline)}</dd>
          </div>
        </dl>
        <SkillTagList skills={job.skills} highlight={match.matchingSkills} missing={match.missingSkills} size="md" />
        {job.qualifications.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {job.qualifications.slice(0, 4).map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        )}
      </section>

      <CoverLetterPanel key={job.id} candidateId={candidateId} jobId={job.id} canApply />
    </article>
  );
}
