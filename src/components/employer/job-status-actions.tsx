"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Eye,
  Loader2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Rocket,
  RotateCcw,
  Trash2,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { deleteJob, setJobStatus } from "@/services";
import type { Job, JobStatus } from "@/types";
import { notifyJobPendingApproval } from "./employer-services";

export type JobAction = "publish" | "pause" | "resume" | "close" | "reopen" | "delete";

export const JOB_ACTION_META: Record<JobAction, { label: string; icon: LucideIcon; destructive?: boolean }> = {
  publish: { label: "Publish", icon: Rocket },
  pause: { label: "Pause", icon: Pause },
  resume: { label: "Resume", icon: Play },
  close: { label: "Close job", icon: XCircle },
  reopen: { label: "Reopen", icon: RotateCcw },
  delete: { label: "Delete", icon: Trash2, destructive: true },
};

/** Which lifecycle actions an employer may run for a job in a given status. */
export function actionsFor(status: JobStatus): JobAction[] {
  switch (status) {
    case "draft":
      return ["publish", "delete"];
    case "published":
      return ["pause", "close", "delete"];
    case "paused":
      return ["resume", "close", "delete"];
    case "closed":
      return ["reopen", "delete"];
    case "rejected":
      return ["publish", "delete"];
    default:
      return ["delete"]; // pending, hidden
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

interface UseJobActionsOptions {
  onDeleted?: (job: Job) => void;
}

/**
 * Runs job lifecycle actions through the service layer with toasts, a pending flag and
 * confirmation dialogs for destructive ones. Render `dialogs` once next to the trigger UI.
 */
export function useJobActions(job: Job, { onDeleted }: UseJobActionsOptions = {}) {
  const [pending, setPending] = useState<JobAction | null>(null);
  const [confirm, setConfirm] = useState<"close" | "delete" | null>(null);

  async function execute(action: JobAction) {
    setPending(action);
    try {
      switch (action) {
        case "publish": {
          const updated = await setJobStatus(job.id, "published");
          if (updated.status === "pending") {
            notifyJobPendingApproval(updated);
            toast.info("Submitted for approval", {
              description: `“${job.title}” will go live once an admin approves it.`,
            });
          } else {
            toast.success("Job published", { description: `“${job.title}” is now visible on the public job board.` });
          }
          break;
        }
        case "pause":
          await setJobStatus(job.id, "paused");
          toast.success("Job paused", { description: "Candidates can no longer see or apply to this job." });
          break;
        case "resume":
          await setJobStatus(job.id, "published");
          toast.success("Job resumed", { description: `“${job.title}” is live again.` });
          break;
        case "reopen":
          await setJobStatus(job.id, "published");
          toast.success("Job reopened", { description: `“${job.title}” is accepting applications again.` });
          break;
        case "close":
          await setJobStatus(job.id, "closed");
          toast.success("Job closed", { description: "It no longer accepts applications." });
          break;
        case "delete":
          await deleteJob(job.id);
          toast.success("Job deleted", { description: `“${job.title}” was permanently removed.` });
          onDeleted?.(job);
          break;
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending(null);
    }
  }

  function request(action: JobAction) {
    if (action === "close" || action === "delete") setConfirm(action);
    else void execute(action);
  }

  const dialogs: ReactNode = (
    <>
      <ConfirmationDialog
        open={confirm === "close"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Close this job?"
        description={`“${job.title}” will stop accepting applications and disappear from the public job board. Existing applicants stay available.`}
        confirmLabel="Close job"
        onConfirm={() => execute("close")}
      />
      <ConfirmationDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Delete this job?"
        description={`“${job.title}” will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete job"
        destructive
        onConfirm={() => execute("delete")}
      />
    </>
  );

  return { pending, request, dialogs };
}

interface JobActionsMenuProps {
  job: Job;
  applicantCount?: number;
  onPreview?: (job: Job) => void;
}

/** Row action menu for the manage-jobs table. */
export function JobActionsMenu({ job, applicantCount, onPreview }: JobActionsMenuProps) {
  const { pending, request, dialogs } = useJobActions(job);
  const actions = actionsFor(job.status);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${job.title}`} />}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <MoreHorizontal aria-hidden />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {job.status === "published" ? (
            <DropdownMenuItem render={<Link href={`/jobs/${job.id}`} />}>
              <Eye aria-hidden />
              View public page
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onPreview?.(job)}>
              <Eye aria-hidden />
              Preview
            </DropdownMenuItem>
          )}
          <DropdownMenuItem render={<Link href={`/employer/jobs/${job.id}/edit`} />}>
            <Pencil aria-hidden />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/employer/jobs/${job.id}/applicants`} />}>
            <Users aria-hidden />
            Manage applicants
            {applicantCount !== undefined && (
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">{applicantCount}</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {actions.map((action) => {
            const meta = JOB_ACTION_META[action];
            const Icon = meta.icon;
            const label = action === "publish" && job.status === "rejected" ? "Resubmit for approval" : meta.label;
            return (
              <DropdownMenuItem
                key={action}
                variant={meta.destructive ? "destructive" : "default"}
                disabled={pending !== null}
                onClick={() => request(action)}
              >
                <Icon aria-hidden />
                {label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogs}
    </>
  );
}

interface JobActionButtonsProps {
  job: Job;
  /** actions to leave out (e.g. publish when the form already offers it) */
  exclude?: JobAction[];
  onDeleted?: (job: Job) => void;
}

/** Inline lifecycle buttons for the edit page (Pause / Resume / Close / Delete). */
export function JobActionButtons({ job, exclude = [], onDeleted }: JobActionButtonsProps) {
  const { pending, request, dialogs } = useJobActions(job, { onDeleted });
  const actions = actionsFor(job.status).filter((a) => !exclude.includes(a));

  return (
    <>
      {actions.map((action) => {
        const meta = JOB_ACTION_META[action];
        const Icon = meta.icon;
        const busy = pending === action;
        return (
          <Button
            key={action}
            type="button"
            variant={meta.destructive ? "destructive" : "outline"}
            onClick={() => request(action)}
            disabled={pending !== null}
          >
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Icon aria-hidden />}
            {meta.label}
          </Button>
        );
      })}
      {dialogs}
    </>
  );
}
