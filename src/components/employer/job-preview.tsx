"use client";

import type { ReactNode } from "react";
import {
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Coins,
  ExternalLink,
  Globe,
  Layers,
  MapPin,
  MessageSquareQuote,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/shared/company-logo";
import { SkillTagList } from "@/components/shared/skill-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { daysUntil, formatDate, formatJobSalary } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Company, Job, JobStatus } from "@/types";

export type PreviewJob = Pick<
  Job,
  | "title"
  | "category"
  | "type"
  | "workMode"
  | "location"
  | "experience"
  | "salaryMin"
  | "salaryMax"
  | "currency"
  | "salaryPeriod"
  | "cryptoPayment"
  | "paymentTokens"
  | "blockchain"
  | "skills"
  | "description"
  | "responsibilities"
  | "qualifications"
  | "benefits"
  | "screeningQuestions"
  | "deadline"
  | "isDao"
  | "daoName"
  | "contributorType"
> & { status?: JobStatus };

const CHIP = "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-heading text-lg font-semibold tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="flex items-start gap-2.5 text-sm text-pretty">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

interface JobPreviewProps {
  job: PreviewJob;
  company: Company;
  className?: string;
}

/**
 * Renders a posting the way candidates see it on the public job page
 * (header, role details, sidebar with overview + company card). The apply button is inert.
 */
export function JobPreview({ job, company, className }: JobPreviewProps) {
  const hasSalary = job.salaryMax > 0;
  const deadlineDays = job.deadline ? daysUntil(job.deadline) : null;
  const title = job.title.trim() || "Untitled job";

  return (
    <div className={cn("space-y-6", className)}>
      <header className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <CompanyLogo company={company} size="xl" />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance">{title}</h2>
                {job.status && job.status !== "published" && <StatusBadge status={job.status} size="sm" />}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{company.name}</span>
                <VerifiedBadge verified={company.verified} />
                {job.category && <span>· {job.category}</span>}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>{job.workMode}</span>
              <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>{job.type}</span>
              <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>{job.experience}</span>
              <span className={cn(CHIP, "bg-info/15 text-info")}>
                <Layers className="size-3" aria-hidden />
                {job.blockchain}
              </span>
              {job.isDao && (
                <span className={cn(CHIP, "bg-violet-500/15 text-violet-700 dark:text-violet-300")}>
                  <Users className="size-3" aria-hidden />
                  {job.daoName ? `DAO · ${job.daoName}` : "DAO"}
                </span>
              )}
              {job.cryptoPayment && (
                <span className={cn(CHIP, "bg-amber-500/15 text-amber-700 dark:text-amber-300")}>
                  <Coins className="size-3" aria-hidden />
                  {job.paymentTokens.length ? `Paid in ${job.paymentTokens.slice(0, 3).join("/")}` : "Crypto pay"}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {job.location.trim() || "Location not set"}
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Banknote className="size-4 text-muted-foreground" aria-hidden />
                {hasSalary ? formatJobSalary(job) : "Salary not specified"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-8 rounded-xl border border-border bg-card p-5 sm:p-6 lg:col-span-2">
          <Section title="About the role">
            <p className="text-sm leading-relaxed text-pretty whitespace-pre-line">
              {job.description.trim() || "No description yet."}
            </p>
          </Section>
          <Section title="Responsibilities">
            <BulletList items={job.responsibilities.filter((r) => r.trim())} empty="No responsibilities listed yet." />
          </Section>
          <Section title="Qualifications">
            <BulletList items={job.qualifications.filter((r) => r.trim())} empty="No qualifications listed yet." />
          </Section>
          <Section title="Required skills">
            {job.skills.length ? (
              <SkillTagList skills={job.skills} size="md" />
            ) : (
              <p className="text-sm text-muted-foreground">No skills added yet.</p>
            )}
          </Section>
          {job.benefits.some((b) => b.trim()) && (
            <Section title="Benefits & perks">
              <BulletList items={job.benefits.filter((r) => r.trim())} empty="" />
            </Section>
          )}
          {job.screeningQuestions.some((q) => q.trim()) && (
            <Section title="Screening questions">
              <ul className="space-y-2">
                {job.screeningQuestions
                  .filter((q) => q.trim())
                  .map((q, i) => (
                    <li key={`${q}-${i}`} className="flex items-start gap-2.5 text-sm text-pretty">
                      <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span>{q}</span>
                    </li>
                  ))}
              </ul>
            </Section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <Button variant="gradient" size="lg" className="w-full" disabled>
              Apply now
            </Button>
            <p className="text-center text-xs text-muted-foreground">Preview only: candidates will see this button.</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 border-t border-border pt-4 text-sm">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="text-right font-medium">{job.category || "—"}</dd>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="text-right font-medium">{job.type}</dd>
              <dt className="text-muted-foreground">Level</dt>
              <dd className="text-right font-medium">{job.experience}</dd>
              <dt className="text-muted-foreground">Network</dt>
              <dd className="text-right font-medium">{job.blockchain}</dd>
              <dt className="text-muted-foreground">Deadline</dt>
              <dd className="text-right font-medium">
                {job.deadline ? formatDate(job.deadline) : "—"}
                {deadlineDays !== null && deadlineDays >= 0 && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {deadlineDays === 0 ? "closes today" : `${deadlineDays} day${deadlineDays === 1 ? "" : "s"} left`}
                  </span>
                )}
              </dd>
              {job.isDao && job.contributorType && (
                <>
                  <dt className="text-muted-foreground">Contributor</dt>
                  <dd className="text-right font-medium">{job.contributorType}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <CompanyLogo company={company} size="md" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-heading font-semibold">
                  {company.name}
                  <VerifiedBadge verified={company.verified} />
                </p>
                <p className="truncate text-xs text-muted-foreground">{company.industry}</p>
              </div>
            </div>
            <p className="text-sm text-pretty text-muted-foreground">{company.tagline}</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <BriefcaseBusiness className="size-4 shrink-0" aria-hidden />
                {company.size} employees · founded {company.founded}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" aria-hidden />
                {company.location}
              </li>
              {company.website && (
                <li className="flex items-center gap-2">
                  <Globe className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{company.website.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                </li>
              )}
            </ul>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" aria-hidden />
              Posted by {company.name}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
