"use client";

import { useMemo, type KeyboardEvent } from "react";
import { Briefcase, GripVertical, MapPin } from "lucide-react";
import { formatDate } from "@/lib/format";
import { computeMatch } from "@/lib/matching";
import { cn } from "@/lib/utils";
import type { Application, Candidate, Job } from "@/types";
import { AIMatchScore } from "./ai-match-score";
import { SkillTagList } from "./skill-tag";
import { StatusBadge } from "./status-badge";
import { UserAvatar } from "./user-avatar";

interface CandidateCardProps {
  candidate: Candidate;
  application?: Application;
  /** used to compute a match score when no application score exists */
  job?: Job;
  onOpen?: () => void;
  compact?: boolean;
  /** visual affordance for Kanban cards (grab cursor + grip); the DnD behaviour is attached by the parent */
  draggable?: boolean;
  className?: string;
}

export function CandidateCard({
  candidate,
  application,
  job,
  onOpen,
  compact = false,
  draggable = false,
  className,
}: CandidateCardProps) {
  const score = useMemo(() => {
    if (application) return application.matchScore;
    if (job) return computeMatch(candidate, job).score;
    return undefined;
  }, [application, job, candidate]);

  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (!onOpen || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  }

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={handleKey}
      aria-label={onOpen ? `Open ${candidate.name}'s application` : undefined}
      className={cn(
        "group relative rounded-xl border border-border bg-card text-left transition-[border-color,box-shadow]",
        compact ? "p-3" : "p-4",
        onOpen &&
          "cursor-pointer outline-none hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {draggable && (
          <GripVertical
            className="-ml-1.5 mt-2 size-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground"
            aria-hidden
          />
        )}
        <UserAvatar name={candidate.name} src={candidate.avatar} size={compact ? "sm" : "md"} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{candidate.name}</p>
          <p className="truncate text-xs text-muted-foreground">{candidate.headline}</p>
        </div>
        {score !== undefined && <AIMatchScore score={score} size="sm" />}
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            {candidate.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="size-3.5" aria-hidden />
            {candidate.yearsOfExperience} {candidate.yearsOfExperience === 1 ? "yr" : "yrs"} experience
          </span>
        </div>
      )}

      <SkillTagList
        skills={candidate.skills}
        max={compact ? 3 : 4}
        highlight={job ? job.skills : undefined}
        className="mt-3"
      />

      {(application || !compact) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          {application ? (
            <span className="text-xs text-muted-foreground">Applied {formatDate(application.appliedAt)}</span>
          ) : (
            <span />
          )}
          {application && !compact && <StatusBadge status={application.status} context="ats" size="sm" />}
        </div>
      )}
    </div>
  );
}
