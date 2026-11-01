"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import {
  Banknote,
  Eye,
  FileText,
  ListChecks,
  Loader2,
  MapPin,
  Rocket,
  Save,
  ShieldAlert,
  Sparkles,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/shared/select-field";
import { SkillTag } from "@/components/shared/skill-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  BLOCKCHAINS,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
  PAYMENT_TOKENS,
  SKILLS,
  WORK_MODES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createJob, generateJobDescription, setJobStatus, updateJob } from "@/services";
import type { Company, Job, JobStatus } from "@/types";
import { notifyJobPendingApproval } from "./employer-services";
import { Field } from "./field";
import { JobActionButtons } from "./job-status-actions";
import { JobPreviewDialog } from "./job-preview-dialog";
import type { PreviewJob } from "./job-preview";
import {
  buildPublishSchema,
  defaultJobValues,
  draftResolver,
  toJobInput,
  todayString,
  tomorrowString,
  type JobFormValues,
} from "./job-schema";
import { StringListField } from "./string-list-field";
import { TagInput } from "./tag-input";

const CURRENCIES = ["USD", "USDC", "ETH", "SOL", "DAI"] as const;
const PERIODS = [
  { value: "year", label: "per year" },
  { value: "month", label: "per month" },
  { value: "hour", label: "per hour" },
];
const CONTRIBUTOR_TYPES = ["Core contributor", "Part-time contributor", "Grant-funded"] as const;

type Intent = "draft" | "publish" | "save";

function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4.5" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

interface JobFormProps {
  company: Company;
  userId: string;
  /** when set the form edits this job, otherwise it creates a new one */
  job?: Job;
}

