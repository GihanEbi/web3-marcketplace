"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Plus, Rocket, Save, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SelectField } from "@/components/shared/select-field";
import { BLOCKCHAINS, PAYMENT_TOKENS } from "@/lib/constants";
import { addDaysIso, appNow } from "@/lib/clock";
import { formatNumber } from "@/lib/format";
import { createProject } from "@/services";
import { useCurrentCompany, useCurrentUser, useHydrated } from "@/store/hooks";
import type { Blockchain, PaymentToken, ProjectInput } from "@/types";
import { SkillTagInput } from "./skill-tag-input";

interface FormValues {
  title: string;
  description: string;
  skills: string[];
  budgetType: "fixed" | "hourly";
  budgetMin: string;
  budgetMax: string;
  currency: string;
  durationWeeks: string;
  blockchain: string;
  deadline: string;
  milestones: { title: string; amount: string; dueInDays: string }[];
}

function numberField(label: string, opts: { int?: boolean; min?: number; max?: number } = {}) {
  const min = opts.min ?? 0;
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => Number.isFinite(Number(v)), `${label} must be a number`)
    .refine((v) => !opts.int || Number.isInteger(Number(v)), `${label} must be a whole number`)
    .refine((v) => (min === 0 ? Number(v) > 0 : Number(v) >= min), min === 0 ? `${label} must be greater than 0` : `${label} must be at least ${min}`)
    .refine((v) => opts.max === undefined || Number(v) <= opts.max, `${label} must be ${opts.max} or less`);
}

const publishSchema = z
  .object({
    title: z.string().trim().min(8, "Give the project a clear title (8+ characters)").max(100, "Keep the title under 100 characters"),
    description: z.string().trim().min(60, "Describe the scope in at least 60 characters").max(4000, "Keep the description under 4,000 characters"),
    skills: z.array(z.string()).min(1, "Add at least one required skill").max(12, "Choose at most 12 skills"),
    budgetType: z.enum(["fixed", "hourly"]),
    budgetMin: numberField("Minimum budget"),
    budgetMax: numberField("Maximum budget"),
    currency: z.string().min(1, "Choose a payment currency"),
    durationWeeks: numberField("Duration", { int: true, max: 104 }),
    blockchain: z.string().min(1, "Choose a blockchain"),
    deadline: z.string().min(1, "Pick a deadline for proposals"),
    milestones: z
      .array(
        z.object({
          title: z.string().trim().min(3, "Name the milestone"),
          amount: numberField("Amount"),
          dueInDays: numberField("Due in days", { int: true, max: 730 }),
        }),
      )
      .min(1, "Add at least one milestone")
      .max(10, "Use at most 10 milestones"),
  })
  .superRefine((v, ctx) => {
    if (Number(v.budgetMin) > Number(v.budgetMax)) {
      ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "Maximum must be at least the minimum" });
    }
    const deadlineMs = Date.parse(`${v.deadline}T23:59:00.000Z`);
    if (!Number.isFinite(deadlineMs) || deadlineMs <= appNow().getTime()) {
      ctx.addIssue({ code: "custom", path: ["deadline"], message: "The proposal deadline must be in the future" });
    }
  });

const draftSchema = z.object({
  title: z.string().trim().min(3, "Add at least a working title to save a draft"),
});

