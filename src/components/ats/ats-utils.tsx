"use client";

import { useMemo, type ReactNode } from "react";
import { format, isValid, parse, parseISO } from "date-fns";
import { ATS_STAGE_LABEL, ATS_STAGES } from "@/lib/constants";
import { appNow } from "@/lib/clock";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser } from "@/store/hooks";
import type { Application, ApplicationStatus, Candidate, Job } from "@/types";

export type AtsStage = (typeof ATS_STAGES)[number];

export const STAGE_OPTIONS = ATS_STAGES.map((stage) => ({ value: stage, label: ATS_STAGE_LABEL[stage] }));

export const INTERVIEW_TYPES = ["Intro call", "Technical", "System design", "Culture fit", "Final round"] as const;

export const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
];

/** Statuses that can still receive a (new) interview invitation */
export const SCHEDULABLE_STATUSES: ApplicationStatus[] = ["under_review", "shortlisted", "interview", "offered"];

export interface ApplicantRow {
  application: Application;
  candidate: Candidate;
  job: Job | undefined;
}

/** Applications that belong to the logged-in employer's company. */
export function useCompanyApplications(): Application[] {
  const user = useCurrentUser();
  const applications = useAppStore((s) => s.applications);
  return useMemo(
    () => (user?.companyId ? applications.filter((a) => a.companyId === user.companyId) : []),
    [applications, user],
  );
}

/** Joins applications with their candidate + job from the store. */
export function useApplicantRows(applications: Application[]): ApplicantRow[] {
  const candidates = useAppStore((s) => s.candidates);
  const jobs = useAppStore((s) => s.jobs);
  return useMemo(() => {
    const candidateById = new Map(candidates.map((c) => [c.id, c]));
    const jobById = new Map(jobs.map((j) => [j.id, j]));
    const rows: ApplicantRow[] = [];
    for (const application of applications) {
      const candidate = candidateById.get(application.candidateId);
      if (!candidate) continue;
      rows.push({ application, candidate, job: jobById.get(application.jobId) });
    }
    return rows;
  }, [applications, candidates, jobs]);
}

/* ------------------------------------------------------------------ */
/* Date helpers (local time, app clock)                                */
/* ------------------------------------------------------------------ */

/** Combine "yyyy-MM-dd" + "HH:mm" (local) into a Date, or null if invalid. */
export function parseLocalDateTime(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const value = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", appNow());
  return isValid(value) ? value : null;
}

export function toDateInput(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "yyyy-MM-dd") : "";
}

export function toTimeInput(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "HH:mm") : "";
}

/** "Mar 2023" from a "yyyy-MM" string */
export function formatMonth(value: string | null): string {
  if (!value) return "Present";
  const d = parseISO(`${value}-01`);
  return isValid(d) ? format(d, "MMM yyyy") : value;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ------------------------------------------------------------------ */
/* Tiny form field wrapper                                             */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