export function JobForm({ company, userId, job }: JobFormProps) {
  const router = useRouter();
  const isEdit = Boolean(job);
  const isDraftLike = !job || job.status === "draft";

  const today = useMemo(() => todayString(), []);
  const minDeadline = useMemo(() => tomorrowString(), []);
  const defaults = useMemo(() => defaultJobValues(job), [job]);

  const modeRef = useRef<"draft" | "publish">("publish");
  const publishResolver = useMemo(
    () => zodResolver(buildPublishSchema({ isDao: company.isDao, today })) as Resolver<JobFormValues>,
    [company.isDao, today],
  );
  const resolver = useMemo<Resolver<JobFormValues>>(
    () => (values, context, options) =>
      modeRef.current === "draft" ? draftResolver(values, context, options) : publishResolver(values, context, options),
    [publishResolver],
  );

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    setFocus,
    reset,
    formState: { errors, isDirty },
  } = useForm<JobFormValues>({ resolver, defaultValues: defaults, mode: "onTouched" });

  const [busy, setBusy] = useState<Intent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewJob, setPreviewJob] = useState<PreviewJob | null>(null);

  const cryptoPayment = useWatch({ control, name: "cryptoPayment" });

  // Warn before the tab is closed with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const err = (key: keyof JobFormValues): string | undefined => {
    const e = errors[key];
    return e && typeof e.message === "string" ? e.message : undefined;
  };

  /* ------------------------------ actions ------------------------------ */

  async function persist(values: JobFormValues, intent: Intent) {
    setBusy(intent);
    try {
      if (!job) {
        const status: JobStatus = intent === "publish" ? "published" : "draft";
        const created = await createJob(toJobInput(values, company, status), userId);
        if (intent === "publish") {
          if (created.status === "pending") {
            toast.info("Submitted for admin approval", {
              description: `“${created.title}” is pending review and will go live once approved.`,
            });
          } else {
            toast.success("Job published", { description: `“${created.title}” is now live on the public job board.` });
          }
        } else {
          toast.success("Draft saved", { description: `“${created.title}” was saved to Manage jobs.` });
        }
        router.push("/employer/jobs");
        return;
      }

      const { status: _status, companyId: _companyId, ...patch } = toJobInput(values, company, job.status);
      void _status;
      void _companyId;
      const updated = await updateJob(job.id, patch);
      if (intent === "publish") {
        const live = await setJobStatus(job.id, "published");
        if (live.status === "pending") {
          notifyJobPendingApproval(live);
          toast.info("Submitted for admin approval", {
            description: `“${live.title}” is pending review and will go live once approved.`,
          });
        } else {
          toast.success("Job published", { description: `“${live.title}” is now live on the public job board.` });
        }
        router.push("/employer/jobs");
        return;
      }
      if (intent === "draft") {
        toast.success("Draft saved", { description: `Changes to “${updated.title}” were saved.` });
        router.push("/employer/jobs");
        return;
      }
      toast.success("Changes saved", { description: `“${updated.title}” was updated.` });
      reset(values);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the job. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function submit(intent: Intent) {
    modeRef.current = intent === "draft" ? "draft" : "publish";
    try {
      await handleSubmit(
        (values) => persist(values, intent),
        (formErrors) => {
          const first = Object.keys(formErrors)[0] as keyof JobFormValues | undefined;
          toast.error(intent === "draft" ? "A job title is required" : "Please fix the highlighted fields", {
            description: intent === "draft" ? undefined : "The form has fields that need your attention.",
          });
          if (first) setFocus(first);
        },
      )();
    } finally {
      modeRef.current = "publish";
    }
  }

  function openPreview() {
    setPreviewJob(toJobInput(getValues(), company, job?.status ?? "draft"));
    setPreviewOpen(true);
  }

  async function generateWithAi() {
    const v = getValues();
    if (v.title.trim().length < 3) {
      setError("title", { type: "manual", message: "Add a job title first so the AI knows what to write" });
      setFocus("title");
      toast.error("Add a job title first");
      return;
    }
    setGenerating(true);
    try {
      const out = await generateJobDescription({
        title: v.title.trim(),
        category: v.category || undefined,
        experience: v.experience,
        skills: v.skills,
        companyName: company.name,
        workMode: v.workMode,
        blockchain: v.blockchain,
      });
      const opts = { shouldDirty: true, shouldValidate: true } as const;
      setValue("description", out.description, opts);
      setValue("responsibilities", out.responsibilities, opts);
      setValue("qualifications", out.qualifications, opts);
      setValue("benefits", out.benefits, opts);
      toast.success("AI draft ready", {
        description: "Review and edit the generated text. Nothing is published automatically.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The AI assistant could not generate a draft.");
    } finally {
      setGenerating(false);
    }
  }

  const working = busy !== null;
  const primaryLabel = isEdit && !isDraftLike ? "Save changes" : "Publish";

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-6" aria-label={isEdit ? "Edit job" : "Create job"}>
        {/* Basics */}
        <SectionCard icon={FileText} title="Job basics" description="What are you hiring for?">
          <Field label="Job title" htmlFor="job-title" required error={err("title")}>
            <Input
              id="job-title"
              placeholder="e.g. Senior Solidity Developer"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "job-title-error" : undefined}
              {...register("title")}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Category" htmlFor="job-category" required error={err("category")}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <SelectField
                    id="job-category"
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select a category"
                    options={JOB_CATEGORIES.map((c) => ({ value: c, label: c }))}
                    aria-invalid={Boolean(errors.category)}
                  />
                )}
              />
            </Field>
            <Field label="Employment type" htmlFor="job-type" required>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <SelectField
                    id="job-type"
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    options={EMPLOYMENT_TYPES.map((c) => ({ value: c, label: c }))}
                  />
                )}
              />
            </Field>
            <Field label="Experience level" htmlFor="job-experience" required>
              <Controller
                control={control}
                name="experience"
                render={({ field }) => (
                  <SelectField
                    id="job-experience"
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    options={EXPERIENCE_LEVELS.map((c) => ({ value: c, label: c }))}
                  />
                )}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Location */}
        <SectionCard icon={MapPin} title="Location & work mode" description="Where and how will the work happen?">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Remote availability" htmlFor="job-workmode" required>
              <Controller
                control={control}
                name="workMode"
                render={({ field }) => (
                  <SelectField
                    id="job-workmode"
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    options={WORK_MODES.map((c) => ({ value: c, label: c }))}
                  />
                )}
              />
            </Field>
            <Field
              label="Location"
              htmlFor="job-location"
              required
              error={err("location")}
              hint="City, country or a time-zone range, e.g. “Remote (UTC-5 to UTC+2)”."
            >
              <Input
                id="job-location"
                placeholder="Remote (Europe)"
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? "job-location-error" : "job-location-hint"}
                {...register("location")}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Compensation */}
        <SectionCard icon={Banknote} title="Compensation & network" description="Be transparent: salary ranges attract more qualified applicants.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Salary minimum" htmlFor="job-salary-min" required error={err("salaryMin")}>
              <Input
                id="job-salary-min"
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="120000"
                aria-invalid={Boolean(errors.salaryMin)}
                aria-describedby={errors.salaryMin ? "job-salary-min-error" : undefined}
                {...register("salaryMin")}
              />
            </Field>
            <Field label="Salary maximum" htmlFor="job-salary-max" required error={err("salaryMax")}>
              <Input
                id="job-salary-max"
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="160000"
                aria-invalid={Boolean(errors.salaryMax)}
                aria-describedby={errors.salaryMax ? "job-salary-max-error" : undefined}
                {...register("salaryMax")}
              />
            </Field>
            <Field label="Currency" htmlFor="job-currency" required>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <SelectField
                    id="job-currency"
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                  />
                )}
              />
            </Field>
            <Field label="Salary period" htmlFor="job-period" required>
              <Controller
                control={control}
                name="salaryPeriod"
                render={({ field }) => (
                  <SelectField id="job-period" ref={field.ref} value={field.value} onChange={field.onChange} options={PERIODS} />
                )}
              />
            </Field>
          </div>

          <Field label="Blockchain network / ecosystem" htmlFor="job-blockchain" required>
            <Controller
              control={control}
              name="blockchain"
              render={({ field }) => (
                <SelectField
                  id="job-blockchain"
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  options={BLOCKCHAINS.map((c) => ({ value: c, label: c }))}
                  className="sm:max-w-xs"
                />
              )}
            />
          </Field>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <Controller
              control={control}
              name="cryptoPayment"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label htmlFor="job-crypto" className="text-sm font-medium">
                      Offer crypto payment
                    </label>
                    <p id="job-crypto-hint" className="text-xs text-muted-foreground">
                      Let candidates choose to be paid in stablecoins or other tokens.
                    </p>
                  </div>
                  <Switch
                    id="job-crypto"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    aria-describedby="job-crypto-hint"
                  />
                </div>
              )}
            />
            {cryptoPayment && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <p id="job-tokens-label" className="text-sm font-medium">
                  Accepted payment tokens <span aria-hidden className="text-destructive">*</span>
                </p>
                <Controller
                  control={control}
                  name="paymentTokens"
                  render={({ field }) => (
                    <ul className="flex flex-wrap gap-2" aria-labelledby="job-tokens-label">
                      {PAYMENT_TOKENS.map((token) => {
                        const active = field.value.includes(token);
                        return (
                          <li key={token}>
                            <SkillTag
                              skill={token}
                              size="md"
                              active={active}
                              variant="outline"
                              onClick={() =>
                                field.onChange(active ? field.value.filter((t) => t !== token) : [...field.value, token])
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                />
                {errors.paymentTokens && (
                  <p role="alert" className="text-xs text-destructive">
                    {err("paymentTokens")}
                  </p>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Skills */}
        <SectionCard icon={ListChecks} title="Required skills" description="Candidates are matched against these skills by the AI match score.">
          <Field label="Skills" htmlFor="job-skills" required error={err("skills")}>
            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <TagInput
                  id="job-skills"
                  value={field.value}
                  onChange={field.onChange}
                  suggestions={SKILLS}
                  placeholder="Add a skill, e.g. Solidity"
                  aria-invalid={Boolean(errors.skills)}
                />
              )}
            />
          </Field>
        </SectionCard>

        {/* Description */}
        <SectionCard
          icon={Sparkles}
          title="Role details"
          description="Describe the role, then list responsibilities, qualifications and benefits."
          action={
            <Button type="button" variant="outline" onClick={generateWithAi} disabled={generating || working}>
              {generating ? <Loader2 className="animate-spin" aria-hidden /> : <Wand2 aria-hidden />}
              {generating ? "Generating…" : "Generate with AI"}
            </Button>
          }
        >
          <p className="-mt-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            The AI assistant fills the description, responsibilities, qualifications and benefits from your title, level
            and skills. You can edit everything, and nothing is published automatically.
          </p>
          <Field label="Job description" htmlFor="job-description" required error={err("description")}>
            <Textarea
              id="job-description"
              rows={7}
              placeholder="Tell candidates about the mission, the team and what a great first year looks like."
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "job-description-error" : undefined}
              {...register("description")}
            />
          </Field>

          <Field label="Responsibilities" htmlFor="job-responsibilities" required error={err("responsibilities")}>
            <div id="job-responsibilities">
              <Controller
                control={control}
                name="responsibilities"
                render={({ field }) => (
                  <StringListField
                    noun="Responsibility"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="e.g. Design and ship audited smart contracts"
                    invalid={Boolean(errors.responsibilities)}
                  />
                )}
              />
            </div>
          </Field>

          <Field label="Qualifications" htmlFor="job-qualifications" required error={err("qualifications")}>
            <div id="job-qualifications">
              <Controller
                control={control}
                name="qualifications"
                render={({ field }) => (
                  <StringListField
                    noun="Qualification"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="e.g. 4+ years of production Solidity experience"
                    invalid={Boolean(errors.qualifications)}
                  />
                )}
              />
            </div>
          </Field>

          <Field label="Benefits" htmlFor="job-benefits" hint="Optional, but strong benefits improve application rates.">
            <div id="job-benefits">
              <Controller
                control={control}
                name="benefits"
                render={({ field }) => (
                  <StringListField
                    noun="Benefit"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="e.g. Annual learning budget"
                  />
                )}
              />
            </div>
          </Field>
        </SectionCard>

        {/* Application settings */}
        <SectionCard icon={ListChecks} title="Application settings" description="Control when applications close and what you ask applicants.">
          <Field
            label="Application deadline"
            htmlFor="job-deadline"
            required
            error={err("deadline")}
            hint="Must be a future date."
            className="sm:max-w-xs"
          >
            <Input
              id="job-deadline"
              type="date"
              min={minDeadline}
              aria-invalid={Boolean(errors.deadline)}
              aria-describedby={errors.deadline ? "job-deadline-error" : "job-deadline-hint"}
              {...register("deadline")}
            />
          </Field>

          <Field
            label="Screening questions"
            htmlFor="job-screening"
            error={err("screeningQuestions")}
            hint="Optional. Up to 5 questions candidates answer when applying."
          >
            <div id="job-screening">
              <Controller
                control={control}
                name="screeningQuestions"
                render={({ field }) => (
                  <StringListField
                    noun="Screening question"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="e.g. Describe a contract you audited or shipped to mainnet"
                    max={5}
                    multiline
                  />
                )}
              />
            </div>
          </Field>
        </SectionCard>

        {/* DAO */}
        {company.isDao && (
          <SectionCard icon={Users} title="DAO details" description={`${company.name} is a DAO, so contributor details are shown on the posting.`}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="DAO name" htmlFor="job-dao-name" required error={err("daoName")}>
                <Input
                  id="job-dao-name"
                  placeholder={company.name}
                  aria-invalid={Boolean(errors.daoName)}
                  aria-describedby={errors.daoName ? "job-dao-name-error" : undefined}
                  {...register("daoName")}
                />
              </Field>
              <Field label="Contributor type" htmlFor="job-contributor" required error={err("contributorType")}>
                <Controller
                  control={control}
                  name="contributorType"
                  render={({ field }) => (
                    <SelectField
                      id="job-contributor"
                      ref={field.ref}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select a type"
                      options={CONTRIBUTOR_TYPES.map((c) => ({ value: c, label: c }))}
                      aria-invalid={Boolean(errors.contributorType)}
                    />
                  )}
                />
              </Field>
            </div>
          </SectionCard>
        )}

        {/* Lifecycle (edit only) */}
        {job && (
          <SectionCard
            icon={ShieldAlert}
            title="Job status"
            description="Pause, close or remove this posting at any time."
            action={<StatusBadge status={job.status} />}
          >
            {job.status === "pending" && (
              <p className="text-sm text-muted-foreground">This job is awaiting admin approval. It will go live once approved.</p>
            )}
            {(job.status === "rejected" || job.status === "hidden") && (
              <p className="text-sm text-muted-foreground">
                This job was hidden by moderators. Update it and resubmit, or contact support if you think this is a mistake.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <JobActionButtons
                job={job}
                exclude={job.status === "draft" ? ["publish"] : []}
                onDeleted={() => router.push("/employer/jobs")}
              />
            </div>
          </SectionCard>
        )}

        {/* Sticky action bar */}
        <div
          className={cn(
            "sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <p className="px-1 text-xs text-muted-foreground" aria-live="polite">
            {isDirty ? "You have unsaved changes." : isEdit ? "All changes saved." : "Draft is not saved yet."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/employer/jobs")} disabled={working}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={openPreview} disabled={working}>
              <Eye aria-hidden />
              Preview
            </Button>
            {isDraftLike && (
              <Button type="button" variant="secondary" onClick={() => submit("draft")} disabled={working}>
                {busy === "draft" ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
                Save draft
              </Button>
            )}
            <Button
              type="button"
              variant="gradient"
              onClick={() => submit(isDraftLike ? "publish" : "save")}
              disabled={working}
            >
              {busy === "publish" || busy === "save" ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : isDraftLike ? (
                <Rocket aria-hidden />
              ) : (
                <Save aria-hidden />
              )}
              {primaryLabel}
            </Button>
          </div>
        </div>
      </form>

      <JobPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} job={previewJob} company={company} />
    </>
  );
}
