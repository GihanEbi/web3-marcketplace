import type { ReactNode } from "react";
import { Check, FileText } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types";
import { StatusBadge, TONE_DOT, statusTone } from "./status-badge";

/** Slim gradient progress bar (0-100). */
export function GradientProgress({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-indigo-500 via-violet-500 to-sky-500 transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
  token: string;
  renderActions?: (milestone: Milestone) => ReactNode;
  className?: string;
}

export function MilestoneTracker({ milestones, token, renderActions, className }: MilestoneTrackerProps) {
  const total = milestones.reduce((sum, m) => sum + m.amount, 0);
  const releasedMilestones = milestones.filter((m) => m.status === "released");
  const released = releasedMilestones.reduce((sum, m) => sum + m.amount, 0);
  const pct = total > 0 ? (released / total) * 100 : 0;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium">
            {releasedMilestones.length} of {milestones.length} milestones released
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{formatNumber(released, 2)}</span> / {formatNumber(total, 2)}{" "}
            {token}
          </p>
        </div>
        <GradientProgress value={pct} label="Funds released" />
      </div>

      <ol className="space-y-0">
        {milestones.map((milestone, index) => {
          const last = index === milestones.length - 1;
          const done = milestone.status === "released";
          const tone = statusTone(milestone.status);
          return (
            <li key={milestone.id} className="relative flex gap-4">
              {!last && (
                <span
                  aria-hidden
                  className={cn("absolute top-9 bottom-0 left-4 w-px", done ? "bg-success/50" : "bg-border")}
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-background",
                  done ? "bg-success text-white" : "bg-muted text-muted-foreground",
                  !done && milestone.status !== "pending" && cn(TONE_DOT[tone], "text-white"),
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <div className={cn("min-w-0 flex-1 pb-5", last && "pb-0")}>
                <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <h4 className="font-heading text-sm font-semibold">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="mt-0.5 text-sm text-pretty text-muted-foreground">{milestone.description}</p>
                      )}
                    </div>
                    <StatusBadge status={milestone.status} context="generic" size="sm" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                    <span className="font-heading font-semibold tabular-nums">
                      {formatNumber(milestone.amount, 2)} {token}
                    </span>
                    <span className="text-muted-foreground">Due {formatDate(milestone.dueDate)}</span>
                  </div>
                  {milestone.submissionNote && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-pretty text-muted-foreground">
                      <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      <p>
                        <span className="font-medium text-foreground">Submission:</span> {milestone.submissionNote}
                      </p>
                    </div>
                  )}
                  {renderActions && <div className="mt-3 flex flex-wrap items-center gap-2">{renderActions(milestone)}</div>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
