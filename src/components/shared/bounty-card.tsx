"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarClock, Layers } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { daysUntil, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCompany } from "@/store/hooks";
import type { Bounty, Company } from "@/types";
import { CompanyLogo } from "./company-logo";
import { SkillTagList } from "./skill-tag";
import { StatusBadge } from "./status-badge";
import { VerifiedBadge } from "./verified-badge";

/** "12 days left" / "Due today" / "Expired" */
export function deadlineLabel(deadline: string): { text: string; expired: boolean; urgent: boolean } {
  const days = daysUntil(deadline);
  if (days < 0) return { text: "Expired", expired: true, urgent: false };
  if (days === 0) return { text: "Due today", expired: false, urgent: true };
  return { text: `${days} ${days === 1 ? "day" : "days"} left`, expired: false, urgent: days <= 3 };
}

interface BountyCardProps {
  bounty: Bounty;
  dao?: Company;
  className?: string;
}

export function BountyCard({ bounty, dao, className }: BountyCardProps) {
  const storeDao = useCompany(dao ? undefined : bounty.daoId);
  const org = dao ?? storeDao;
  const deadline = deadlineLabel(bounty.deadline);

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
        {org && <CompanyLogo company={org} size="md" />}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base leading-snug font-semibold">
            <Link
              href={`/bounties/${bounty.id}`}
              className="rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {bounty.title}
            </Link>
          </h3>
          {org && (
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link
                href={`/companies/${org.id}`}
                className="truncate rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {org.name}
              </Link>
              <VerifiedBadge verified={org.verified} />
            </div>
          )}
        </div>
        <StatusBadge status={bounty.status} size="sm" />
      </div>

      <div className="rounded-lg border border-primary/15 bg-linear-to-br from-indigo-500/10 via-violet-500/5 to-transparent px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">Reward</p>
        <p className="font-heading text-2xl font-bold tracking-tight tabular-nums">
          <span className="gradient-text">{formatNumber(bounty.rewardAmount)}</span>{" "}
          <span className="text-base font-semibold text-muted-foreground">{bounty.token}</span>
        </p>
      </div>

      <SkillTagList skills={bounty.skills} max={4} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Layers className="size-3.5" aria-hidden />
          {bounty.blockchain}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            deadline.expired && "text-destructive",
            deadline.urgent && "font-medium text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning",
          )}
        >
          <CalendarClock className="size-3.5" aria-hidden />
          {deadline.text}
        </span>
      </div>

      <div className="mt-auto flex justify-end border-t border-border pt-4">
        <Link href={`/bounties/${bounty.id}`} className={buttonVariants({ variant: "gradient", size: "sm" })}>
          Submit interest
        </Link>
      </div>
    </motion.article>
  );
}
