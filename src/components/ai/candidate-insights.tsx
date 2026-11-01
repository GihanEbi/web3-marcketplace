"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Scale, ShieldCheck, Sparkles, UserRoundCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AIMatchScore, scoreTone } from "@/components/shared/ai-match-score";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SelectField } from "@/components/shared/select-field";
import { SkillTag } from "@/components/shared/skill-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { compareCandidates, summarizeCandidate, updateApplicationStatus, type CandidateComparison } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useMyApplications } from "@/store/hooks";
import type { Application } from "@/types";

const MIN_COMPARE = 2;
const MAX_COMPARE = 4;
function scoreBarClass(score: number): string {
  if (score >= 85) return "bg-success";
  if (score >= 72) return "bg-primary";
  if (score >= 58) return "bg-warning";
  return "bg-destructive";
}

const SHORTLISTABLE = new Set(["applied", "under_review"]);

interface ShortlistTarget {
  applicationId: string;
  name: string;
  jobTitle: string;
}

export function CandidateInsights() {
  const applications = useMyApplications();
  const candidates = useAppStore((s) => s.candidates);
  const jobs = useAppStore((s) => s.jobs);

  const [summaryAppId, setSummaryAppId] = useState("");
  const [summary, setSummary] = useState<{ applicationId: string; text: string } | null>(null);
  const [summarising, setSummarising] = useState(false);

  const [jobFilter, setJobFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState<CandidateComparison | null>(null);
  const [comparing, setComparing] = useState(false);

  const [target, setTarget] = useState<ShortlistTarget | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rows = useMemo(
    () =>
      [...applications]
        .filter((a) => a.status !== "withdrawn")
        .sort((a, b) => b.matchScore - a.matchScore || a.id.localeCompare(b.id))
        .map((app) => ({
          app,
          candidate: candidates.find((c) => c.id === app.candidateId),
          job: jobs.find((j) => j.id === app.jobId),
        })),
    [applications, candidates, jobs],
  );

  const jobOptions = useMemo(() => {
    const ids = Array.from(new Set(rows.map((r) => r.app.jobId)));
    return [
      { value: "", label: "All jobs" },
      ...ids.map((id) => ({ value: id, label: jobs.find((j) => j.id === id)?.title ?? "Role" })),
    ];
  }, [rows, jobs]);

  const visibleRows = useMemo(() => (jobFilter ? rows.filter((r) => r.app.jobId === jobFilter) : rows), [rows, jobFilter]);
  const appOptions = useMemo(
    () => [
      { value: "", label: "Choose an application…" },
      ...rows.map((r) => ({ value: r.app.id, label: `${r.candidate?.name ?? "Candidate"} — ${r.job?.title ?? "Role"} (${r.app.matchScore}%)` })),
    ],
    [rows],
  );

  const summaryApp = summary ? rows.find((r) => r.app.id === summary.applicationId) : undefined;

  async function runSummary() {
    if (!summaryAppId || summarising) return;
    setSummarising(true);
    try {
      const text = await summarizeCandidate(summaryAppId);
      setSummary({ applicationId: summaryAppId, text });
      toast.success("Suitability summary ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not summarise this candidate");
    } finally {
      setSummarising(false);
    }
  }

  function toggle(id: string, on: boolean) {
    setSelected((prev) => (on ? (prev.includes(id) || prev.length >= MAX_COMPARE ? prev : [...prev, id]) : prev.filter((x) => x !== id)));
  }

  async function runCompare() {
    if (selected.length < MIN_COMPARE || comparing) return;
    setComparing(true);
    try {
      setComparison(await compareCandidates(selected));
      toast.success(`Compared ${selected.length} candidates`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not compare candidates");
    } finally {
      setComparing(false);
    }
  }

  function askShortlist(app: Application) {
    const row = rows.find((r) => r.app.id === app.id);
    setTarget({ applicationId: app.id, name: row?.candidate?.name ?? "this candidate", jobTitle: row?.job?.title ?? "the role" });
    setConfirmOpen(true);
  }

  async function confirmShortlist() {
    if (!target) return;
    try {
      await updateApplicationStatus(target.applicationId, "shortlisted", "Shortlisted by the recruiter after reviewing an AI suggestion");
      toast.success(`${target.name} was shortlisted for ${target.jobTitle}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the application");
    }
  }

  function shortlistAction(applicationId: string) {
    const row = rows.find((r) => r.app.id === applicationId);
    if (!row) return null;
    const { app } = row;
    if (!SHORTLISTABLE.has(app.status)) {
      return (
        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge status={app.status} context="ats" size="sm" />
          <span className="text-[11px] text-muted-foreground">{app.status === "shortlisted" ? "Already shortlisted" : "No shortlist action available"}</span>
        </div>
      );
    }
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => askShortlist(app)}>
        <UserRoundCheck aria-hidden />
        Shortlist (requires your approval)
      </Button>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={UsersRound}
        title="No applications to analyse yet"
        description="Once candidates apply to your jobs, the AI can summarise their suitability and compare them side by side."
        action={
          <Link href="/employer/jobs" className={buttonVariants({ variant: "outline" })}>
            View my jobs
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-3.5 py-2.5 text-xs text-pretty">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          <span className="font-semibold">You stay in control.</span> The AI only suggests. Moving a candidate forward always needs your explicit confirmation, and statuses never change automatically.
        </p>
      </div>

      {/* ---------------- suitability ---------------- */}
      <section aria-labelledby="suit-heading" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div>
          <h3 id="suit-heading" className="text-sm font-semibold">
            Candidate suitability summary
          </h3>
          <p className="text-xs text-muted-foreground">Pick an application to get a plain-language summary of fit, gaps and a suggested next step.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="suit-app">Application</Label>
            <SelectField id="suit-app" value={summaryAppId} onChange={setSummaryAppId} options={appOptions} />
          </div>
          <Button type="button" variant="gradient" onClick={() => void runSummary()} disabled={!summaryAppId || summarising}>
            {summarising ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {summarising ? "Analysing…" : "Generate suitability summary"}
          </Button>
        </div>

        {summarising && (
          <p role="status" className="text-sm text-muted-foreground">
            Reading the profile and comparing it with the job requirements…
          </p>
        )}

        {summary && summaryApp && !summarising && (
          <div className="space-y-3 rounded-xl border border-primary/20 bg-linear-to-br from-indigo-500/10 to-violet-500/10 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <AIMatchScore score={summaryApp.app.matchScore} size="md" showLabel />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{summaryApp.candidate?.name ?? "Candidate"}</p>
                <p className="truncate text-xs text-muted-foreground">{summaryApp.job?.title ?? "Role"}</p>
              </div>
              <StatusBadge status={summaryApp.app.status} context="ats" />
            </div>
            <p className="text-sm leading-relaxed text-pretty">{summary.text}</p>
            <div className="flex flex-wrap items-center gap-2">
              {shortlistAction(summary.applicationId)}
              <Link
                href={`/employer/jobs/${summaryApp.app.jobId}/applicants?app=${summaryApp.app.id}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Open in applicant tracker
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ---------------- comparison ---------------- */}
      <section aria-labelledby="cmp-heading" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="cmp-heading" className="text-sm font-semibold">
              Compare candidates
            </h3>
            <p className="text-xs text-muted-foreground">
              Select {MIN_COMPARE}–{MAX_COMPARE} applications to see them side by side.
            </p>
          </div>
          <div className="w-full space-y-1.5 sm:w-64">
            <Label htmlFor="cmp-job">Filter by job</Label>
            <SelectField id="cmp-job" value={jobFilter} onChange={setJobFilter} options={jobOptions} />
          </div>
        </div>

        <fieldset className="space-y-1">
          <legend className="sr-only">Applications to compare</legend>
          <ul className="grid max-h-72 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 scrollbar-thin">
            {visibleRows.map(({ app, candidate, job }) => {
              const checked = selected.includes(app.id);
              const disabled = !checked && selected.length >= MAX_COMPARE;
              return (
                <li key={app.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors",
                      checked ? "border-primary/50 bg-primary/10" : "hover:bg-muted/50",
                      disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <Checkbox checked={checked} disabled={disabled} onCheckedChange={(v) => toggle(app.id, Boolean(v))} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{candidate?.name ?? "Candidate"}</span>
                      <span className="block truncate text-xs text-muted-foreground">{job?.title ?? "Role"}</span>
                    </span>
                    <StatusBadge status={app.status} context="ats" size="sm" />
                    <span className="w-8 text-right text-xs font-semibold tabular-nums">{app.matchScore}%</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="gradient" onClick={() => void runCompare()} disabled={selected.length < MIN_COMPARE || comparing}>
            {comparing ? <Loader2 className="animate-spin" aria-hidden /> : <Scale aria-hidden />}
            {comparing ? "Comparing…" : "Compare candidates"}
          </Button>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {selected.length} selected{selected.length < MIN_COMPARE ? ` · pick at least ${MIN_COMPARE}` : selected.length >= MAX_COMPARE ? " · maximum reached" : ""}
          </span>
          {selected.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>
              Clear selection
            </Button>
          )}
        </div>

        {comparing && (
          <p role="status" className="text-sm text-muted-foreground">
            Scoring candidates against each job&apos;s requirements…
          </p>
        )}

        {comparison && !comparing && (
          <div className="space-y-4">
            {comparison.rows.length > 0 && (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[40rem] border-collapse text-sm">
                  <caption className="sr-only">Side-by-side candidate comparison</caption>
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th scope="col" className="w-32 p-3 text-left text-xs font-medium text-muted-foreground">
                        Candidate
                      </th>
                      {comparison.rows.map((r) => {
                        const row = rows.find((x) => x.app.id === r.applicationId);
                        return (
                          <th key={r.applicationId} scope="col" className="p-3 text-left align-top">
                            <p className="font-semibold">{r.candidateName}</p>
                            <p className="text-xs font-normal text-muted-foreground">{row?.job?.title ?? "Role"}</p>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <th scope="row" className="p-3 text-left text-xs font-medium text-muted-foreground">
                        Match score
                      </th>
                      {comparison.rows.map((r) => (
                        <td key={r.applicationId} className="p-3 align-top">
                          <div className="flex items-center gap-2">
                            <div
                              role="progressbar"
                              aria-valuenow={r.score}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${r.candidateName} match score`}
                              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                            >
                              <div className={cn("h-full rounded-full", scoreBarClass(r.score))} style={{ width: `${r.score}%` }} />
                            </div>
                            <span className={cn("w-10 text-right text-sm font-semibold tabular-nums", scoreTone(r.score).text)}>{r.score}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="p-3 text-left text-xs font-medium text-muted-foreground">
                        Strengths
                      </th>
                      {comparison.rows.map((r) => (
                        <td key={r.applicationId} className="p-3 align-top">
                          {r.strengths.length ? (
                            <ul className="flex flex-wrap gap-1">
                              {r.strengths.map((s) => (
                                <li key={s}>
                                  <SkillTag skill={s} variant="match" size="sm" />
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-muted-foreground">No matching skills</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="p-3 text-left text-xs font-medium text-muted-foreground">
                        Gaps
                      </th>
                      {comparison.rows.map((r) => (
                        <td key={r.applicationId} className="p-3 align-top">
                          {r.gaps.length ? (
                            <ul className="flex flex-wrap gap-1">
                              {r.gaps.map((s) => (
                                <li key={s}>
                                  <SkillTag skill={s} variant="missing" size="sm" />
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-muted-foreground">No gaps found</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="p-3 text-left text-xs font-medium text-muted-foreground">
                        AI verdict
                      </th>
                      {comparison.rows.map((r) => (
                        <td key={r.applicationId} className="p-3 align-top">
                          <span
                            className={cn(
                              "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ring-1 ring-inset",
                              r.score >= 80 ? "bg-success/15 text-success ring-success/30" : r.score >= 62 ? "bg-primary/15 text-primary ring-primary/30" : "bg-destructive/15 text-destructive ring-destructive/30",
                            )}
                          >
                            {r.verdict}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="p-3 text-left text-xs font-medium text-muted-foreground">
                        Your decision
                      </th>
                      {comparison.rows.map((r) => (
                        <td key={r.applicationId} className="p-3 align-top">
                          {shortlistAction(r.applicationId)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-linear-to-br from-indigo-500/10 to-violet-500/10 p-4">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <p className="text-sm leading-relaxed text-pretty">{comparison.recommendation}</p>
            </div>
          </div>
        )}
      </section>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Shortlist ${target?.name ?? "this candidate"}?`}
        description={
          <>
            The AI only <strong>suggested</strong> this — it has not changed anything. If you confirm, <strong>{target?.name}</strong> will be moved to
            “Shortlisted” for <strong>{target?.jobTitle}</strong> and notified of the status change. The decision is yours.
          </>
        }
        confirmLabel="Yes, shortlist"
        onConfirm={confirmShortlist}
      />
    </div>
  );
}
