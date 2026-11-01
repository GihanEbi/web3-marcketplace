"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  Briefcase,
  Code2,
  Crown,
  FlaskConical,
  Layers,
  Megaphone,
  Palette,
  ServerCog,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { CompanyCard } from "@/components/shared/company-card";
import { EmptyState } from "@/components/shared/empty-state";
import { JobCard } from "@/components/shared/job-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ProjectCard } from "@/components/shared/project-card";
import { JOB_CATEGORIES } from "@/lib/constants";
import { getPublicJobs } from "@/lib/job-filters";
import { pluralize } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  "Smart Contracts": Layers,
  "Frontend Engineering": Code2,
  "Backend Engineering": ServerCog,
  Security: ShieldCheck,
  "DevOps & Infrastructure": ServerCog,
  "Product & Design": Palette,
  "Engineering Leadership": Crown,
  "Data & Analytics": BarChart3,
  "Community & Growth": Megaphone,
  Research: FlaskConical,
};

/* ------------------------------------------------------------------ */
/* Featured jobs                                                       */
/* ------------------------------------------------------------------ */

export function FeaturedJobs() {
  const hydrated = useHydrated();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);

  const featured = useMemo(() => {
    const pub = getPublicJobs(jobs, companies).sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
    const flagged = pub.filter((j) => j.featured);
    // top up with the newest roles so the section is never sparse
    const rest = pub.filter((j) => !j.featured);
    return [...flagged, ...rest].slice(0, 6);
  }, [jobs, companies]);

  return (
    <section className="container mx-auto px-4 py-16 sm:py-20" aria-labelledby="featured-jobs">
      <SectionHeading
        eyebrow="Featured jobs"
        title={<span id="featured-jobs">Hand-picked roles from top Web3 teams</span>}
        description="Fresh openings from verified companies, ready to apply to in a couple of minutes."
        action={{ href: "/jobs", label: "Browse all jobs" }}
      />
      {!hydrated ? (
        <LoadingSkeleton variant="card" count={6} />
      ) : featured.length === 0 ? (
        <EmptyState title="No open jobs yet" description="Check back soon, employers publish new roles every day." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trending categories                                                 */
/* ------------------------------------------------------------------ */

export function JobCategories() {
  const hydrated = useHydrated();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const j of getPublicJobs(jobs, companies)) map.set(j.category, (map.get(j.category) ?? 0) + 1);
    return map;
  }, [jobs, companies]);

  const ordered = useMemo(
    () => [...JOB_CATEGORIES].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0)),
    [counts],
  );

  return (
    <section className="border-y border-border bg-muted/20" aria-labelledby="trending-categories">
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Explore by category"
          title={<span id="trending-categories">Trending Web3 job categories</span>}
          description="From auditing smart contracts to growing communities, find the discipline that fits you."
          align="center"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ordered.map((category, i) => {
            const Icon = CATEGORY_ICON[category] ?? Briefcase;
            const count = counts.get(category) ?? 0;
            return (
              <Reveal key={category} delay={Math.min(i, 5) * 0.03}>
                <Link
                  href={`/jobs?category=${encodeURIComponent(category)}`}
                  className="group flex h-full items-center gap-3 rounded-xl border border-border bg-card p-4 transition-[border-color,box-shadow,transform] outline-none hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-ring/60 lg:flex-col lg:items-start lg:gap-4"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500/20 to-violet-500/20 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold group-hover:text-primary">{category}</span>
                    <span className="block text-xs text-muted-foreground">{hydrated ? pluralize(count, "open job") : "Open jobs"}</span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Featured companies                                                  */
/* ------------------------------------------------------------------ */

export function FeaturedCompanies() {
  const hydrated = useHydrated();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);

  const featured = useMemo(() => {
    const open = new Map<string, number>();
    for (const j of getPublicJobs(jobs, companies)) open.set(j.companyId, (open.get(j.companyId) ?? 0) + 1);
    return companies
      .filter((c) => c.verified && !c.suspended)
      .sort((a, b) => (open.get(b.id) ?? 0) - (open.get(a.id) ?? 0) || a.name.localeCompare(b.name))
      .slice(0, 6)
      .map((company) => ({ company, openJobs: open.get(company.id) ?? 0 }));
  }, [jobs, companies]);

  return (
    <section className="container mx-auto px-4 py-16 sm:py-20" aria-labelledby="featured-companies">
      <SectionHeading
        eyebrow="Featured companies"
        title={<span id="featured-companies">Verified teams building the future</span>}
        description="Every verified organisation has been reviewed by the Chainhire team."
        action={{ href: "/companies", label: "Browse all companies" }}
      />
      {!hydrated ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : featured.length === 0 ? (
        <EmptyState title="No verified companies yet" description="Verified organisations will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(({ company, openJobs }) => (
            <CompanyCard key={company.id} company={company} activeJobs={openJobs} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Recent freelance projects                                           */
/* ------------------------------------------------------------------ */

export function RecentProjects() {
  const hydrated = useHydrated();
  const projects = useAppStore((s) => s.projects);

  const recent = useMemo(
    () =>
      projects
        .filter((p) => p.status === "open")
        .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))
        .slice(0, 3),
    [projects],
  );

  return (
    <section className="border-y border-border bg-muted/20" aria-labelledby="recent-projects">
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Freelance"
          title={<span id="recent-projects">Recent freelance projects</span>}
          description="Fixed-price and hourly contracts with milestone-based, escrow-backed payouts."
          action={{ href: "/projects", label: "View all projects" }}
        />
        {!hydrated ? (
          <LoadingSkeleton variant="card" count={3} />
        ) : recent.length === 0 ? (
          <EmptyState title="No open projects right now" description="New freelance work is posted every week." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
