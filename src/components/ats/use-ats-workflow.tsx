"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants";
import { startConversation, updateApplicationStatus } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser } from "@/store/hooks";
import type { ApplicationStatus } from "@/types";
import { ScheduleInterviewDialog } from "./schedule-interview-dialog";

export interface AtsWorkflow {
  /** Optimistic status overrides while a status update is in flight */
  pendingStatus: Record<string, ApplicationStatus>;
  /** Application whose "send message" request is in flight */
  messagingId: string | null;
  /**
   * Ask to move an application to a status. Rejecting asks for confirmation first and
   * "interview" opens the schedule dialog instead of changing anything immediately.
   */
  requestStatus: (applicationId: string, status: ApplicationStatus) => void;
  openSchedule: (applicationId: string) => void;
  messageCandidate: (applicationId: string) => Promise<void>;
  /** Render once: confirmation + schedule dialogs used by the actions above */
  dialogs: ReactNode;
}

/**
 * Shared recruiter actions (move stage, reject, schedule, message) used by the Kanban board,
 * the applicants table, the talent pool and the candidate sheet.
 */
export function useAtsWorkflow(): AtsWorkflow {
  const router = useRouter();
  const user = useCurrentUser();
  const applications = useAppStore((s) => s.applications);
  const candidates = useAppStore((s) => s.candidates);
  const jobs = useAppStore((s) => s.jobs);

  const [pendingStatus, setPendingStatus] = useState<Record<string, ApplicationStatus>>({});
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [reject, setReject] = useState<{ id: string | null; open: boolean }>({ id: null, open: false });
  const [schedule, setSchedule] = useState<{ id: string | null; open: boolean }>({ id: null, open: false });

  const nameOf = useCallback(
    (applicationId: string) => {
      const app = applications.find((a) => a.id === applicationId);
      return candidates.find((c) => c.id === app?.candidateId)?.name ?? "Candidate";
    },
    [applications, candidates],
  );

  const applyStatus = useCallback(
    async (applicationId: string, status: ApplicationStatus) => {
      setPendingStatus((p) => ({ ...p, [applicationId]: status }));
      try {
        await updateApplicationStatus(applicationId, status);
        toast.success(`${nameOf(applicationId)} moved to ${APPLICATION_STATUS_LABEL[status]}`, {
          description: "The candidate has been notified.",
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update the application");
      } finally {
        setPendingStatus((p) => {
          const next = { ...p };
          delete next[applicationId];
          return next;
        });
      }
    },
    [nameOf],
  );

  const requestStatus = useCallback(
    (applicationId: string, status: ApplicationStatus) => {
      const current = applications.find((a) => a.id === applicationId);
      if (!current || current.status === status) return;
      if (status === "rejected") setReject({ id: applicationId, open: true });
      else if (status === "interview") setSchedule({ id: applicationId, open: true });
      else void applyStatus(applicationId, status);
    },
    [applications, applyStatus],
  );

  const openSchedule = useCallback((applicationId: string) => setSchedule({ id: applicationId, open: true }), []);

  const messageCandidate = useCallback(
    async (applicationId: string) => {
      const app = applications.find((a) => a.id === applicationId);
      if (!app || !user?.companyId) return;
      const job = jobs.find((j) => j.id === app.jobId);
      setMessagingId(applicationId);
      try {
        const conversation = await startConversation({
          candidateId: app.candidateId,
          companyId: user.companyId,
          employerUserId: user.id,
          subject: `${job?.title ?? "Your"} application`,
          applicationId: app.id,
          jobId: app.jobId,
        });
        router.push(`/employer/messages?c=${conversation.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not open the conversation");
      } finally {
        setMessagingId(null);
      }
    },
    [applications, jobs, router, user],
  );

  const rejectApp = applications.find((a) => a.id === reject.id);
  const rejectJob = jobs.find((j) => j.id === rejectApp?.jobId);

  const dialogs = (
    <>
      <ConfirmationDialog
        open={reject.open}
        onOpenChange={(open) => setReject((s) => ({ ...s, open }))}
        title="Reject this candidate?"
        description={
          rejectApp
            ? `${nameOf(rejectApp.id)} will be moved to Rejected for ${rejectJob?.title ?? "this role"} and notified of the decision. You can move them back later.`
            : ""
        }
        confirmLabel="Reject candidate"
        destructive
        onConfirm={async () => {
          if (reject.id) await applyStatus(reject.id, "rejected");
        }}
      />
      <ScheduleInterviewDialog
        open={schedule.open}
        onOpenChange={(open) => setSchedule((s) => ({ ...s, open }))}
        applicationId={schedule.id}
      />
    </>
  );

  return { pendingStatus, messagingId, requestStatus, openSchedule, messageCandidate, dialogs };
}
