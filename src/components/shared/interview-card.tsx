"use client";

import { Ban, CalendarClock, CheckCheck, ExternalLink, MoreHorizontal, NotebookPen, Timer, UserRound, Video } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCandidate, useCompany, useJob } from "@/store/hooks";
import type { Interview } from "@/types";
import { CompanyLogo } from "./company-logo";
import { StatusBadge } from "./status-badge";
import { UserAvatar } from "./user-avatar";

interface InterviewCardProps {
  interview: Interview;
  viewer: "seeker" | "employer";
  onReschedule?: (interview: Interview) => void;
  onCancel?: (interview: Interview) => void;
  onComplete?: (interview: Interview) => void;
  onNotes?: (interview: Interview) => void;
  className?: string;
}

export function InterviewCard({
  interview,
  viewer,
  onReschedule,
  onCancel,
  onComplete,
  onNotes,
  className,
}: InterviewCardProps) {
  const candidate = useCandidate(interview.candidateId);
  const job = useJob(interview.jobId);
  const company = useCompany(interview.companyId);

  const scheduled = interview.status === "scheduled";
  const hasActions = scheduled && Boolean(onReschedule || onCancel || onComplete || onNotes);
  const notes = interview.notes.trim();

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-primary/30",
        scheduled && "border-l-2 border-l-primary",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {viewer === "employer" ? (
          candidate ? (
            <UserAvatar name={candidate.name} src={candidate.avatar} size="md" />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <UserRound className="size-5 text-muted-foreground" aria-hidden />
            </span>
          )
        ) : (
          company && <CompanyLogo company={company} size="md" />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-base font-semibold">
            {viewer === "employer" ? (candidate?.name ?? "Unknown candidate") : (company?.name ?? "Unknown company")}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {job?.title ?? "Role unavailable"}
            {viewer === "employer" && candidate ? ` · ${candidate.headline}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <StatusBadge status={interview.status} size="sm" />
          {hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label="Interview actions" />}
              >
                <MoreHorizontal aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {onReschedule && (
                  <DropdownMenuItem onClick={() => onReschedule(interview)}>
                    <CalendarClock aria-hidden />
                    Reschedule
                  </DropdownMenuItem>
                )}
                {onComplete && (
                  <DropdownMenuItem onClick={() => onComplete(interview)}>
                    <CheckCheck aria-hidden />
                    Mark complete
                  </DropdownMenuItem>
                )}
                {onNotes && (
                  <DropdownMenuItem onClick={() => onNotes(interview)}>
                    <NotebookPen aria-hidden />
                    Notes
                  </DropdownMenuItem>
                )}
                {onCancel && (onReschedule || onComplete || onNotes) && <DropdownMenuSeparator />}
                {onCancel && (
                  <DropdownMenuItem variant="destructive" onClick={() => onCancel(interview)}>
                    <Ban aria-hidden />
                    Cancel interview
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium">{formatDateTime(interview.scheduledAt)}</p>
            <p className="text-xs text-muted-foreground">{formatRelative(interview.scheduledAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2 text-[11px] font-medium text-primary">
            {interview.type}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Timer className="size-3.5" aria-hidden />
            {interview.durationMin} min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5" aria-hidden />
            {interview.interviewerName}
          </span>
        </div>
      </div>

      {notes && (
        <p className="mt-3 line-clamp-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-pretty text-muted-foreground">
          {notes}
        </p>
      )}

      {scheduled && interview.meetingLink && (
        <div className="mt-4">
          <a
            href={interview.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "gradient", size: "sm" })}
          >
            <Video aria-hidden />
            Join meeting
            <ExternalLink aria-hidden className="size-3" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      )}
    </article>
  );
}
