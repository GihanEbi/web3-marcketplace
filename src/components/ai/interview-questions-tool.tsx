"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ListChecks, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { SelectField } from "@/components/shared/select-field";
import { EXPERIENCE_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { suggestInterviewQuestions } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentCompany } from "@/store/hooks";
import type { ExperienceLevel } from "@/types";
import { SkillsInput } from "./skills-input";

const CUSTOM = "__custom__";

export function InterviewQuestionsTool() {
  const company = useCurrentCompany();
  const jobs = useAppStore((s) => s.jobs);
  const companyJobs = useMemo(() => (company ? jobs.filter((j) => j.companyId === company.id) : []), [jobs, company]);

  const [source, setSource] = useState(companyJobs[0]?.id ?? CUSTOM);
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [level, setLevel] = useState<ExperienceLevel>("Senior");
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; questions: string[] } | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const job = companyJobs.find((j) => j.id === source);
  const custom = source === CUSTOM || !job;

  async function generate() {
    const input = custom
      ? { jobTitle: role.trim(), skills, level }
      : { jobTitle: job.title, skills: job.skills, level: job.experience };
    if (custom && input.jobTitle.length < 3) {
      setRoleError("Enter the role you are hiring for (at least 3 characters).");
      return;
    }
    setRoleError(null);
    setLoading(true);
    try {
      const questions = await suggestInterviewQuestions(input);
      setResult({ title: input.jobTitle, questions });
      setPicked(new Set(questions.map((_, i) => i)));
      toast.success(`${questions.length} interview questions ready`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate interview questions");
    } finally {
      setLoading(false);
    }
  }

  function toggle(index: number, on: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  async function copySelected() {
    if (!result) return;
    const text = result.questions
      .filter((_, i) => picked.has(i))
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(`Interview questions — ${result.title}\n\n${text}`);
      setCopied(true);
      toast.success(`${picked.size} question${picked.size === 1 ? "" : "s"} copied`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  }

  const sourceOptions = [...companyJobs.map((j) => ({ value: j.id, label: j.title })), { value: CUSTOM, label: "Custom role…" }];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_1fr]">
      <form
        className="h-fit space-y-4 rounded-xl border bg-card p-4 sm:p-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
        aria-label="Interview question inputs"
      >
        <div>
          <h3 className="text-sm font-semibold">Which role are you interviewing for?</h3>
          <p className="text-xs text-muted-foreground">Use one of your jobs or describe a custom role.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iq-source">Job</Label>
          <SelectField id="iq-source" value={custom ? CUSTOM : source} onChange={setSource} options={sourceOptions} />
        </div>

        {custom ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="iq-role">Role title</Label>
              <Input id="iq-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Smart Contract Auditor" aria-invalid={!!roleError} />
              {roleError && <p className="text-xs text-destructive">{roleError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iq-level">Seniority</Label>
              <SelectField id="iq-level" value={level} onChange={(v) => setLevel(v as ExperienceLevel)} options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: l }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iq-skills">Key skills</Label>
              <SkillsInput id="iq-skills" value={skills} onChange={setSkills} max={6} />
            </div>
          </>
        ) : (
          job && (
            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Based on <span className="font-medium text-foreground">{job.title}</span> · {job.experience} · {job.skills.slice(0, 4).join(", ")}
            </p>
          )
        )}

        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {loading ? "Generating…" : result ? "Regenerate questions" : "Suggest interview questions"}
        </Button>
      </form>

      <section aria-label="Suggested interview questions" className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3" role="status" aria-live="polite">
            <p className="text-sm text-muted-foreground">Preparing role-specific questions…</p>
            {[96, 84, 92, 70, 88, 78].map((w, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">Questions for {result.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {picked.size} of {result.questions.length} selected
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setPicked(picked.size === result.questions.length ? new Set() : new Set(result.questions.map((_, i) => i)))}>
                  {picked.size === result.questions.length ? "Select none" : "Select all"}
                </Button>
                <Button type="button" variant="outline" onClick={() => void copySelected()} disabled={picked.size === 0}>
                  {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                  {copied ? "Copied" : "Copy selected"}
                </Button>
              </div>
            </div>
            <ol className="space-y-2">
              {result.questions.map((q, i) => (
                <li key={q}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      picked.has(i) ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50",
                    )}
                  >
                    <Checkbox className="mt-0.5" checked={picked.has(i)} onCheckedChange={(v) => toggle(i, Boolean(v))} />
                    <span className="min-w-0 flex-1 text-sm text-pretty">
                      <span className="mr-1.5 font-semibold text-primary">{i + 1}.</span>
                      {q}
                    </span>
                  </label>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <EmptyState
            icon={ListChecks}
            title="Your question set will appear here"
            description="Choose a role and let the AI draft a balanced mix of technical, security and behavioural questions."
            className="border-none bg-transparent"
          />
        )}
      </section>
    </div>
  );
}
