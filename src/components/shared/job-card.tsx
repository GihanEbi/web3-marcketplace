"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Banknote, Check, Clock, Coins, Layers, MapPin, Sparkles, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatJobSalary, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCompany, useCurrentCandidate, useHydrated } from "@/store/hooks";
import type { Application, Company, Job } from "@/types";
import { scoreTone } from "./ai-match-score";
import { CompanyLogo } from "./company-logo";
import { SaveJobButton } from "./save-job-button";
import { SkillTagList } from "./skill-tag";
import { StatusBadge } from "./status-badge";
import { VerifiedBadge } from "./verified-badge";

interface JobCardProps {
  job: Job;
  company?: Company;
  variant?: "grid" | "list";
  /** optional match percentage (0-100) shown as a badge */
  match?: number;
  showActions?: boolean;
  className?: string;
}

const CHIP = "inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium whitespace-nowrap";

function CryptoBadge({ tokens }: { tokens: string[] }) {
  const short = tokens.slice(0, 2).join("/");
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} />}
        className={cn(CHIP, "bg-amber-500/15 text-amber-700 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 dark:text-amber-300")}
      >
        <Coins className="size-3" aria-hidden />
        {short ? `Paid in ${short}` : "Crypto pay"}
      </TooltipTrigger>
      <TooltipContent>{tokens.length > 0 ? `Accepted tokens: ${tokens.join(", ")}` : "Paid in crypto"}</TooltipContent>
    </Tooltip>
  );
}

export function JobCard({ job, company, variant = "grid", match, showActions = true, className }: JobCardProps) {
  const hydrated = useHydrated();
  const storeCompany = useCompany(company ? undefined : job.companyId);
  const co = company ?? storeCompany;
  const candidate = useCurrentCandidate();
  const applications = useAppStore((s) => s.applications);

  const applied = useMemo(
    () =>
      hydrated && candidate
        ? applications.some((a: Application) => a.jobId === job.id && a.candidateId === candidate.id && a.status !== "withdrawn")
        : false,
    [hydrated, candidate, applications, job.id],
  );

  const isList = variant === "list";
  const matchTone = match !== undefined ? scoreTone(match) : null;

  const logo = co ? (
    <CompanyLogo company={co} size={isList ? "lg" : "md"} />
  ) : (
    <Skeleton className={cn("shrink-0 rounded-xl", isList ? "size-14" : "size-11")} />
  );

  const titleBlock = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="min-w-0 font-heading text-base leading-snug font-semibold">
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {job.title}
          </Link>
        </h3>
        {job.status !== "published" && <StatusBadge status={job.status} size="sm" />}
        {job.featured && (
          <span className={cn(CHIP, "bg-linear-to-r from-indigo-500/20 to-fuchsia-500/20 text-primary")}>
            <Sparkles className="size-3" aria-hidden />
            Featured
          </span>
        )}
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {co ? (
          <>
            <Link
              href={`/companies/${co.id}`}
              className="truncate rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {co.name}
            </Link>
            <VerifiedBadge verified={co.verified} />
          </>
        ) : (
          <Skeleton className="h-4 w-28" />
        )}
      </div>
    </div>
  );

  const badges = (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>{job.workMode}</span>
      <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>{job.type}</span>
      <span className={cn(CHIP, "bg-secondary text-secondary-foreground")}>{job.experience}</span>
      {job.isDao && (
        <span className={cn(CHIP, "bg-violet-500/15 text-violet-700 dark:text-violet-300")}>
          <Users className="size-3" aria-hidden />
          {job.daoName ? `DAO · ${job.daoName}` : "DAO"}
        </span>
      )}
      {job.blockchain && (
        <span className={cn(CHIP, "bg-info/15 text-info")}>
          <Layers className="size-3" aria-hidden />
          {job.blockchain}
        </span>
      )}
    </div>
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        {job.location}
      </span>
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        <Banknote className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        {formatJobSalary(job)}
      </span>
      {job.cryptoPayment && <CryptoBadge tokens={job.paymentTokens} />}
    </div>
  );

  const posted = (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="size-3" aria-hidden />
      Posted {formatRelative(job.postedAt)}
    </span>
  );

  const actions = showActions && (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/jobs/${job.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        View details
      </Link>
      {applied ? (
        <Button size="sm" variant="secondary" disabled>
          <Check aria-hidden />
          Applied
        </Button>
      ) : (
        job.status === "published" && (
          <Link href={`/jobs/${job.id}/apply`} className={buttonVariants({ variant: "gradient", size: "sm" })}>
            Apply
          </Link>
        )
      )}
    </div>
  );

  const matchBadge = matchTone && match !== undefined && (
    <span className={cn(CHIP, "ring-1 ring-inset", matchTone.chip)}>
      <Sparkles className="size-3" aria-hidden />
      {Math.round(match)}% match
    </span>
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative flex rounded-xl border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        isList ? "flex-col gap-4 md:flex-row md:items-center md:gap-6" : "h-full flex-col gap-4",
        job.featured && "border-primary/25",
        className,
      )}
    >
      {isList ? (
        <>
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {logo}
            <div className="min-w-0 flex-1 space-y-3">
              {titleBlock}
              {badges}
              {meta}
              <SkillTagList skills={job.skills} max={4} />
            </div>
          </div>
          <div className="flex shrink-0 flex-row items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
            <div className="flex items-center gap-2">
              {matchBadge}
              <SaveJobButton jobId={job.id} />
            </div>
            {posted}
            {actions}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start gap-3">
            {logo}
            {titleBlock}
            <SaveJobButton jobId={job.id} className="-mt-1 -mr-1.5" />
          </div>
          {badges}
          {meta}
          <SkillTagList skills={job.skills} max={4} />
          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              {posted}
              {matchBadge}
            </div>
            {actions}
          </div>
        </>
      )}
    </motion.article>
  );
}

export function JobCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5",
        variant === "list" ? "flex items-center gap-4" : "space-y-4",
      )}
    >
      <div className="flex flex-1 items-start gap-3">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          {variant === "list" && <Skeleton className="h-3 w-2/3" />}
        </div>
      </div>
      {variant === "grid" && (
        <>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex justify-between border-t border-border pt-4">
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </>
      )}
      {variant === "list" && <Skeleton className="h-8 w-24 rounded-lg" />}
    </div>
  );
}
