"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { Check, Copy, FileText, Loader2, RefreshCw, Send, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AIMatchScore } from "@/components/shared/ai-match-score";
import { CompanyLogo } from "@/components/shared/company-logo";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { SkillTagList } from "@/components/shared/skill-tag";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatJobSalary } from "@/lib/format";
import { getPublicJobs } from "@/lib/job-filters";
import { computeMatch } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { generateCoverLetter, type CoverLetterTone } from "@/services";
import { useAppStore } from "@/store/app-store";
import type { Candidate, Job } from "@/types";
import { countWords } from "./ai-meta";

export const COVER_LETTER_DRAFT_KEY = "chainhire-cover-letter-draft";

const TONES: { value: CoverLetterTone; label: string; hint: string }[] = [
  { value: "professional", label: "Professional", hint: "Polished and formal" },
  { value: "enthusiastic", label: "Enthusiastic", hint: "Warm and energetic" },
  { value: "concise", label: "Concise", hint: "Short and direct" },
];

interface GeneratedMeta {
  jobId: string;
  tone: CoverLetterTone;
  variant: number;
}

interface CoverLetterGeneratorProps {
  candidate: Candidate;
  /** job preselected from `?job=` */
  initialJobId?: string | null;
}

export function CoverLetterGenerator({ candidate, initialJobId }: CoverLetterGeneratorProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);

  const [jobId, setJobId] = useState(initialJobId ?? "");
  const [query, setQuery] = useState("");
  const [tone, setTone] = useState<CoverLetterTone>("professional");
  const [phase, setPhase] = useState<"idle" | "generating" | "revealing" | "ready">("idle");
  const [text, setText] = useState("");
  const [original, setOriginal] = useState("");
  const [meta, setMeta] = useState<GeneratedMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  // public jobs ranked by how well they match this candidate (deterministic), plus the preselected job if it isn't public
  const options = useMemo(() => {
    const pub = getPublicJobs(jobs, companies);
    const extra = initialJobId && !pub.some((j) => j.id === initialJobId) ? jobs.filter((j) => j.id === initialJobId) : [];
    return [...pub, ...extra]
      .map((job) => ({ job, score: computeMatch(candidate, job).score, company: companies.find((c) => c.id === job.companyId) }))
      .sort((a, b) => b.score - a.score || a.job.id.localeCompare(b.job.id));
  }, [jobs, companies, candidate, initialJobId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(({ job, company }) => `${job.title} ${company?.name ?? ""} ${job.category} ${job.skills.join(" ")}`.toLowerCase().includes(q));
  }, [options, query]);

  const selected = useMemo(() => options.find((o) => o.job.id === jobId) ?? null, [options, jobId]);
  const match = useMemo(() => (selected ? computeMatch(candidate, selected.job) : null), [selected, candidate]);
  const letterJob: Job | undefined = useMemo(() => (meta ? jobs.find((j) => j.id === meta.jobId) : undefined), [jobs, meta]);

  const busy = phase === "generating" || phase === "revealing";
  const dirty = phase === "ready" && text !== original;
  const stale = phase === "ready" && meta !== null && (meta.jobId !== jobId || meta.tone !== tone);
  const words = countWords(text);

  const topSkills = useMemo(() => {
    const matching = match?.matchingSkills ?? [];
    return [...matching, ...candidate.skills.filter((s) => !matching.some((m) => m.toLowerCase() === s.toLowerCase()))].slice(0, 6);
  }, [match, candidate.skills]);

  function reveal(letter: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    setOriginal(letter);
    if (reduceMotion) {
      setText(letter);
      setPhase("ready");
      return;
    }
    const step = Math.max(8, Math.ceil(letter.length / 45));
    let shown = 0;
    setText("");
    setPhase("revealing");
    timerRef.current = setInterval(() => {
      shown = Math.min(letter.length, shown + step);
      setText(letter.slice(0, shown));
      if (shown >= letter.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setPhase("ready");
      }
    }, 28);
  }

  async function generate(variant: number) {
    if (!selected || busy) return;
    const previous = phase;
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("generating");
    setError(null);
    try {
      const letter = await generateCoverLetter(candidate.id, selected.job.id, { tone, variant });
      setMeta({ jobId: selected.job.id, tone, variant });
      reveal(letter);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not generate the cover letter";
      setError(message);
      setPhase(previous);
      toast.error(message);
    }
  }

  function regenerate() {
    if (dirty) setConfirmRegenerate(true);
    else void generate((meta?.variant ?? 0) + 1);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Cover letter copied to clipboard");
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — select the text and copy it manually");
    }
  }

  function stashDraft() {
    if (!meta) return;
    try {
      window.sessionStorage.setItem(COVER_LETTER_DRAFT_KEY, JSON.stringify({ jobId: meta.jobId, text }));
    } catch {
      /* ignore – the user can still paste from the clipboard */
    }
    toast.success("Cover letter carried over to your application");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_1fr]">
      {/* ------------------------------ setup ------------------------------ */}
      <div className="space-y-5">
        <section aria-labelledby="cl-job-heading" className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 id="cl-job-heading" className="text-sm font-semibold">
              1. Choose a job
            </h3>
            <span className="text-xs text-muted-foreground">{options.length} open roles · best matches first</span>
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Search title, company or skill…" aria-label="Search jobs" />
          {options.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">There are no open jobs to write a cover letter for right now.</p>
          ) : filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No jobs match “{query}”.</p>
          ) : (
            <ul role="listbox" aria-label="Open jobs" className="max-h-64 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
              {filtered.map(({ job, company, score }) => {
                const active = job.id === jobId;
                return (
                  <li key={job.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => setJobId(job.id)}
                      disabled={busy}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60",
                        active ? "border-primary/60 bg-primary/10" : "border-transparent hover:bg-muted/60",
                      )}
                    >
                      {company ? <CompanyLogo company={company} size="sm" /> : <UserAvatar name="Company" size="sm" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{job.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {company?.name ?? "Company"} · {job.workMode}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-primary tabular-nums">{score}%</span>
                      {active && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {selected && match && (
          <section aria-label="Selected job summary" className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              {selected.company && <CompanyLogo company={selected.company} size="md" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{selected.job.title}</p>
                <p className="truncate text-xs text-muted-foreground">{selected.company?.name ?? "Company"}</p>
              </div>
              <Link href={`/jobs/${selected.job.id}`} className="shrink-0 text-xs font-medium text-primary hover:underline">
                View job
              </Link>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="font-medium">{selected.job.location}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Compensation</dt>
                <dd className="font-medium">{formatJobSalary(selected.job)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">
                  {selected.job.type} · {selected.job.experience}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Chain</dt>
                <dd className="font-medium">{selected.job.blockchain}</dd>
              </div>
            </dl>
            <SkillTagList skills={selected.job.skills} highlight={match.matchingSkills} missing={match.missingSkills} max={8} />
          </section>
        )}

        <section aria-labelledby="cl-tone-heading" className="space-y-3 rounded-xl border bg-card p-4">
          <h3 id="cl-tone-heading" className="text-sm font-semibold">
            2. Pick a tone
          </h3>
          <div role="radiogroup" aria-labelledby="cl-tone-heading" className="grid grid-cols-3 gap-2">
            {TONES.map((t) => {
              const active = tone === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={busy}
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60",
                    active ? "border-primary/60 bg-primary/10" : "hover:border-primary/30 hover:bg-muted/60",
                  )}
                >
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{t.hint}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Candidate details used" className="space-y-3 rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">Details the AI will use</h3>
          <div className="flex items-center gap-3">
            <UserAvatar name={candidate.name} src={candidate.avatar} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{candidate.name}</p>
              <p className="truncate text-xs text-muted-foreground">{candidate.headline}</p>
            </div>
            {match && <AIMatchScore score={match.score} size="md" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {candidate.yearsOfExperience} years of experience · {candidate.experienceLevel} level{match ? ` · ${match.score}% match with this role` : ""}
          </p>
          <SkillTagList skills={topSkills} highlight={match?.matchingSkills} />
          <p className="text-[11px] text-muted-foreground">
            Edit your <Link href="/profile" className="font-medium text-primary hover:underline">profile</Link> to change what the letter says about you.
          </p>
        </section>

        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={!selected || busy}
          onClick={() => void generate(0)}
        >
          {phase === "generating" ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {phase === "generating" ? "Writing your letter…" : meta ? "Generate again" : "Generate cover letter"}
        </Button>
        {!selected && <p className="-mt-2 text-center text-xs text-muted-foreground">Select a job to enable generation.</p>}
      </div>

      {/* ------------------------------ output ------------------------------ */}
      <section aria-label="Generated cover letter" className="min-w-0 rounded-xl border bg-card">
        {phase === "idle" && (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="Your cover letter will appear here"
              description="Choose a job and a tone, then press Generate. You can edit the result, copy it, or carry it into your application."
              className="border-none bg-transparent"
            />
            {error && (
              <p role="alert" className="mt-3 text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}

        {phase === "generating" && (
          <div className="space-y-4 p-6" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary motion-safe:animate-pulse" aria-hidden />
              Matching your profile to {selected?.job.title ?? "the role"} and drafting a {tone} letter…
            </div>
            {[100, 92, 96, 40, 100, 88, 94, 70, 36, 100, 82].map((w, i) => (
              <Skeleton key={i} className={cn("h-3.5", w === 40 || w === 36 ? "mt-5" : "")} style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {(phase === "revealing" || phase === "ready") && (
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">Your cover letter</h3>
                <p className="truncate text-xs text-muted-foreground">
                  {letterJob?.title ?? "Selected role"} · {meta?.tone} tone{meta && meta.variant > 0 ? ` · version ${meta.variant + 1}` : ""}
                </p>
              </div>
              <p className="text-xs text-muted-foreground tabular-nums" aria-live="off">
                {words} {words === 1 ? "word" : "words"} · {text.length} characters
              </p>
            </div>

            <div>
              <Label htmlFor="cover-letter-text" className="sr-only">
                Cover letter text (editable)
              </Label>
              <Textarea
                id="cover-letter-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                readOnly={phase === "revealing"}
                aria-busy={phase === "revealing"}
                rows={18}
                className="min-h-80 resize-y font-sans leading-relaxed"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {phase === "revealing" ? "Writing…" : dirty ? "You have edited this letter." : "Generated by a simulated AI — review and personalise before sending."}
              </p>
            </div>

            {stale && (
              <p role="status" className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs">
                This letter was written for <span className="font-semibold">{letterJob?.title ?? "another job"}</span> with a {meta?.tone} tone. Press Generate again to
                update it for your current selection.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => void copy()} disabled={phase === "revealing" || !text}>
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button type="button" variant="outline" onClick={regenerate} disabled={busy || !selected}>
                <RefreshCw aria-hidden />
                Regenerate
              </Button>
              {dirty && (
                <Button type="button" variant="ghost" onClick={() => setText(original)}>
                  <Undo2 aria-hidden />
                  Reset edits
                </Button>
              )}
              {meta && (
                <Link
                  href={`/jobs/${meta.jobId}/apply`}
                  onClick={stashDraft}
                  aria-disabled={phase === "revealing"}
                  className={cn(buttonVariants({ variant: "gradient" }), "sm:ml-auto", phase === "revealing" && "pointer-events-none opacity-50")}
                >
                  <Send aria-hidden />
                  Use in application
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      <ConfirmationDialog
        open={confirmRegenerate}
        onOpenChange={setConfirmRegenerate}
        title="Replace your edits?"
        description="Regenerating writes a new version of the letter and discards the changes you made to the current one."
        confirmLabel="Regenerate"
        onConfirm={() => generate((meta?.variant ?? 0) + 1)}
      />
    </div>
  );
}
