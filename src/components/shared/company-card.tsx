"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, MapPin, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { Company, Job } from "@/types";
import { CompanyLogo } from "./company-logo";
import { SkillTagList } from "./skill-tag";
import { DemoOrgBadge, VerifiedBadge } from "./verified-badge";

interface CompanyCardProps {
  company: Company;
  /** defaults to the number of published jobs of this company in the store */
  activeJobs?: number;
  className?: string;
}

export function CompanyCard({ company, activeJobs, className }: CompanyCardProps) {
  const jobs = useAppStore((s) => s.jobs);
  const openJobs = useMemo(
    () => activeJobs ?? jobs.filter((j: Job) => j.companyId === company.id && j.status === "published").length,
    [activeJobs, jobs, company.id],
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={cn(
        "group flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo company={company} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="min-w-0 truncate font-heading text-base font-semibold">
              <Link
                href={`/companies/${company.id}`}
                className="rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {company.name}
              </Link>
            </h3>
            <VerifiedBadge verified={company.verified} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{company.industry}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {company.isDemo && <DemoOrgBadge />}
            {company.isDao && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-violet-500/15 px-2 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                <Users className="size-3" aria-hidden />
                DAO
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-pretty text-muted-foreground">{company.tagline}</p>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{company.location}</span>
      </div>

      <SkillTagList skills={company.techStack} max={4} />

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Briefcase className="size-3.5 text-primary" aria-hidden />
          {pluralize(openJobs, "open job")}
        </span>
        <Link href={`/companies/${company.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          View company
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </motion.article>
  );
}
