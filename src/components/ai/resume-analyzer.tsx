"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, FileText, Loader2, RefreshCw, ScanSearch, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { nowIso } from "@/lib/clock";
import { formatDate, formatRelative } from "@/lib/format";
import { profileCompletion } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { analyzeResume } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useHydrated } from "@/store/hooks";
import type { ResumeAnalysis } from "@/types";
import { AIDisclaimer } from "./ai-disclaimer";
import { ResumeAnalysisView } from "./resume-analysis-view";

const STEPS = ["Parsing your resume", "Scoring against Web3 hiring signals", "Writing suggestions"] as const;
const STEP_MS = 520;

function AnalysisProgress({ step }: { step: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-5 rounded-xl border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ScanSearch className="size-5 motion-safe:animate-pulse" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold">Analysing your resume…</p>
          <p className="text-xs text-muted-foreground">This only takes a moment.</p>
        </div>
      </div>
      <Progress value={Math.min(100, ((step + 1) / STEPS.length) * 100)} aria-label="Analysis progress" />
      <ol className="space-y-2.5">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className={cn("flex items-center gap-2.5 text-sm", done || active ? "text-foreground" : "text-muted-foreground")}>
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full",
                  done ? "bg-success/20 text-success" : active ? "bg-primary/15 text-primary" : "bg-muted",
                )}
              >
                {done ? <Check className="size-3" aria-hidden /> : active ? <Loader2 className="size-3 animate-spin" aria-hidden /> : null}
              </span>
              {label}
              {done && <span className="sr-only"> — done</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Full resume-analysis workspace for the current candidate (used by /resume-analysis). */
export function ResumeAnalyzer() {
  const hydrated = useHydrated();
  const candidate = useCurrentCandidate();
  const seeded = useAppStore((s) => s.resumeAnalyses);
  const history = useAppStore((s) => s.aiHistory);

  const [result, setResult] = useState<{ analysis: ResumeAnalysis; at: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (stepTimer.current) clearInterval(stepTimer.current);
    },
    [],
  );

  const lastSeeded = useMemo(() => (candidate ? (seeded.find((r) => r.candidateId === candidate.id) ?? null) : null), [seeded, candidate]);
  const analyses = useMemo(
    () => history.filter((h) => h.role === "seeker" && h.type === "resume_analysis").sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [history],
  );
  const completion = useMemo(() => (candidate ? profileCompletion(candidate) : null), [candidate]);

  async function run() {
    if (!candidate || running) return;
    setRunning(true);
    setStep(0);
    if (stepTimer.current) clearInterval(stepTimer.current);
    stepTimer.current = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    try {
      const analysis = await analyzeResume(candidate.id);
      setResult({ analysis, at: nowIso() });
      toast.success(`Resume analysed — score ${analysis.score}/100`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not analyse your resume");
    } finally {
      if (stepTimer.current) clearInterval(stepTimer.current);
      stepTimer.current = null;
      setRunning(false);
    }
  }

  if (!hydrated) return <LoadingSkeleton variant="detail" />;
  if (!candidate) {
    return (
      <EmptyState
        icon={FileText}
        title="No candidate profile"
        description="Sign in as a job seeker to analyse your resume."
        action={<Link href="/login" className={buttonVariants({ variant: "outline" })}>Go to sign in</Link>}
      />
    );
  }

  const shown = result?.analysis ?? lastSeeded;
  const shownLabel = result ? `Analysed ${formatRelative(result.at)}` : lastSeeded ? "Last analysis" : null;

  return (
    <div className="space-y-6">
      <AIDisclaimer>Scores come from a deterministic demo model that reads your profile — no file is uploaded or sent anywhere.</AIDisclaimer>

      {/* resume header */}
      <section aria-label="Current resume" className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500/20 to-violet-500/20 text-primary ring-1 ring-primary/20 ring-inset">
          <FileText className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {candidate.resume ? (
            <>
              <p className="truncate text-sm font-semibold">{candidate.resume.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {candidate.resume.sizeKb} KB · uploaded {formatDate(candidate.resume.uploadedAt)}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">No resume uploaded yet</p>
              <p className="text-xs text-muted-foreground">You can still analyse your profile now, but an uploaded resume gives recruiters more to work with.</p>
            </>
          )}
          {completion && (
            <p className="mt-1 text-xs text-muted-foreground">
              Profile completeness: <span className="font-semibold text-foreground">{completion.percent}%</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!candidate.resume && (
            <Link href="/profile" className={buttonVariants({ variant: "outline" })}>
              <Upload aria-hidden />
              Upload resume
            </Link>
          )}
          <Button type="button" variant="gradient" onClick={() => void run()} disabled={running}>
            {running ? <Loader2 className="animate-spin" aria-hidden /> : shown ? <RefreshCw aria-hidden /> : <Sparkles aria-hidden />}
            {running ? "Analysing…" : shown ? "Re-run analysis" : "Analyze my resume"}
          </Button>
        </div>
      </section>

      {running ? (
        <AnalysisProgress step={step} />
      ) : shown ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">Analysis results</h2>
            {shownLabel && <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{shownLabel}</span>}
          </div>
          <ResumeAnalysisView analysis={shown} />
        </div>
      ) : (
        <EmptyState
          icon={ScanSearch}
          title="You haven't analysed your resume yet"
          description="Get an overall score, strengths, missing information and formatting tips tailored to Web3 hiring managers."
          action={
            <Button type="button" variant="gradient" onClick={() => void run()}>
              <Sparkles aria-hidden />
              Analyze my resume
            </Button>
          }
        />
      )}

      {/* next steps */}
      <section aria-label="Next steps" className="grid gap-4 sm:grid-cols-2">
        <Link href="/profile" className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
          <p className="text-sm font-semibold">Fix the gaps in your profile</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {completion && completion.missing.length > 0 ? `Still missing: ${completion.missing.slice(0, 3).join(", ")}.` : "Keep your experience and projects up to date."}
          </p>
          <span className="mt-2 inline-block text-xs font-medium text-primary group-hover:underline">Edit profile →</span>
        </Link>
        <Link href="/ai-assistant?tab=chat" className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
          <p className="text-sm font-semibold">Talk it through with the assistant</p>
          <p className="mt-1 text-xs text-muted-foreground">Ask how to improve your CV, prepare for interviews or find better-matching roles.</p>
          <span className="mt-2 inline-block text-xs font-medium text-primary group-hover:underline">Open AI assistant →</span>
        </Link>
      </section>

      {/* history */}
      <section aria-labelledby="analysis-history-heading" className="rounded-xl border bg-card">
        <h2 id="analysis-history-heading" className="border-b px-4 py-3 text-sm font-semibold">
          Analysis history
        </h2>
        {analyses.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Previous analyses will be listed here.</p>
        ) : (
          <ol className="divide-y">
            {analyses.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-start gap-3 p-4">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning">
                  <ScanSearch className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="line-clamp-2 text-xs text-pretty text-muted-foreground">{a.summary}</p>
                </div>
                <time dateTime={a.createdAt} className="shrink-0 text-[11px] whitespace-nowrap text-muted-foreground">
                  {formatRelative(a.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
