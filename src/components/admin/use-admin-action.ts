"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { moderateJob } from "@/services";
import type { Job } from "@/types";

/**
 * Runs an async admin service call with per-key pending state and consistent toasts.
 * Resolves to `true` when the call succeeded.
 */
export function useAdminAction() {
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);

  const run = useCallback(async (key: string, action: () => Promise<unknown>, success: string): Promise<boolean> => {
    setPendingKeys((keys) => (keys.includes(key) ? keys : [...keys, key]));
    try {
      await action();
      toast.success(success);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      return false;
    } finally {
      setPendingKeys((keys) => keys.filter((k) => k !== key));
    }
  }, []);

  const isPending = useCallback((key: string) => pendingKeys.includes(key), [pendingKeys]);

  return { run, isPending, anyPending: pendingKeys.length > 0 };
}

export type JobModerationAction = "approve" | "reject" | "hide" | "restore";

const MODERATION_SUCCESS: Record<JobModerationAction, (title: string) => string> = {
  approve: (title) => `"${title}" approved and now live. The employer was notified.`,
  reject: (title) => `"${title}" rejected. The employer was notified.`,
  hide: (title) => `"${title}" hidden from public listings.`,
  restore: (title) => `"${title}" restored and visible again.`,
};

export function jobActionKey(action: JobModerationAction, jobId: string): string {
  return `${action}:${jobId}`;
}

export function useModerateJob() {
  const { run, isPending, anyPending } = useAdminAction();
  const moderate = useCallback(
    (job: Pick<Job, "id" | "title">, action: JobModerationAction) =>
      run(jobActionKey(action, job.id), () => moderateJob(job.id, action), MODERATION_SUCCESS[action](job.title)),
    [run],
  );
  return { moderate, isPending, anyPending };
}
