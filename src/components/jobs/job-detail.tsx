"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  Globe,
  HelpCircle,
  Layers,
  Link2,
  MapPin,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { AIMatchScore } from "@/components/shared/ai-match-score";
import { deadlineLabel } from "@/components/shared/bounty-card";
import { CompanyLogo } from "@/components/shared/company-logo";
import { EmptyState, NotFoundState } from "@/components/shared/empty-state";
import { JobCard } from "@/components/shared/job-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SaveJobButton } from "@/components/shared/save-job-button";
import { SkillTagList } from "@/components/shared/skill-tag";
import { DemoOrgBadge, VerifiedBadge } from "@/components/shared/verified-badge";
import { formatDate, formatJobSalary, formatRelative } from "@/lib/format";
import { getPublicJobs } from "@/lib/job-filters";
import { computeMatch, matchLabel } from "@/lib/matching";
import { JOB_STATUS_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCompany, useCurrentCandidate, useCurrentUser, useHydrated, useJob } from "@/store/hooks";

const CHIP = "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap";

function Section({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-pretty text-muted-foreground">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Banner({ tone, title, children }: { tone: "warning" | "info" | "danger"; title: string; children?: ReactNode }) {
  const toneClass = {
    warning: "border-warning/40 bg-warning/10",
    info: "border-info/40 bg-info/10",
    danger: "border-destructive/40 bg-destructive/10",
  }[tone];
  return (
    <div role="status" className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between", toneClass)}>
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {children && <div className="mt-0.5 text-sm text-muted-foreground">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const job = useJob(id);
  const company = useCompany(job?.companyId);
  const user = useCurrentUser();
  const candidate = useCurrentCandidate();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const applications = useAppStore((s) => s.applications);

  const myApplication = useMemo(
    () =>
      candidate && job
        ? applications.find((a) => a.jobId === job.id && a.candidateId === candidate.id && a.status !== "withdrawn")
        : undefined,
    [applications, candidate, job],
  );

  const match = useMemo(() => (candidate && job ? computeMatch(candidate, job) : null), [candidate, job]);

  const related = useMemo(() => {
    if (!job) return [];
    const mine = new Set(job.skills.map((s) => s.toLowerCase()));
    return getPublicJobs(jobs, companies)
      .filter((j) => j.id !== job.id)
      .map((j) => ({
        job: j,
        score: (j.category === job.category ? 3 : 0) + j.skills.filter((s) => mine.has(s.toLowerCase())).length,
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || Date.parse(b.job.postedAt) - Date.parse(a.job.postedAt))
      .slice(0, 3)
      .map((x) => x.job);
  }, [job, jobs, companies]);

  if (!hydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-12">
        <NotFoundState entity="job" backHref="/jobs" backLabel="Browse all jobs" />
      </div>
    );
  }

  const isOwner = user?.role === "employer" && user.companyId === job.companyId;
  const isAdmin = user?.role === "admin";
  const suspended = Boolean(company?.suspended);
  const publiclyVisible = job.status === "published" && !suspended;

  if (!publiclyVisible && !isOwner && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <EmptyState
          title="This job is no longer available"
          description="The role has been filled, paused or removed by the employer. There are plenty of other open positions to explore."
          action={
            <Link href="/jobs" className={buttonVariants({ variant: "gradient" })}>
              <ArrowLeft aria-hidden />
              Browse open jobs
            </Link>
          }
        />
      </div>
    );
  }

  const deadline = deadlineLabel(job.deadline);
  const canApply = job.status === "published" && !deadline.expired && !suspended;
  const applyHref = `/jobs/${job.id}/apply`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Job link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  let applyAction: ReactNode;
  if (!user) {
    applyAction = (
      <Link href={`/login?next=${encodeURIComponent(applyHref)}`} className={cn(buttonVariants({ variant: "gradient", size: "lg" }), "w-full")}>
        {canApply ? "Log in to apply" : "Log in"}
      </Link>
    );
  } else if (user.role !== "seeker") {
    applyAction = (
      <>
        <Button size="lg" className="w-full" disabled>
          Apply Now
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {user.role === "employer" ? "Employer accounts can't apply to jobs." : "Admin accounts can't apply to jobs."} Switch to a job seeker account to apply.
        </p>
      </>
    );
  } else if (myApplication) {
    applyAction = (
      <>
        <Button size="lg" variant="secondary" className="w-full" disabled>
          <CheckCircle2 aria-hidden />
          Applied
        </Button>
        <Link href={`/applications/${myApplication.id}`} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
          View application
          <ArrowRight aria-hidden />
        </Link>
      </>
    );
  } else if (!canApply) {
    applyAction = (
      <Button size="lg" className="w-full" disabled>
        Applications closed
      </Button>
    );
  } else {
    applyAction = (
      <Link href={applyHref} className={cn(buttonVariants({ variant: "gradient", size: "lg" }), "w-full")}>
        Apply Now
        <ArrowRight aria-hidden />
      </Link>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to jobs
      </Link>

      {isOwner && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <BriefcaseBusiness className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold">This is your job posting</p>
              <p className="text-sm text-muted-foreground">
                Status: {JOB_STATUS_LABEL[job.status]}. This is how candidates see it.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/employer/jobs/${job.id}/applicants`} className={buttonVariants({ variant: "gradient", size: "sm" })}>
              Manage applicants
            </Link>
            <Link href={`/employer/jobs/${job.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Edit job
            </Link>
          </div>
        </div>
      )}
      {isAdmin && !publiclyVisible && (
        <Banner tone="info" title="Admin preview">
          This job is not publicly visible. Moderate it from{" "}
          <Link href="/admin/jobs" className="font-medium text-primary underline-offset-4 hover:underline">
            Admin · Jobs
          </Link>
          .
        </Banner>
      )}
      {job.status !== "published" && (
        <Banner tone="warning" title={`This job is ${JOB_STATUS_LABEL[job.status].toLowerCase()}`}>
          It is not listed publicly and can&apos;t receive applications right now.
        </Banner>
      )}
      {suspended && (
        <Banner tone="danger" title="This company is currently suspended">
          Its listings are hidden from the marketplace.
        </Banner>
      )}
      {job.status === "published" && deadline.expired && (
        <Banner tone="warning" title="Applications are closed">
          The application deadline passed on {formatDate(job.deadline)}.
        </Banner>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <header className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {company && <CompanyLogo company={company} size="lg" />}
              <div className="min-w-0 flex-1 space-y-1.5">
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{job.title}</h1>
                {company && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Link
                      href={`/companies/${company.id}`}
                      className="rounded-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      {company.name}
                    </Link>
                    <VerifiedBadge verified={company.verified} />
                    {company.isDemo && <DemoOrgBadge />}
                  </div>
                )}
              </div>
              <SaveJobButton jobId={job.id} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>{job.type}</span>
              <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>{job.workMode}</span>
              <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>{job.experience} level</span>
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
              {job.featured && (
                <span className={cn(CHIP, "bg-linear-to-r from-indigo-500/20 to-fuchsia-500/20 text-primary")}>
                  <Sparkles className="size-3" aria-hidden />
                  Featured
                </span>
              )}
            </div>

            <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Banknote className="mt-0.5 size-5 text-primary" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Compensation</dt>
                  <dd className="font-heading text-lg font-semibold">{formatJobSalary(job)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 text-primary" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Location</dt>
                  <dd className="font-medium">{job.location}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 text-primary" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Posted</dt>
                  <dd className="font-medium">
                    {formatRelative(job.postedAt)} <span className="text-muted-foreground">· {formatDate(job.postedAt)}</span>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-5 text-primary" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Apply by</dt>
                  <dd className="font-medium">
                    {formatDate(job.deadline)}{" "}
                    <span className={cn(deadline.expired ? "text-destructive" : deadline.urgent ? "text-warning" : "text-muted-foreground")}>
                      · {deadline.text}
                    </span>
                  </dd>
                </div>
              </div>
            </dl>

            {job.cryptoPayment && (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <Coins className="size-5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">Crypto payment available</p>
                  <p className="text-muted-foreground">
                    Receive your salary in{" "}
                    {job.paymentTokens.length > 0 ? job.paymentTokens.join(", ") : "tokens of your choice"} on {job.blockchain}.
                  </p>
                </div>
              </div>
            )}
          </header>

          <Section title="About the role">
            <div className="space-y-3 text-sm leading-relaxed text-pretty text-muted-foreground">
              {job.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </Section>

          {job.isDao && (
            <Section title="DAO contributor details" icon={<Users className="size-5 text-violet-500" aria-hidden />}>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {job.daoName && (
                  <span className={cn(CHIP, "bg-violet-500/15 text-violet-700 dark:text-violet-300")}>{job.daoName}</span>
                )}
                {job.contributorType && <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>{job.contributorType}</span>}
                <p className="text-muted-foreground">
                  This role is run by a decentralised organisation. Compensation and governance rights follow the DAO&apos;s contributor framework.
                </p>
              </div>
            </Section>
          )}

          {job.responsibilities.length > 0 && (
            <Section title="Responsibilities">
              <BulletList items={job.responsibilities} />
            </Section>
          )}
          {job.qualifications.length > 0 && (
            <Section title="Qualifications">
              <BulletList items={job.qualifications} />
            </Section>
          )}

          <Section title="Required skills">
            <SkillTagList
              skills={job.skills}
              size="md"
              highlight={match?.matchingSkills}
              missing={match?.missingSkills}
            />
            {match && (
              <p className="mt-3 text-xs text-muted-foreground">
                Green skills are on your profile; dashed skills are gaps you could close.
              </p>
            )}
          </Section>

          {job.benefits.length > 0 && (
            <Section title="Benefits & perks">
              <BulletList items={job.benefits} />
            </Section>
          )}

          {job.screeningQuestions.length > 0 && (
            <Section title="Screening questions" icon={<HelpCircle className="size-5 text-primary" aria-hidden />}>
              <p className="mb-3 text-sm text-muted-foreground">You&apos;ll be asked to answer these when you apply.</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground marker:font-semibold marker:text-foreground">
                {job.screeningQuestions.map((q) => (
                  <li key={q} className="pl-1 text-pretty">
                    {q}
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20" aria-label="Apply and company information">
          <div className="space-y-3 rounded-xl border border-border bg-card p-5 card-glow">
            <div>
              <p className="font-heading text-xl font-semibold">{formatJobSalary(job)}</p>
              <p className={cn("text-sm", deadline.expired ? "text-destructive" : "text-muted-foreground")}>{deadline.text} to apply</p>
            </div>
            {applyAction}
            <SaveJobButton jobId={job.id} variant="button" className="w-full" />
            <Button type="button" variant="ghost" className="w-full" onClick={copyLink}>
              <Link2 aria-hidden />
              Copy job link
            </Button>
          </div>

          {match && candidate && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-4">
                <AIMatchScore score={match.score} size="md" />
                <div>
                  <p className="text-sm font-semibold">{matchLabel(match.score)} match for you</p>
                  <p className="text-xs text-muted-foreground">
                    {match.matchingSkills.length} of {job.skills.length} required skills
                  </p>
                </div>
              </div>
              <p className="text-xs text-pretty text-muted-foreground">{match.explanation}</p>
            </div>
          )}

          {company && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <CompanyLogo company={company} size="md" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-heading font-semibold">
                    <span className="truncate">{company.name}</span>
                    <VerifiedBadge verified={company.verified} />
                  </p>
                  <p className="text-xs text-muted-foreground">{company.industry}</p>
                </div>
              </div>
              <p className="line-clamp-4 text-sm text-pretty text-muted-foreground">{company.about || company.tagline}</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Users className="size-4 shrink-0" aria-hidden />
                  {company.size} employees
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  {company.location}
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="size-4 shrink-0" aria-hidden />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 rounded-sm truncate hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
                  >
                    <span className="truncate">{company.website.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                </li>
              </ul>
              <SkillTagList skills={company.techStack} max={6} />
              <Link href={`/companies/${company.id}`} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                <Building2 aria-hidden />
                View company
              </Link>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-jobs" className="space-y-4 pt-4">
          <div className="flex items-end justify-between gap-3">
            <h2 id="related-jobs" className="font-heading text-xl font-semibold">
              Related jobs
            </h2>
            <Link href={`/jobs?category=${encodeURIComponent(job.category)}`} className="text-sm font-medium text-primary hover:underline">
              More in {job.category}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {related.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
