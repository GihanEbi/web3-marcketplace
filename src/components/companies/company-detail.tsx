"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink, Globe, Layers, MapPin, ShieldAlert, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BountyCard } from "@/components/shared/bounty-card";
import { CompanyLogo } from "@/components/shared/company-logo";
import { EmptyState, NotFoundState } from "@/components/shared/empty-state";
import { JobCard } from "@/components/shared/job-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ProjectCard } from "@/components/shared/project-card";
import { SkillTagList } from "@/components/shared/skill-tag";
import { DemoOrgBadge, VerifiedBadge } from "@/components/shared/verified-badge";
import { DiscordIcon, GithubIcon, LinkedinIcon, XIcon } from "@/components/brand/brand-icons";
import { getPublicJobs } from "@/lib/job-filters";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCompany, useHydrated } from "@/store/hooks";

const CHIP = "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap";

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 font-heading text-xl font-semibold">
        {title}
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">{count}</span>
        )}
      </h2>
      {children}
    </section>
  );
}

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const company = useCompany(id);
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const bounties = useAppStore((s) => s.bounties);

  const openJobs = useMemo(
    () =>
      company && !company.suspended
        ? getPublicJobs(jobs, companies)
            .filter((j) => j.companyId === company.id)
            .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))
        : [],
    [jobs, companies, company],
  );
  const openProjects = useMemo(
    () => (company && !company.suspended ? projects.filter((p) => p.clientCompanyId === company.id && p.status === "open") : []),
    [projects, company],
  );
  const openBounties = useMemo(
    () => (company && !company.suspended ? bounties.filter((b) => b.daoId === company.id && b.status === "open") : []),
    [bounties, company],
  );

  if (!hydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }
  if (!company) {
    return (
      <div className="container mx-auto px-4 py-12">
        <NotFoundState entity="company" backHref="/companies" backLabel="Browse companies" />
      </div>
    );
  }

  const socials = [
    { key: "twitter", label: "X (Twitter)", href: company.social.twitter, icon: XIcon },
    { key: "github", label: "GitHub", href: company.social.github, icon: GithubIcon },
    { key: "linkedin", label: "LinkedIn", href: company.social.linkedin, icon: LinkedinIcon },
    { key: "discord", label: "Discord", href: company.social.discord, icon: DiscordIcon },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <div>
      <div
        className="relative h-40 overflow-hidden sm:h-52"
        style={{ backgroundImage: `linear-gradient(120deg, ${company.logoFrom}, ${company.logoTo})` }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto space-y-8 px-4 pb-12">
        <header className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end">
          <CompanyLogo company={company} size="xl" className="ring-4 ring-background" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{company.name}</h1>
              <VerifiedBadge verified={company.verified} showUnverified />
              {company.isDemo && <DemoOrgBadge />}
              {company.isDao && (
                <span className={cn(CHIP, "bg-violet-500/15 text-violet-700 dark:text-violet-300")}>
                  <Users className="size-3" aria-hidden />
                  DAO
                </span>
              )}
            </div>
            <p className="max-w-2xl text-pretty text-muted-foreground">{company.tagline}</p>
          </div>
          <Link href="/companies" className={cn(buttonVariants({ variant: "outline" }), "self-start sm:self-end")}>
            <ArrowLeft aria-hidden />
            All companies
          </Link>
        </header>

        {company.suspended && (
          <div role="status" className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="text-sm font-semibold">This company is currently suspended</p>
              <p className="text-sm text-muted-foreground">Its job listings, projects and bounties are hidden while the account is under review.</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="min-w-0 space-y-10">
            <Section title="About">
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{company.about || "This company hasn't added a description yet."}</p>
            </Section>

            {company.techStack.length > 0 && (
              <Section title="Technology stack">
                <SkillTagList skills={company.techStack} size="md" />
              </Section>
            )}

            {company.ecosystems.length > 0 && (
              <Section title="Blockchain ecosystems">
                <ul className="flex flex-wrap gap-2">
                  {company.ecosystems.map((e) => (
                    <li key={e} className={cn(CHIP, "bg-info/15 text-info")}>
                      <Layers className="size-3" aria-hidden />
                      {e}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Open positions" count={openJobs.length}>
              {openJobs.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {openJobs.map((j) => (
                    <JobCard key={j.id} job={j} company={company} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={company.suspended ? "Listings unavailable" : "No open positions right now"}
                  description={
                    company.suspended
                      ? "Job listings are hidden while this company is suspended."
                      : `${company.name} isn't hiring at the moment. Check back soon or browse other companies.`
                  }
                  action={
                    <Link href="/jobs" className={buttonVariants({ variant: "outline" })}>
                      Browse all jobs
                    </Link>
                  }
                />
              )}
            </Section>

            {openProjects.length > 0 && (
              <Section title="Freelance projects" count={openProjects.length}>
                <div className="grid gap-4 md:grid-cols-2">
                  {openProjects.map((p) => (
                    <ProjectCard key={p.id} project={p} client={company} />
                  ))}
                </div>
              </Section>
            )}

            {openBounties.length > 0 && (
              <Section title="Open bounties" count={openBounties.length}>
                <div className="grid gap-4 md:grid-cols-2">
                  {openBounties.map((b) => (
                    <BountyCard key={b.id} bounty={b} dao={company} />
                  ))}
                </div>
              </Section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20" aria-label="Company facts">
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading font-semibold">Company facts</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Layers className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <dt className="text-xs text-muted-foreground">Industry</dt>
                    <dd className="font-medium">{company.industry}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <dt className="text-xs text-muted-foreground">Headquarters</dt>
                    <dd className="font-medium">{company.location}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <dt className="text-xs text-muted-foreground">Company size</dt>
                    <dd className="font-medium">{company.size} people</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <dt className="text-xs text-muted-foreground">Founded</dt>
                    <dd className="font-medium">{company.founded}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Website</dt>
                    <dd>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1 rounded-sm font-medium hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
                      >
                        <span className="truncate">{company.website.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="size-3 shrink-0" aria-hidden />
                      </a>
                    </dd>
                  </div>
                </div>
              </dl>
              {socials.length > 0 && (
                <div className="flex gap-2 border-t border-border pt-4">
                  {socials.map(({ key, label, href, icon: Icon }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${company.name} on ${label}`}
                      title={label}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors outline-none hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <Icon className="size-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-heading font-semibold">{pluralize(openJobs.length, "open position")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {openJobs.length > 0 ? "Apply in minutes with your Chainhire profile." : "Follow this company by saving jobs from similar teams."}
              </p>
              {openJobs.length > 0 && (
                <Link href={`/jobs?q=${encodeURIComponent(company.name)}`} className={cn(buttonVariants({ variant: "gradient" }), "mt-4 w-full")}>
                  View all jobs
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
