import { Ban, Check, CircleX, Undo2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, TimelineEvent } from "@/types";
import { statusLabel, statusTone, TONE_DOT, TONE_TEXT, type StatusTone } from "./status-badge";

type Context = "candidate" | "ats";

const HAPPY_PATH: ApplicationStatus[] = ["applied", "under_review", "shortlisted", "interview", "offered", "hired"];

const RING_BY_TONE: Record<StatusTone, string> = {
  success: "ring-success/30",
  warning: "ring-warning/35",
  info: "ring-info/30",
  danger: "ring-destructive/30",
  neutral: "ring-border",
  primary: "ring-primary/30",
};

interface ApplicationStatusTimelineProps {
  events: TimelineEvent[];
  currentStatus: ApplicationStatus;
  context?: Context;
  compact?: boolean;
  className?: string;
}

/** Vertical, oldest → newest. */
export function ApplicationStatusTimeline({
  events,
  currentStatus,
  context = "candidate",
  compact = false,
  className,
}: ApplicationStatusTimelineProps) {
  const ordered = [...events].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const lastIndex = ordered.length - 1;

  if (ordered.length === 0) {
    return <p className={cn("text-sm text-muted-foreground", className)}>No status updates yet.</p>;
  }

  return (
    <ol className={cn("relative", className)} aria-label="Application timeline">
      {ordered.map((event, index) => {
        const isLast = index === lastIndex;
        const tone = statusTone(event.status);
        const terminal = event.status === "rejected" || event.status === "withdrawn";
        const isCurrent = isLast && event.status === currentStatus;
        return (
          <li key={event.id} className={cn("relative flex gap-3", !isLast && (compact ? "pb-4" : "pb-6"))}>
            {!isLast && (
              <span
                aria-hidden
                className="absolute top-5 bottom-0 left-[9px] w-px bg-linear-to-b from-border to-border/40"
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                isCurrent || terminal ? TONE_DOT[tone] : "bg-muted-foreground/30",
                isCurrent && RING_BY_TONE[tone],
              )}
            >
              {terminal ? (
                event.status === "rejected" ? (
                  <CircleX className="size-3 text-white" />
                ) : (
                  <Undo2 className="size-3 text-white" />
                )
              ) : (
                <Check className={cn("size-3", isCurrent ? "text-white" : "text-card")} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCurrent || terminal ? TONE_TEXT[tone] : "text-foreground",
                  )}
                >
                  {statusLabel(event.status, context)}
                  {isCurrent && (
                    <span className="ml-2 align-middle text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      Current
                    </span>
                  )}
                </p>
                <time dateTime={event.at} className="text-xs text-muted-foreground">
                  {formatDateTime(event.at)}
                </time>
              </div>
              {!compact && event.note && (
                <p className="mt-1 text-sm text-pretty text-muted-foreground">{event.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal progress                                                 */
/* ------------------------------------------------------------------ */

interface ApplicationProgressBarProps {
  status: ApplicationStatus;
  context?: Context;
  className?: string;
}

export function ApplicationProgressBar({ status, context = "candidate", className }: ApplicationProgressBarProps) {
  if (status === "rejected" || status === "withdrawn") {
    const rejected = status === "rejected";
    const Icon = rejected ? Ban : Undo2;
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
          rejected
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-border bg-muted/50 text-muted-foreground",
          className,
        )}
      >
        <Icon className="size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{rejected ? "Application not progressed" : "Application withdrawn"}</p>
          <p className="text-xs opacity-80">
            {rejected
              ? "The hiring team decided not to move forward with this application."
              : "This application was withdrawn and is no longer being considered."}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = HAPPY_PATH.indexOf(status);

  return (
    <ol className={cn("grid grid-cols-6 gap-1", className)} aria-label="Application progress">
      {HAPPY_PATH.map((stage, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li
            key={stage}
            aria-current={current ? "step" : undefined}
            className="relative flex flex-col items-center gap-1.5 text-center"
          >
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-3 right-1/2 h-0.5 w-full -translate-y-1/2 rounded-full",
                  index <= currentIndex ? "bg-linear-to-r from-indigo-500 to-violet-500" : "bg-muted",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-6 items-center justify-center rounded-full text-[10px] font-semibold ring-4 ring-background",
                done && "bg-primary text-primary-foreground",
                current && "gradient-brand text-white shadow-md shadow-violet-500/40",
                !done && !current && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
            </span>
            <span
              className={cn(
                "text-[10px] leading-tight sm:text-xs",
                current ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {statusLabel(stage, context)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