const toNumber = (v: string): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function FieldBlock({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="space-y-1.5">
        <Label htmlFor={htmlFor}>{label}</Label>
        {children}
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ProjectFormInner() {
  const router = useRouter();
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const [busy, setBusy] = useState<"draft" | "open" | null>(null);

  const minDeadline = useMemo(() => format(appNow(), "yyyy-MM-dd"), []);
  const defaultDeadline = useMemo(() => format(new Date(addDaysIso(21)), "yyyy-MM-dd"), []);

  const {
    register,
    control,
    getValues,
    setError,
    clearErrors,
    setFocus,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      skills: [],
      budgetType: "fixed",
      budgetMin: "",
      budgetMax: "",
      currency: "USDC",
      durationWeeks: "6",
      blockchain: "Ethereum",
      deadline: defaultDeadline,
      milestones: [
        { title: "", amount: "", dueInDays: "14" },
        { title: "", amount: "", dueInDays: "28" },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "milestones" });

  const budgetType = useWatch({ control, name: "budgetType" });
  const budgetMax = useWatch({ control, name: "budgetMax" });
  const currency = useWatch({ control, name: "currency" });
  const milestones = useWatch({ control, name: "milestones" });

  const milestoneTotal = useMemo(() => (milestones ?? []).reduce((sum, m) => sum + toNumber(m.amount), 0), [milestones]);
  const maxNumber = toNumber(budgetMax);
  const mismatch =
    budgetType === "fixed" && maxNumber > 0 && milestoneTotal > 0 && Math.abs(milestoneTotal - maxNumber) / maxNumber > 0.1;

  async function submit(mode: "draft" | "open") {
    if (!user || !company) {
      toast.error("You need to be signed in as an employer to post a project");
      return;
    }
    clearErrors();
    const values = getValues();
    const parsed = (mode === "open" ? publishSchema : draftSchema).safeParse(values);
    if (!parsed.success) {
      let firstPath: string | null = null;
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        firstPath ??= path;
        setError(path as FieldPath<FormValues>, { type: "validate", message: issue.message });
      }
      toast.error(mode === "open" ? "Please fix the highlighted fields before publishing" : "Add a working title to save the draft");
      if (firstPath && !firstPath.startsWith("skills")) setFocus(firstPath as FieldPath<FormValues>);
      return;
    }

    const input: ProjectInput = {
      clientCompanyId: company.id,
      title: values.title.trim(),
      description: values.description.trim(),
      skills: values.skills,
      budgetType: values.budgetType,
      budgetMin: toNumber(values.budgetMin),
      budgetMax: toNumber(values.budgetMax),
      currency: values.currency as PaymentToken,
      durationWeeks: Math.max(1, Math.round(toNumber(values.durationWeeks))),
      blockchain: values.blockchain as Blockchain,
      status: mode,
      milestones: values.milestones
        .filter((m) => m.title.trim() !== "")
        .map((m) => ({
          title: m.title.trim(),
          amount: toNumber(m.amount),
          dueInDays: Math.max(1, Math.round(toNumber(m.dueInDays))),
        })),
      deadline: values.deadline ? `${values.deadline}T23:59:00.000Z` : addDaysIso(21),
    };

    setBusy(mode);
    try {
      const project = await createProject(input, user.id);
      toast.success(mode === "open" ? "Project published" : "Draft saved", {
        description:
          mode === "open"
            ? `"${project.title}" is now live on the public projects board.`
            : `"${project.title}" was saved as a draft. Publish it from your projects list when ready.`,
      });
      router.push("/employer/projects");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the project");
      setBusy(null);
    }
  }

  const disabled = busy !== null;
  const currencyOptions = PAYMENT_TOKENS.map((t) => ({ value: t, label: t }));
  const chainOptions = BLOCKCHAINS.map((b) => ({ value: b, label: b }));

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      noValidate
      className="space-y-6"
    >
      <Section title="Project details" description="What do you need built, and what does a great result look like?">
        <FieldBlock label="Project title" htmlFor="title" error={errors.title?.message}>
          <Input id="title" placeholder="e.g. Audit and gas-optimise our staking contracts" aria-invalid={Boolean(errors.title)} {...register("title")} />
        </FieldBlock>
        <FieldBlock
          label="Description"
          htmlFor="description"
          error={errors.description?.message}
          hint="Cover scope, deliverables, the stack involved and how you will review the work."
        >
          <Textarea id="description" rows={7} aria-invalid={Boolean(errors.description)} {...register("description")} />
        </FieldBlock>
        <FieldBlock label="Required skills" htmlFor="skills" error={errors.skills?.message ?? undefined}>
          <Controller
            control={control}
            name="skills"
            render={({ field }) => (
              <SkillTagInput id="skills" value={field.value} onChange={field.onChange} invalid={Boolean(errors.skills)} />
            )}
          />
        </FieldBlock>
      </Section>

      <Section title="Budget & timeline" description="Freelancers see this range when deciding whether to send a proposal.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldBlock label="Budget type" htmlFor="budgetType">
            <Controller
              control={control}
              name="budgetType"
              render={({ field }) => (
                <SelectField
                  id="budgetType"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "fixed", label: "Fixed price" },
                    { value: "hourly", label: "Hourly rate" },
                  ]}
                />
              )}
            />
          </FieldBlock>
          <FieldBlock label={budgetType === "hourly" ? "Min rate / hour" : "Min budget"} htmlFor="budgetMin" error={errors.budgetMin?.message}>
            <Input id="budgetMin" inputMode="decimal" placeholder="3000" aria-invalid={Boolean(errors.budgetMin)} {...register("budgetMin")} />
          </FieldBlock>
          <FieldBlock label={budgetType === "hourly" ? "Max rate / hour" : "Max budget"} htmlFor="budgetMax" error={errors.budgetMax?.message}>
            <Input id="budgetMax" inputMode="decimal" placeholder="4500" aria-invalid={Boolean(errors.budgetMax)} {...register("budgetMax")} />
          </FieldBlock>
          <FieldBlock label="Payment currency" htmlFor="currency" error={errors.currency?.message}>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => <SelectField id="currency" value={field.value} onChange={field.onChange} options={currencyOptions} />}
            />
          </FieldBlock>
          <FieldBlock label="Duration (weeks)" htmlFor="durationWeeks" error={errors.durationWeeks?.message}>
            <Input id="durationWeeks" inputMode="numeric" aria-invalid={Boolean(errors.durationWeeks)} {...register("durationWeeks")} />
          </FieldBlock>
          <FieldBlock label="Blockchain" htmlFor="blockchain" error={errors.blockchain?.message}>
            <Controller
              control={control}
              name="blockchain"
              render={({ field }) => <SelectField id="blockchain" value={field.value} onChange={field.onChange} options={chainOptions} />}
            />
          </FieldBlock>
          <FieldBlock
            label="Deadline for proposals"
            htmlFor="deadline"
            error={errors.deadline?.message}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Input id="deadline" type="date" min={minDeadline} aria-invalid={Boolean(errors.deadline)} {...register("deadline")} />
          </FieldBlock>
        </div>
      </Section>

      <Section
        title="Milestones"
        description="Escrow is funded and released milestone by milestone (simulated in this demo). The accepted proposal price scales these amounts."
      >
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const rowErrors = errors.milestones?.[index];
            return (
              <li key={field.id} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_auto] sm:items-start">
                  <FieldBlock label={`Milestone ${index + 1} title`} htmlFor={`ms-title-${index}`} error={rowErrors?.title?.message}>
                    <Input
                      id={`ms-title-${index}`}
                      placeholder="e.g. Threat model & initial report"
                      aria-invalid={Boolean(rowErrors?.title)}
                      {...register(`milestones.${index}.title`)}
                    />
                  </FieldBlock>
                  <FieldBlock label={`Amount (${currency})`} htmlFor={`ms-amount-${index}`} error={rowErrors?.amount?.message}>
                    <Input
                      id={`ms-amount-${index}`}
                      inputMode="decimal"
                      aria-invalid={Boolean(rowErrors?.amount)}
                      {...register(`milestones.${index}.amount`)}
                    />
                  </FieldBlock>
                  <FieldBlock label="Due in days" htmlFor={`ms-due-${index}`} error={rowErrors?.dueInDays?.message}>
                    <Input
                      id={`ms-due-${index}`}
                      inputMode="numeric"
                      aria-invalid={Boolean(rowErrors?.dueInDays)}
                      {...register(`milestones.${index}.dueInDays`)}
                    />
                  </FieldBlock>
                  <div className="sm:pt-[1.625rem]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      aria-label={`Remove milestone ${index + 1}`}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {typeof errors.milestones?.message === "string" && (
          <p role="alert" className="text-xs text-destructive">
            {errors.milestones.message}
          </p>
        )}
        {typeof errors.milestones?.root?.message === "string" && (
          <p role="alert" className="text-xs text-destructive">
            {errors.milestones.root.message}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ title: "", amount: "", dueInDays: "42" })}
            disabled={fields.length >= 10}
          >
            <Plus aria-hidden />
            Add milestone
          </Button>
          <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
            Milestone total: <span className="font-semibold text-foreground">{formatNumber(milestoneTotal, 2)}</span> {currency}
            {budgetType === "fixed" && maxNumber > 0 && <> of {formatNumber(maxNumber, 2)} max budget</>}
          </p>
        </div>

        {mismatch && (
          <div role="status" className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              For fixed-price projects the milestones should add up to roughly your maximum budget. Yours total {formatNumber(milestoneTotal, 2)}{" "}
              {currency} against {formatNumber(maxNumber, 2)} {currency}. You can still continue.
            </p>
          </div>
        )}
        {budgetType === "hourly" && (
          <p className="text-xs text-muted-foreground">
            For hourly projects, enter your estimated spend per phase. Milestone totals are not compared against the hourly rate.
          </p>
        )}
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-2 rounded-xl border border-border bg-background/90 p-3 backdrop-blur">
        <Link href="/employer/projects" className={buttonVariants({ variant: "ghost" })} aria-disabled={disabled}>
          Cancel
        </Link>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => void submit("draft")}>
          {busy === "draft" ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          Save draft
        </Button>
        <Button type="button" variant="gradient" disabled={disabled} onClick={() => void submit("open")}>
          {busy === "open" ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />}
          Publish project
        </Button>
      </div>
    </form>
  );
}

/** Create-project form (draft or publish). Waits for store hydration before mounting. */
export function ProjectForm() {
  const hydrated = useHydrated();
  if (!hydrated) return <LoadingSkeleton variant="detail" />;
  return <ProjectFormInner />;
}
