"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Copy, FilePenLine, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { SelectField } from "@/components/shared/select-field";
import { BLOCKCHAINS, EXPERIENCE_LEVELS, JOB_CATEGORIES, WORK_MODES } from "@/lib/constants";
import { generateJobDescription } from "@/services";
import { useCurrentCompany } from "@/store/hooks";
import type { ExperienceLevel } from "@/types";
import { SkillsInput } from "./skills-input";

/** sessionStorage key for a draft job started from the AI assistant */
export const JOB_DRAFT_KEY = "chainhire-job-draft";

const schema = z.object({
  title: z.string().trim().min(3, "Enter a job title (at least 3 characters)").max(80, "Keep the title under 80 characters"),
  category: z.string().min(1, "Choose a category"),
  experience: z.enum(["Entry", "Mid", "Senior", "Lead"]),
  workMode: z.enum(["Remote", "Hybrid", "Onsite"]),
  blockchain: z.string(),
  skills: z.array(z.string()).min(1, "Add at least one skill"),
});
type FormValues = z.infer<typeof schema>;

interface Draft {
  description: string;
  responsibilities: string;
  qualifications: string;
  benefits: string;
}

const lines = (text: string) => text.split("\n").map((l) => l.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);

function draftToText(title: string, d: Draft): string {
  const list = (t: string) => lines(t).map((l) => `• ${l}`).join("\n");
  return `${title}\n\n${d.description.trim()}\n\nResponsibilities\n${list(d.responsibilities)}\n\nQualifications\n${list(d.qualifications)}\n\nBenefits\n${list(d.benefits)}`;
}

function DraftField({ id, label, value, onChange, rows, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; rows: number; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="min-h-24 resize-y" />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function JobDescriptionGenerator() {
  const router = useRouter();
  const company = useCurrentCompany();
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [meta, setMeta] = useState<Pick<FormValues, "category" | "experience" | "workMode" | "blockchain" | "skills"> | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", category: "Smart Contracts", experience: "Senior", workMode: "Remote", blockchain: "", skills: [] },
  });

  async function onSubmit(values: FormValues) {
    setGenerating(true);
    try {
      const out = await generateJobDescription({
        title: values.title,
        category: values.category,
        experience: values.experience as ExperienceLevel,
        skills: values.skills,
        companyName: company?.name,
        workMode: values.workMode,
        blockchain: values.blockchain || undefined,
      });
      setDraft({
        description: out.description,
        responsibilities: out.responsibilities.join("\n"),
        qualifications: out.qualifications.join("\n"),
        benefits: out.benefits.join("\n"),
      });
      setDraftTitle(values.title);
      setMeta({ category: values.category, experience: values.experience, workMode: values.workMode, blockchain: values.blockchain, skills: values.skills });
      toast.success("Job description drafted — review and edit it before using it");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate the job description");
    } finally {
      setGenerating(false);
    }
  }

  async function copyAll() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draftToText(draftTitle, draft));
      setCopied(true);
      toast.success("Job description copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  }

  function createJob() {
    if (!draft || !meta) return;
    try {
      window.sessionStorage.setItem(
        JOB_DRAFT_KEY,
        JSON.stringify({
          title: draftTitle,
          ...meta,
          description: draft.description.trim(),
          responsibilities: lines(draft.responsibilities),
          qualifications: lines(draft.qualifications),
          benefits: lines(draft.benefits),
        }),
      );
    } catch {
      /* storage unavailable – the draft can still be copied */
    }
    toast.success("Draft saved — opening the job form. You can also paste the copied text.");
    router.push("/employer/jobs/create");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="h-fit space-y-4 rounded-xl border bg-card p-4 sm:p-5" aria-label="Job description inputs">
        <div>
          <h3 className="text-sm font-semibold">Describe the role</h3>
          <p className="text-xs text-muted-foreground">The AI drafts a description using these details{company ? ` and ${company.name}'s name` : ""}.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jd-title">Job title</Label>
          <Input id="jd-title" placeholder="e.g. Senior Solidity Developer" aria-invalid={!!errors.title} {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="jd-category">Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <SelectField id="jd-category" value={field.value} onChange={field.onChange} options={JOB_CATEGORIES.map((c) => ({ value: c, label: c }))} aria-invalid={!!errors.category} />
              )}
            />
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jd-experience">Experience level</Label>
            <Controller
              control={control}
              name="experience"
              render={({ field }) => (
                <SelectField id="jd-experience" value={field.value} onChange={field.onChange} options={EXPERIENCE_LEVELS.map((c) => ({ value: c, label: c }))} />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jd-mode">Work mode</Label>
            <Controller
              control={control}
              name="workMode"
              render={({ field }) => <SelectField id="jd-mode" value={field.value} onChange={field.onChange} options={WORK_MODES.map((c) => ({ value: c, label: c }))} />}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jd-chain">Blockchain</Label>
            <Controller
              control={control}
              name="blockchain"
              render={({ field }) => (
                <SelectField
                  id="jd-chain"
                  value={field.value}
                  onChange={field.onChange}
                  options={[{ value: "", label: "Any / not specific" }, ...BLOCKCHAINS.map((c) => ({ value: c, label: c }))]}
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jd-skills">Key skills</Label>
          <Controller
            control={control}
            name="skills"
            render={({ field }) => <SkillsInput id="jd-skills" value={field.value} onChange={field.onChange} invalid={!!errors.skills} />}
          />
          {errors.skills && <p className="text-xs text-destructive">{errors.skills.message}</p>}
        </div>

        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={generating}>
          {generating ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {generating ? "Drafting…" : draft ? "Regenerate draft" : "Generate job description"}
        </Button>
      </form>

      <section aria-label="Generated job description" className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
        {generating ? (
          <div className="space-y-3" role="status" aria-live="polite">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary motion-safe:animate-pulse" aria-hidden />
              Drafting your job description…
            </p>
            {[100, 94, 88, 100, 60, 96, 90, 72].map((w, i) => (
              <Skeleton key={i} className="h-3.5" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : draft ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold">{draftTitle}</h3>
                <p className="text-xs text-muted-foreground">Everything below is editable. Nothing is published until you create and submit the job yourself.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={() => void copyAll()}>
                  {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button type="button" variant="gradient" onClick={createJob}>
                  <Plus aria-hidden />
                  Create job from this draft
                </Button>
              </div>
            </div>
            <DraftField id="jd-out-description" label="Description" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} rows={6} />
            <DraftField id="jd-out-resp" label="Responsibilities" value={draft.responsibilities} onChange={(v) => setDraft({ ...draft, responsibilities: v })} rows={6} hint="One item per line." />
            <DraftField id="jd-out-qual" label="Qualifications" value={draft.qualifications} onChange={(v) => setDraft({ ...draft, qualifications: v })} rows={5} hint="One item per line." />
            <DraftField id="jd-out-benefits" label="Benefits" value={draft.benefits} onChange={(v) => setDraft({ ...draft, benefits: v })} rows={5} hint="One item per line." />
          </div>
        ) : (
          <EmptyState
            icon={FilePenLine}
            title="Your draft will appear here"
            description="Fill in the role details and generate a first draft you can edit, copy or turn into a job posting."
            className="border-none bg-transparent"
          />
        )}
      </section>
    </div>
  );
}
