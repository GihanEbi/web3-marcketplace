"use client";

import { delay } from "@/services";
import { useAppStore } from "@/store/app-store";
import type { Company, Job } from "@/types";

/**
 * Small service-like helpers for the employer area that sit on top of the store's
 * notification mechanism (no dedicated API exists for them in `src/services`).
 */

export const verificationRequestTitle = (company: Pick<Company, "name">) => `Verification request: ${company.name}`;

/** Ask the admins to verify a company. Resolves once the (simulated) request was filed. */
export async function requestCompanyVerification(company: Company): Promise<void> {
  await delay(600);
  useAppStore.getState().pushNotification({
    role: "admin",
    type: "system",
    title: verificationRequestTitle(company),
    body: `${company.name} (${company.website || "no website"}) asked to be verified.`,
    href: "/admin/companies",
  });
}

/** Tell the admins a job entered the approval queue (store actions other than `createJob` do not do this). */
export function notifyJobPendingApproval(job: Pick<Job, "title">): void {
  useAppStore.getState().pushNotification({
    role: "admin",
    type: "system",
    title: "Job awaiting approval",
    body: `${job.title} was submitted for review.`,
    href: "/admin/jobs",
  });
}
