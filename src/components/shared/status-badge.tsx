import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "info" | "danger" | "neutral" | "primary";
export type StatusContext = "candidate" | "ats" | "job" | "generic";

/** Semantic tone → badge classes (shared by other components). */
export const TONE_BADGE: Record<StatusTone, string> = {
  success: "bg-success/15 text-success ring-success/30",
  warning:
    "bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_40%)] ring-warning/35 dark:text-warning",
  info: "bg-info/15 text-info ring-info/30",
  danger: "bg-destructive/15 text-destructive ring-destructive/30",
  neutral: "bg-muted text-muted-foreground ring-border",
  primary: "bg-primary/15 text-primary ring-primary/30",
};

export const TONE_DOT: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-destructive",
  neutral: "bg-muted-foreground/60",
  primary: "bg-primary",
};

export const TONE_TEXT: Record<StatusTone, string> = {
  success: "text-success",
  warning: "text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning",
  info: "text-info",
  danger: "text-destructive",
  neutral: "text-muted-foreground",
  primary: "text-primary",
};

interface StatusMeta {
  label: string;
  tone: StatusTone;
  /** show a coloured dot (pulses for in-flight states) */
  dot?: boolean;
}

/**
 * One central map for every status string used in the app.
 * Keys that exist in several domains (e.g. "open", "closed", "pending") share one entry.
 */
const STATUS_META: Record<string, StatusMeta> = {
  // ApplicationStatus
  applied: { label: "Applied", tone: "info", dot: true },
  under_review: { label: "Under Review", tone: "warning", dot: true },
  shortlisted: { label: "Shortlisted", tone: "primary", dot: true },
  interview: { label: "Interview", tone: "primary", dot: true },
  offered: { label: "Offered", tone: "success", dot: true },
  hired: { label: "Hired", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
  // JobStatus
  draft: { label: "Draft", tone: "neutral" },
  pending: { label: "Pending approval", tone: "warning", dot: true },
  published: { label: "Published", tone: "success", dot: true },
  paused: { label: "Paused", tone: "warning" },
  closed: { label: "Closed", tone: "neutral" },
  hidden: { label: "Hidden", tone: "neutral" },
  // InterviewStatus
  scheduled: { label: "Scheduled", tone: "info", dot: true },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  rescheduled: { label: "Rescheduled", tone: "warning" },
  // ProposalStatus
  accepted: { label: "Accepted", tone: "success" },
  // ProjectStatus / bounty / report
  open: { label: "Open", tone: "info", dot: true },
  in_progress: { label: "In progress", tone: "info", dot: true },
  in_review: { label: "In review", tone: "warning", dot: true },
  // MilestoneStatus
  funded: { label: "Funded", tone: "info" },
  submitted: { label: "Submitted", tone: "warning", dot: true },
  approved: { label: "Approved", tone: "primary" },
  released: { label: "Released", tone: "success" },
  // AccountStatus / contract
  active: { label: "Active", tone: "success", dot: true },
  suspended: { label: "Suspended", tone: "danger" },
  // ReportStatus
  resolved: { label: "Resolved", tone: "success" },
  dismissed: { label: "Dismissed", tone: "neutral" },
  // transaction
  confirmed: { label: "Confirmed", tone: "success" },
  // subscription
  trialing: { label: "Trialing", tone: "info", dot: true },
};

function humanise(status: string): string {
  const spaced = status.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function metaFor(status: string): StatusMeta {
  return STATUS_META[status] ?? { label: humanise(status), tone: "neutral" };
}

/**
 * Display label for a status.
 * - `context="ats"`  → `under_review` reads "Screening"
 * - `context="generic"` → `pending` reads "Pending" (default reads "Pending approval", the job meaning)
 */
export function statusLabel(status: string, context?: StatusContext): string {
  if (status === "under_review" && context === "ats") return "Screening";
  if (status === "pending" && context === "generic") return "Pending";
  return metaFor(status).label;
}

export function statusTone(status: string): StatusTone {
  return metaFor(status).tone;
}

interface StatusBadgeProps {
  status: string;
  label?: string;
  context?: StatusContext;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, label, context, size = "md", className }: StatusBadgeProps) {
  const meta = metaFor(status);
  const text = label ?? statusLabel(status, context);
  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring-1 ring-inset",
        size === "sm" ? "h-5 px-2 text-[11px]" : "h-6 px-2.5 text-xs",
        TONE_BADGE[meta.tone],
        className,
      )}
    >
      {meta.dot && <span aria-hidden className={cn("size-1.5 rounded-full", TONE_DOT[meta.tone])} />}
      {text}
    </span>
  );
}
