import { appNow } from "@/lib/clock";
import { isJobPublic } from "@/lib/job-filters";
import type { ApplicationStatus, Company, Job } from "@/types";

/** Application statuses in which a candidate may still withdraw. */
export const WITHDRAWABLE_STATUSES: ApplicationStatus[] = ["applied", "under_review", "shortlisted", "interview", "offered"];

/** Statuses counted as "pending" on the dashboard. */
export const PENDING_STATUSES: ApplicationStatus[] = ["applied", "under_review", "shortlisted"];

export function canWithdraw(status: ApplicationStatus): boolean {
  return WITHDRAWABLE_STATUSES.includes(status);
}

export function isDeadlinePassed(job: Job): boolean {
  const deadline = Date.parse(job.deadline);
  return Number.isFinite(deadline) && deadline < appNow().getTime();
}

/** Published, company not suspended and deadline not passed. */
export function acceptsApplications(job: Job, companies: Company[]): boolean {
  return isJobPublic(job, companies) && !isDeadlinePassed(job);
}

/** Why a job cannot be applied to (null when it can). */
export function applyBlockReason(job: Job, companies: Company[]): string | null {
  if (!isJobPublic(job, companies)) return "This job is no longer published, so it is not accepting applications.";
  if (isDeadlinePassed(job)) return "The application deadline for this job has passed.";
  return null;
}

/** sessionStorage key used to hand an AI cover-letter draft from /recommended-jobs to the apply flow. */
export function coverDraftKey(jobId: string): string {
  return `chainhire-cover-draft-${jobId}`;
}
