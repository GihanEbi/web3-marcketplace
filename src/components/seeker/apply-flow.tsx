"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarClock,
  Check,
  CircleCheck,
  FileUp,
  Loader2,
  MapPin,
  Paperclip,
  Pencil,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AIMatchScore } from "@/components/shared/ai-match-score";
import { CompanyLogo } from "@/components/shared/company-logo";
import { EmptyState, NotFoundState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SelectField } from "@/components/shared/select-field";
import { formatCurrency, formatDate, formatJobSalary } from "@/lib/format";
import { computeMatch } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { applyToJob, generateCoverLetter, type CoverLetterTone } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useHydrated } from "@/store/hooks";
import type { Application, Availability, Candidate, Company, Job } from "@/types";
import { applyBlockReason, coverDraftKey } from "./job-utils";

const AVAILABILITY_OPTIONS: Availability[] = ["Immediately", "2 weeks", "1 month", "Not looking"];

const TONES: { value: CoverLetterTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "concise", label: "Concise" },
];

const MAX_RESUME_KB = 5 * 1024;
const MIN_COVER_LETTER = 100;

const schema = z.object({
  resumeName: z.string().min(1, "Select or upload a resume to continue"),
  coverLetter: z.string().trim().min(MIN_COVER_LETTER, `Your cover letter needs at least ${MIN_COVER_LETTER} characters`),
  portfolioUrl: z.union([z.literal(""), z.url("Enter a valid URL, e.g. https://your-site.com")]),
  expectedSalary: z.number({ error: "Enter your expected salary" }).positive("Salary must be greater than 0"),
  availability: z.enum(["Immediately", "2 weeks", "1 month", "Not looking"]),
  answers: z.array(z.object({ answer: z.string().trim().min(1, "Please answer this question") })),
});
type FormValues = z.infer<typeof schema>;

const STEP_FIELDS = ["resumeName", "coverLetter", "portfolioUrl", "expectedSalary", "availability", "answers"] as const;

