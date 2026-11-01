"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Clock, Loader2, MessageSquare, Sparkles, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SkillTagList } from "@/components/shared/skill-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatCurrency, formatDate, formatNumber, formatRelative, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Candidate, FreelanceProject, PaymentToken, Proposal } from "@/types";

const STABLE: PaymentToken[] = ["USD", "USDC", "DAI"];

/** "$4,200 USDC" or "$85 / hr" */
export function formatProposalPrice(price: number, currency: PaymentToken, hourly: boolean): string {
  const base = STABLE.includes(currency)
    ? formatCurrency(price, currency === "USD" ? "USD" : currency)
    : `${formatNumber(price, price < 100 ? 2 : 0)} ${currency}`;
  return hourly ? `${base} / hr` : base;
}

/** Share of the project's required skills the freelancer lists (0-100). */
export function skillMatchPercent(freelancer: Candidate | undefined, project: FreelanceProject | undefined): number | null {
  if (!freelancer || !project || project.skills.length === 0) return null;
  const owned = new Set(freelancer.skills.map((s) => s.toLowerCase()));
  const hits = project.skills.filter((s) => owned.has(s.toLowerCase())).length;
  return Math.round((hits / project.skills.length) * 100);
}

interface ProposalCardProps {
  proposal: Proposal;
  project?: FreelanceProject;
  freelancer?: Candidate;
  /** set when the proposal was accepted and a contract exists */
  contractHref?: string;
  /** why Accept is unavailable (renders disabled with a tooltip) */
  acceptBlockedReason?: string | null;
  busy?: boolean;
  onAccept: () => void;
  onReject: () => void;
  onMessage: () => void;
  className?: string;
}

export function ProposalCard({
  proposal,
  project,
  freelancer,
  contractHref,
  acceptBlockedReason = null,
  busy = false,
  onAccept,
  onReject,
  onMessage,
  className,
}: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hourly = project?.budgetType === "hourly";
  const match = useMemo(() => skillMatchPercent(freelancer, project), [freelancer, project]);
  const longLetter = proposal.coverLetter.length > 240;

  const budgetNote = useMemo(() => {
    if (!project) return null;
    if (hourly) {
      if (proposal.price < project.budgetMin) return { text: "Below the hourly range", tone: "text-success" };
      if (proposal.price <= project.budgetMax) return { text: "Within the hourly range", tone: "text-success" };
      return { text: "Above the hourly range", tone: "text-warning" };
    }
    if (proposal.price <= project.budgetMax) {
      const under = Math.round(((project.budgetMax - proposal.price) / project.budgetMax) * 100);
      return { text: under > 0 ? `${under}% under max budget` : "At max budget", tone: "text-success" };
    }
    const over = Math.round(((proposal.price - project.budgetMax) / project.budgetMax) * 100);
    return { text: `${over}% over max budget`, tone: "text-warning" };
  }, [project, hourly, proposal.price]);

  const matchTone =
    match === null ? "" : match >= 75 ? "bg-success/15 text-success ring-success/30" : match >= 40 ? "bg-info/15 text-info ring-info/30" : "bg-muted text-muted-foreground ring-border";

  const pending = proposal.status === "pending";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("space-y-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30", className)}
    >
      <div className="flex flex-wrap items-start gap-3">
        <UserAvatar name={freelancer?.name ?? "Freelancer"} src={freelancer?.avatar} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-heading text-base font-semibold">{freelancer?.name ?? "Unknown freelancer"}</h3>
            <StatusBadge status={proposal.status} context="generic" size="sm" />
          </div>
          {freelancer && <p className="text-sm text-muted-foreground">{freelancer.headline}</p>}
          {freelancer?.hourlyRate !== undefined && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Typical rate <span className="font-medium text-foreground">{formatCurrency(freelancer.hourlyRate, "USD")} / hr</span> ·{" "}
              {pluralize(freelancer.yearsOfExperience, "year")} experience
            </p>
          )}
        </div>
        {match !== null && (
          <span
            className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 ring-inset", matchTone)}
            title="Share of the project's required skills listed on the freelancer's profile"
          >
            <Sparkles className="size-3.5" aria-hidden />
            {match}% skill match
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <dt className="text-xs text-muted-foreground">{hourly ? "Proposed rate" : "Proposed price"}</dt>
          <dd className="mt-0.5 font-heading text-base font-semibold tabular-nums">
            {formatProposalPrice(proposal.price, proposal.currency, hourly)}
          </dd>
          {budgetNote && <dd className={cn("text-[11px]", budgetNote.tone)}>{budgetNote.text}</dd>}
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <dt className="text-xs text-muted-foreground">Delivery timeline</dt>
          <dd className="mt-0.5 flex items-center gap-1 font-heading text-base font-semibold">
            <Clock className="size-3.5 text-muted-foreground" aria-hidden />
            {pluralize(proposal.deliveryWeeks, "week")}
          </dd>
          {project && <dd className="text-[11px] text-muted-foreground">Project plans {pluralize(project.durationWeeks, "week")}</dd>}
        </div>
        <div className="col-span-2 rounded-lg border border-border bg-muted/30 p-3 sm:col-span-1">
          <dt className="text-xs text-muted-foreground">Submitted</dt>
          <dd className="mt-0.5 font-heading text-base font-semibold">{formatDate(proposal.submittedAt)}</dd>
          <dd className="text-[11px] text-muted-foreground">{formatRelative(proposal.submittedAt)}</dd>
        </div>
      </dl>

      {freelancer && freelancer.skills.length > 0 && (
        <SkillTagList skills={freelancer.skills} max={6} highlight={project?.skills} />
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground">Cover letter</p>
        <p className={cn("mt-1 text-sm text-pretty whitespace-pre-line", !expanded && longLetter && "line-clamp-3")}>{proposal.coverLetter}</p>
        {longLetter && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-1 rounded-sm text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {expanded ? "Show less" : "Read full proposal"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" size="sm" onClick={onMessage} disabled={busy || !freelancer}>
          <MessageSquare aria-hidden />
          Message
        </Button>
        {proposal.status === "accepted" && contractHref && (
          <Link href={contractHref} className={buttonVariants({ variant: "gradient", size: "sm" })}>
            Open contract
          </Link>
        )}
        {pending && (
          <>
            <Button variant="destructive" size="sm" onClick={onReject} disabled={busy}>
              <X aria-hidden />
              Reject
            </Button>
            {acceptBlockedReason ? (
              <Tooltip>
                <TooltipTrigger render={<span tabIndex={0} className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60" />}>
                  <Button variant="gradient" size="sm" disabled>
                    <Check aria-hidden />
                    Accept
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{acceptBlockedReason}</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="gradient" size="sm" onClick={onAccept} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                Accept
              </Button>
            )}
          </>
        )}
      </div>
    </motion.article>
  );
}
