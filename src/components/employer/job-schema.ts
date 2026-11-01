import { addDays, format } from "date-fns";
import type { Resolver, ResolverResult } from "react-hook-form";
import { z } from "zod";
import { addDaysIso, appNow } from "@/lib/clock";
import type { Company, Job, JobInput, JobStatus } from "@/types";

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */

const nonBlankList = (min: number, message: string) =>
  z.array(z.string()).refine((list) => list.filter((s) => s.trim()).length >= min, { message });

const amount = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter a ${label} salary`)
    .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, { message: "Enter a valid positive number" });

export const jobFormSchema = z.object({
  title: z.string().trim().min(3, "Enter a job title (at least 3 characters)").max(120, "Keep the title under 120 characters"),
  category: z.string().min(1, "Choose a category"),
  type: z.enum(["Full-time", "Part-time", "Contract", "Freelance", "Internship"]),
  workMode: z.enum(["Remote", "Hybrid", "Onsite"]),
  location: z.string().trim().min(2, "Enter a location, or “Remote” with a time-zone range"),
  experience: z.enum(["Entry", "Mid", "Senior", "Lead"]),
  salaryMin: amount("minimum"),
  salaryMax: amount("maximum"),
  currency: z.enum(["USD", "USDC", "ETH", "SOL", "DAI"]),
  salaryPeriod: z.enum(["year", "month", "hour"]),
  cryptoPayment: z.boolean(),
  paymentTokens: z.array(z.string()),
  blockchain: z.enum([
    "Ethereum",
    "Polygon",
    "Base",
    "Arbitrum",
    "Solana",
    "Optimism",
    "Avalanche",
    "Cosmos",
    "Multi-chain",
  ]),
  skills: z.array(z.string()).min(1, "Add at least one required skill"),
  description: z.string().trim().min(50, "Describe the role in at least 50 characters").max(5000, "Keep the description under 5,000 characters"),
  responsibilities: nonBlankList(1, "Add at least one responsibility"),
  qualifications: nonBlankList(1, "Add at least one qualification"),
  benefits: z.array(z.string()),
  deadline: z.string().min(1, "Pick an application deadline"),
  screeningQuestions: z.array(z.string()).max(5, "You can add at most 5 screening questions"),
  daoName: z.string(),
  contributorType: z.enum(["", "Core contributor", "Part-time contributor", "Grant-funded"]),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;

interface PublishContext {
  isDao: boolean;
  /** yyyy-MM-dd of the current app day; the deadline must be after it */
  today: string;
}

/** Full validation used for Publish / Save changes. */
export function buildPublishSchema({ isDao, today }: PublishContext) {
  return jobFormSchema.superRefine((v, ctx) => {
    const min = Number(v.salaryMin);
    const max = Number(v.salaryMax);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      if (max <= 0) {
        ctx.addIssue({ code: "custom", path: ["salaryMax"], message: "Maximum salary must be greater than 0" });
      } else if (min > max) {
        ctx.addIssue({ code: "custom", path: ["salaryMin"], message: "Minimum salary can't be higher than the maximum" });
      }
    }
    if (v.cryptoPayment && v.paymentTokens.length === 0) {
      ctx.addIssue({ code: "custom", path: ["paymentTokens"], message: "Select at least one accepted token" });
    }
    if (v.deadline && v.deadline <= today) {
      ctx.addIssue({ code: "custom", path: ["deadline"], message: "The deadline must be a future date" });
    }
    if (isDao && !v.daoName.trim()) {
      ctx.addIssue({ code: "custom", path: ["daoName"], message: "Enter the name of your DAO" });
    }
    if (isDao && !v.contributorType) {
      ctx.addIssue({ code: "custom", path: ["contributorType"], message: "Choose a contributor type" });
    }
  });
}

/** Draft validation: only the title is required. */
export const draftResolver: Resolver<JobFormValues> = async (values): Promise<ResolverResult<JobFormValues>> => {
  if (!values.title || values.title.trim().length < 3) {
    return {
      values: {},
      errors: { title: { type: "required", message: "Add a job title (at least 3 characters) to save a draft" } },
    };
  }
  return { values, errors: {} };
};

/* ------------------------------------------------------------------ */
/* Mapping                                                             */
/* ------------------------------------------------------------------ */

export function todayString(): string {
  return format(appNow(), "yyyy-MM-dd");
}

export function tomorrowString(): string {
  return format(addDays(appNow(), 1), "yyyy-MM-dd");
}

export function defaultJobValues(job?: Job): JobFormValues {
  if (job) {
    return {
      title: job.title,
      category: job.category,
      type: job.type,
      workMode: job.workMode,
      location: job.location,
      experience: job.experience,
      salaryMin: String(job.salaryMin),
      salaryMax: String(job.salaryMax),
      currency: job.currency,
      salaryPeriod: job.salaryPeriod,
      cryptoPayment: job.cryptoPayment,
      paymentTokens: job.paymentTokens,
      blockchain: job.blockchain,
      skills: job.skills,
      description: job.description,
      responsibilities: job.responsibilities,
      qualifications: job.qualifications,
      benefits: job.benefits,
      deadline: job.deadline.slice(0, 10),
      screeningQuestions: job.screeningQuestions,
      daoName: job.daoName ?? "",
      contributorType: job.contributorType ?? "",
    };
  }
  return {
    title: "",
    category: "",
    type: "Full-time",
    workMode: "Remote",
    location: "Remote",
    experience: "Mid",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    salaryPeriod: "year",
    cryptoPayment: false,
    paymentTokens: [],
    blockchain: "Ethereum",
    skills: [],
    description: "",
    responsibilities: [""],
    qualifications: [""],
    benefits: [],
    deadline: format(addDays(appNow(), 30), "yyyy-MM-dd"),
    screeningQuestions: [],
    daoName: "",
    contributorType: "",
  };
}

const clean = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Converts form values to the store's JobInput. */
export function toJobInput(values: JobFormValues, company: Company, status: JobStatus): JobInput {
  const deadline = values.deadline ? `${values.deadline}T23:59:00.000Z` : addDaysIso(30);
  return {
    companyId: company.id,
    title: values.title.trim(),
    category: values.category,
    type: values.type,
    workMode: values.workMode,
    location: values.location.trim(),
    experience: values.experience,
    salaryMin: toNumber(values.salaryMin),
    salaryMax: toNumber(values.salaryMax),
    currency: values.currency,
    salaryPeriod: values.salaryPeriod,
    cryptoPayment: values.cryptoPayment,
    paymentTokens: values.cryptoPayment ? values.paymentTokens : [],
    blockchain: values.blockchain,
    skills: values.skills,
    description: values.description.trim(),
    responsibilities: clean(values.responsibilities),
    qualifications: clean(values.qualifications),
    benefits: clean(values.benefits),
    screeningQuestions: clean(values.screeningQuestions),
    deadline,
    status,
    isDao: company.isDao,
    daoName: company.isDao ? values.daoName.trim() || undefined : undefined,
    contributorType: company.isDao && values.contributorType ? values.contributorType : undefined,
  };
}