const STEPS = ["Details", "Review", "Submitted"] as const;

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Application steps">
      {STEPS.map((label, index) => {
        const done = index < step;
        const current = index === step;
        return (
          <li key={label} aria-current={current ? "step" : undefined} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                done && "bg-primary text-primary-foreground",
                current && "gradient-brand text-white shadow-md shadow-violet-500/40",
                !done && !current && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : index + 1}
            </span>
            <span className={cn("hidden text-sm sm:inline", current ? "font-semibold" : "text-muted-foreground")}>{label}</span>
            {index < STEPS.length - 1 && <span aria-hidden className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}

function JobSummary({ job, company, matchScore }: { job: Job; company?: Company; matchScore?: number }) {
  return (
    <aside aria-label="Job summary" className="space-y-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
      <div className="flex items-start gap-3">
        {company && <CompanyLogo company={company} size="md" />}
        <div className="min-w-0 flex-1">
          <p className="font-heading font-semibold text-balance">{job.title}</p>
          <p className="truncate text-sm text-muted-foreground">{company?.name ?? "Unknown company"}</p>
        </div>
        {matchScore !== undefined && <AIMatchScore score={matchScore} size="md" />}
      </div>
      <dl className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Salary</dt>
          <dd className="font-medium">{formatJobSalary(job)}</dd>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <dt className="sr-only">Location</dt>
          <dd>
            {job.location} · {job.workMode}
          </dd>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" aria-hidden />
          <dt className="sr-only">Deadline</dt>
          <dd>Apply by {formatDate(job.deadline)}</dd>
        </div>
      </dl>
      <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-primary hover:underline">
        View full job description
      </Link>
    </aside>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

interface ApplyFormProps {
  candidate: Candidate;
  job: Job;
  company?: Company;
}

function ApplyForm({ candidate, job, company }: ApplyFormProps) {
  const reduceMotion = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Application | null>(null);
  const [uploaded, setUploaded] = useState<{ fileName: string; sizeKb: number } | null>(null);
  const [tone, setTone] = useState<CoverLetterTone>("professional");
  const [variant, setVariant] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const match = useMemo(() => computeMatch(candidate, job), [candidate, job]);
  const profileResume = candidate.resume;

  const {
    register,
    control,
    setValue,
    getValues,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      resumeName: candidate.resume?.fileName ?? "",
      coverLetter: "",
      portfolioUrl: candidate.portfolio[0]?.url ?? candidate.website ?? "",
      expectedSalary: Math.round((candidate.expectedSalaryMin + candidate.expectedSalaryMax) / 2),
      availability: candidate.availability,
      answers: job.screeningQuestions.map(() => ({ answer: "" })),
    },
  });

  // Pick up a draft handed over from the Recommended jobs cover-letter panel.
  useEffect(() => {
    try {
      const key = coverDraftKey(job.id);
      const draft = window.sessionStorage.getItem(key);
      if (draft && !getValues("coverLetter")) {
        setValue("coverLetter", draft, { shouldDirty: true });
        toast.info("Your AI cover letter draft was added — review and edit it before submitting.");
      }
      if (draft) window.sessionStorage.removeItem(key);
    } catch {
      /* sessionStorage unavailable */
    }
  }, [job.id, getValues, setValue]);

  const resumeName = useWatch({ control, name: "resumeName" });
  const coverText = useWatch({ control, name: "coverLetter" });
  const coverLength = (coverText ?? "").trim().length;
  // Only the read-only review step needs the full set of values; it renders after the step change re-renders us.
  const values = getValues();

  async function handleGenerate() {
    if (generating) return;
    const nextVariant = generated ? variant + 1 : variant;
    setGenerating(true);
    try {
      const letter = await generateCoverLetter(candidate.id, job.id, { tone, variant: nextVariant });
      setVariant(nextVariant);
      setGenerated(true);
      setValue("coverLetter", letter, { shouldDirty: true, shouldValidate: true });
      toast.success(generated ? "Generated a fresh version — edit it freely" : "Cover letter drafted — edit it to make it yours");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate a cover letter");
    } finally {
      setGenerating(false);
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    const ok = /\.(pdf|docx?)$/i.test(file.name);
    if (!ok) {
      toast.error("Please choose a PDF or Word document (.pdf, .doc, .docx)");
      return;
    }
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    if (sizeKb > MAX_RESUME_KB) {
      toast.error("That file is larger than 5 MB. Please choose a smaller resume.");
      return;
    }
    setUploaded({ fileName: file.name, sizeKb });
    setValue("resumeName", file.name, { shouldDirty: true, shouldValidate: true });
    toast.success(`${file.name} attached to this application`);
  }

  async function goToReview() {
    const valid = await trigger([...STEP_FIELDS]);
    if (!valid) {
      toast.error("Please fix the highlighted fields to continue");
      return;
    }
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const submit = handleSubmit(
    async (data) => {
      setSubmitting(true);
      try {
        const app = await applyToJob({
          jobId: job.id,
          candidateId: candidate.id,
          coverLetter: data.coverLetter.trim(),
          portfolioUrl: data.portfolioUrl,
          expectedSalary: data.expectedSalary,
          availability: data.availability,
          resumeName: data.resumeName,
          screeningAnswers: job.screeningQuestions.map((question, i) => ({
            question,
            answer: data.answers[i]?.answer.trim() ?? "",
          })),
        });
        setSubmitted(app);
        setStep(2);
        toast.success("Application submitted", { description: `${job.title} at ${company?.name ?? "the company"}` });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not submit your application");
      } finally {
        setSubmitting(false);
      }
    },
    () => {
      setStep(0);
      toast.error("Some details need attention before you can submit");
    },
  );

  /* ------------------------------ success ------------------------------ */
  if (step === 2 && submitted) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card-glow rounded-xl border border-border bg-card p-6 text-center sm:p-10"
          aria-live="polite"
        >
          <motion.div
            initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto flex size-20 items-center justify-center rounded-full bg-success/15 ring-8 ring-success/10"
          >
            <CircleCheck className="size-10 text-success" aria-hidden />
          </motion.div>
          <h2 className="mt-6 font-heading text-2xl font-semibold tracking-tight">Application submitted!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-pretty text-muted-foreground">
            Your application for <strong className="text-foreground">{job.title}</strong> at{" "}
            <strong className="text-foreground">{company?.name ?? "the company"}</strong> is on its way to the hiring team.
          </p>
          <p className="mt-4 inline-block rounded-full border border-border bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
            Reference: {submitted.id}
          </p>

          <ol className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-3">
            {[
              { title: "Review", text: "The employer is notified and your profile is queued for review." },
              { title: "Updates", text: "Track every status change from My applications." },
              { title: "Interview", text: "If shortlisted, invitations show up on your dashboard." },
            ].map((item, i) => (
              <li key={item.title} className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-primary">Step {i + 1}</p>
                <p className="mt-0.5 text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href={`/applications/${submitted.id}`} className={buttonVariants({ variant: "gradient", size: "lg" })}>
              View my applications
              <ArrowRight aria-hidden />
            </Link>
            <Link href="/jobs" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Browse more jobs
            </Link>
          </div>
        </motion.section>
        <JobSummary job={job} company={company} matchScore={match.score} />
      </div>
    );
  }

  const answers = values.answers ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <Stepper step={step} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {step === 0 ? (
          <div className="space-y-6">
            {/* Resume */}
            <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="resume-heading">
              <div>
                <h2 id="resume-heading" className="font-heading text-lg font-semibold">
                  Resume
                </h2>
                <p className="text-sm text-muted-foreground">Choose the CV the employer will receive.</p>
              </div>
              <div role="radiogroup" aria-label="Resume" className="grid gap-3 sm:grid-cols-2">
                {profileResume && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={resumeName === profileResume.fileName}
                    onClick={() => setValue("resumeName", profileResume.fileName, { shouldDirty: true, shouldValidate: true })}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      resumeName === profileResume.fileName ? "border-primary bg-primary/10" : "border-border hover:border-primary/40",
                    )}
                  >
                    <Paperclip className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{profileResume.fileName}</span>
                      <span className="block text-xs text-muted-foreground">Current resume from your profile · {profileResume.sizeKb} KB</span>
                    </span>
                  </button>
                )}
                {uploaded && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={resumeName === uploaded.fileName}
                    onClick={() => setValue("resumeName", uploaded.fileName, { shouldDirty: true, shouldValidate: true })}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      resumeName === uploaded.fileName ? "border-primary bg-primary/10" : "border-border hover:border-primary/40",
                    )}
                  >
                    <FileUp className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{uploaded.fileName}</span>
                      <span className="block text-xs text-muted-foreground">Uploaded for this application · {uploaded.sizeKb} KB</span>
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-left text-sm text-muted-foreground transition-colors outline-none hover:border-primary/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <FileUp className="size-4 shrink-0" aria-hidden />
                  <span>
                    <span className="block font-medium text-foreground">{profileResume || uploaded ? "Upload a different CV" : "Upload your CV"}</span>
                    <span className="block text-xs">PDF, DOC or DOCX · up to 5 MB</span>
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="Upload resume file"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
              <FieldError id="resume-error" message={errors.resumeName?.message} />
            </section>

            {/* Cover letter */}
            <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="cover-heading">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 id="cover-heading" className="font-heading text-lg font-semibold">
                    Cover letter
                  </h2>
                  <p className="text-sm text-muted-foreground">Tell the team why you are a great fit. Minimum {MIN_COVER_LETTER} characters.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-36">
                    <SelectField
                      aria-label="Cover letter tone"
                      value={tone}
                      onChange={(v) => setTone(v as CoverLetterTone)}
                      options={TONES}
                      disabled={generating}
                    />
                  </div>
                  <Button type="button" variant={generated ? "outline" : "gradient"} onClick={handleGenerate} disabled={generating}>
                    {generating ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : generated ? (
                      <RefreshCw aria-hidden />
                    ) : (
                      <Sparkles aria-hidden />
                    )}
                    {generating ? "Writing…" : generated ? "Regenerate" : "Generate with AI"}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coverLetter" className="sr-only">
                  Cover letter
                </Label>
                <Textarea
                  id="coverLetter"
                  rows={12}
                  placeholder="Dear hiring team, I am excited to apply for…"
                  aria-invalid={!!errors.coverLetter}
                  aria-describedby="cover-help"
                  disabled={generating}
                  className="min-h-56 leading-relaxed"
                  {...register("coverLetter")}
                />
                <div id="cover-help" className="flex items-center justify-between gap-2 text-xs">
                  <span className={cn(coverLength >= MIN_COVER_LETTER ? "text-success" : "text-muted-foreground")}>
                    {coverLength} / {MIN_COVER_LETTER} characters minimum
                  </span>
                  <span className="text-muted-foreground">AI drafts are fully editable</span>
                </div>
                <FieldError id="cover-error" message={errors.coverLetter?.message} />
              </div>
            </section>

            {/* Details */}
            <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="details-heading">
              <h2 id="details-heading" className="font-heading text-lg font-semibold">
                Application details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                  <Input
                    id="portfolioUrl"
                    type="url"
                    inputMode="url"
                    placeholder="https://your-portfolio.com"
                    aria-invalid={!!errors.portfolioUrl}
                    {...register("portfolioUrl")}
                  />
                  <FieldError id="portfolio-error" message={errors.portfolioUrl?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expectedSalary">Expected salary ({candidate.salaryCurrency} / year)</Label>
                  <Input
                    id="expectedSalary"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1000}
                    aria-invalid={!!errors.expectedSalary}
                    {...register("expectedSalary", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">Posted range: {formatJobSalary(job)}</p>
                  <FieldError id="salary-error" message={errors.expectedSalary?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="availability">Availability</Label>
                  <Controller
                    control={control}
                    name="availability"
                    render={({ field }) => (
                      <SelectField
                        id="availability"
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        aria-invalid={!!errors.availability}
                        options={AVAILABILITY_OPTIONS.map((a) => ({ value: a, label: a === "Immediately" ? "Immediately" : a === "Not looking" ? "Not actively looking" : `In ${a}` }))}
                      />
                    )}
                  />
                  <FieldError id="availability-error" message={errors.availability?.message} />
                </div>
              </div>
            </section>

            {/* Screening questions */}
            {job.screeningQuestions.length > 0 && (
              <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="screening-heading">
                <div>
                  <h2 id="screening-heading" className="font-heading text-lg font-semibold">
                    Screening questions
                  </h2>
                  <p className="text-sm text-muted-foreground">The employer asks everyone who applies. All answers are required.</p>
                </div>
                <div className="space-y-5">
                  {job.screeningQuestions.map((question, index) => {
                    const error = errors.answers?.[index]?.answer?.message;
                    return (
                      <div key={`${index}-${question}`} className="space-y-1.5">
                        <Label htmlFor={`answer-${index}`} className="items-start leading-snug">
                          <span className="text-muted-foreground">{index + 1}.</span> {question}
                        </Label>
                        <Textarea
                          id={`answer-${index}`}
                          rows={3}
                          aria-invalid={!!error}
                          placeholder="Your answer…"
                          {...register(`answers.${index}.answer` as const)}
                        />
                        <FieldError id={`answer-error-${index}`} message={error} />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Link href={`/jobs/${job.id}`} className={buttonVariants({ variant: "ghost", size: "lg" })}>
                <ArrowLeft aria-hidden />
                Back to job
              </Link>
              <Button type="button" variant="gradient" size="lg" onClick={goToReview}>
                Review application
                <ArrowRight aria-hidden />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="review-heading">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="review-heading" className="font-heading text-lg font-semibold">
                    Review your application
                  </h2>
                  <p className="text-sm text-muted-foreground">Check everything below — you cannot edit after submitting.</p>
                </div>
                <AIMatchScore score={match.score} size="md" showLabel />
              </div>

              <ReviewBlock title="Resume" onEdit={() => setStep(0)}>
                <p className="flex items-center gap-2 text-sm">
                  <Paperclip className="size-4 text-primary" aria-hidden />
                  {values.resumeName}
                </p>
              </ReviewBlock>

              <ReviewBlock title="Cover letter" onEdit={() => setStep(0)}>
                <p className="rounded-lg bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-line">{values.coverLetter.trim()}</p>
              </ReviewBlock>

              <ReviewBlock title="Details" onEdit={() => setStep(0)}>
                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Portfolio</dt>
                    <dd className="font-medium break-all">{values.portfolioUrl || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Expected salary</dt>
                    <dd className="font-medium">{formatCurrency(values.expectedSalary, candidate.salaryCurrency)} / year</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Availability</dt>
                    <dd className="font-medium">{values.availability}</dd>
                  </div>
                </dl>
              </ReviewBlock>

              {job.screeningQuestions.length > 0 && (
                <ReviewBlock title="Screening answers" onEdit={() => setStep(0)}>
                  <ul className="space-y-3">
                    {job.screeningQuestions.map((question, index) => (
                      <li key={`${index}-${question}`} className="text-sm">
                        <p className="font-medium">{question}</p>
                        <p className="mt-0.5 whitespace-pre-line text-muted-foreground">{answers[index]?.answer.trim()}</p>
                      </li>
                    ))}
                  </ul>
                </ReviewBlock>
              )}
            </section>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)} disabled={submitting}>
                <ArrowLeft aria-hidden />
                Edit details
              </Button>
              <Button type="button" variant="gradient" size="lg" onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
            </div>
          </div>
        )}

        <JobSummary job={job} company={company} matchScore={match.score} />
      </div>
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="xs" onClick={onEdit}>
          <Pencil aria-hidden />
          Edit
        </Button>
      </div>
      {children}
    </div>
  );
}

export function ApplyFlow() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const candidate = useCurrentCandidate();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const applications = useAppStore((s) => s.applications);

  const job = useMemo(() => jobs.find((j) => j.id === id), [jobs, id]);
  const company = useMemo(() => companies.find((c) => c.id === job?.companyId), [companies, job]);
  const existing = useMemo(
    () => applications.find((a) => a.jobId === id && a.candidateId === candidate?.id && a.status !== "withdrawn"),
    [applications, id, candidate],
  );

  if (!hydrated || !candidate) {
    return (
      <div className="space-y-6">
        <PageHeader title="Apply for this job" />
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  if (!job) return <NotFoundState entity="job" backHref="/jobs" backLabel="Browse jobs" />;

  const block = applyBlockReason(job, companies);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={company?.name}
        title={
          <>
            Apply for <span className="gradient-text">{job.title}</span>
          </>
        }
        description="Three quick steps. Your profile details are pre-filled so you can apply in minutes."
      />
      <ApplyGate job={job} company={company} existing={existing} block={block} candidate={candidate} />
    </div>
  );
}

/** Chooses between the form, the "already applied" state and the "closed" state. */
function ApplyGate({
  job,
  company,
  existing,
  block,
  candidate,
}: {
  job: Job;
  company?: Company;
  existing?: Application;
  block: string | null;
  candidate: Candidate;
}) {
  // `ApplyForm` owns the success screen, so it must stay mounted once the store reports the new application.
  const [formStarted] = useState(() => !existing && !block);

  if (formStarted) return <ApplyForm candidate={candidate} job={job} company={company} />;

  if (existing) {
    return (
      <EmptyState
        icon={CircleCheck}
        title="You have already applied to this job"
        description={`Your application is currently "${existing.status.replace("_", " ")}". You can follow its progress or withdraw it from your applications.`}
        action={
          <>
            <Link href={`/applications/${existing.id}`} className={buttonVariants({ variant: "gradient" })}>
              View my application
            </Link>
            <Link href="/jobs" className={buttonVariants({ variant: "outline" })}>
              Browse more jobs
            </Link>
          </>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={Ban}
      title="This job is not accepting applications"
      description={block ?? "Applications are closed for this role."}
      action={
        <>
          <Link href={`/jobs/${job.id}`} className={buttonVariants({ variant: "outline" })}>
            View job
          </Link>
          <Link href="/recommended-jobs" className={buttonVariants({ variant: "gradient" })}>
            See similar roles
          </Link>
        </>
      }
    />
  );
}
