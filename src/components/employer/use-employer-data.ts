"use client";

import { useMemo } from "react";
import { addDays, format } from "date-fns";
import { appNow } from "@/lib/clock";
import { ATS_STAGES, ATS_STAGE_LABEL } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { useCurrentCompany } from "@/store/hooks";
import type { Application, ApplicationStatus, FreelanceProject, Interview, Job } from "@/types";

export interface PipelinePoint {
  status: ApplicationStatus;
  label: string;
  count: number;
}

export interface WeeklyPoint {
  label: string;
  applications: number;
}

export interface JobPerformance {
  job: Job;
  applications: number;
  shortlisted: number;
  avgMatch: number;
}

export interface EmployerStats {
  activeJobs: number;
  totalJobs: number;
  totalApplications: number;
  newApplicationsThisWeek: number;
  shortlisted: number;
  upcomingInterviews: number;
  openProjects: number;
}

const PIPELINE_STAGES = ATS_STAGES.filter((s) => s !== "rejected");
const WEEKS = 8;
const WEEK_MS = 7 * 86_400_000;

/**
 * Everything the employer dashboard needs, derived from the store for the logged-in company.
 * Re-computes whenever jobs / applications / interviews / projects change.
 */
export function useEmployerData() {
  const company = useCurrentCompany();
  const allJobs = useAppStore((s) => s.jobs);
  const allApplications = useAppStore((s) => s.applications);
  const allInterviews = useAppStore((s) => s.interviews);
  const allProjects = useAppStore((s) => s.projects);

  const companyId = company?.id;

  return useMemo(() => {
    const jobs: Job[] = allJobs.filter((j) => j.companyId === companyId);
    const applications: Application[] = allApplications.filter((a) => a.companyId === companyId);
    const interviews: Interview[] = allInterviews.filter((i) => i.companyId === companyId);
    const projects: FreelanceProject[] = allProjects.filter((p) => p.clientCompanyId === companyId);
    const now = appNow();
    const nowMs = now.getTime();

    const upcomingInterviews = interviews
      .filter((i) => i.status === "scheduled" && Date.parse(i.scheduledAt) >= nowMs)
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));

    const stats: EmployerStats = {
      activeJobs: jobs.filter((j) => j.status === "published").length,
      totalJobs: jobs.length,
      totalApplications: applications.length,
      newApplicationsThisWeek: applications.filter((a) => nowMs - Date.parse(a.appliedAt) <= WEEK_MS).length,
      shortlisted: applications.filter((a) => a.status === "shortlisted").length,
      upcomingInterviews: upcomingInterviews.length,
      openProjects: projects.filter((p) => p.status === "open").length,
    };

    const pipeline: PipelinePoint[] = PIPELINE_STAGES.map((status) => ({
      status,
      label: ATS_STAGE_LABEL[status],
      count: applications.filter((a) => a.status === status).length,
    }));

    const weekly: WeeklyPoint[] = Array.from({ length: WEEKS }, (_, i) => {
      const end = nowMs - (WEEKS - 1 - i) * WEEK_MS;
      const start = end - WEEK_MS;
      return {
        label: format(addDays(now, -(WEEKS - 1 - i) * 7), "MMM d"),
        applications: applications.filter((a) => {
          const t = Date.parse(a.appliedAt);
          return t > start && t <= end;
        }).length,
      };
    });
    // Anything newer than "now" (clock drift) still counts towards the latest week.
    weekly[WEEKS - 1].applications += applications.filter((a) => Date.parse(a.appliedAt) > nowMs).length;

    const jobPerformance: JobPerformance[] = jobs
      .map((job) => {
        const apps = applications.filter((a) => a.jobId === job.id);
        return {
          job,
          applications: apps.length,
          shortlisted: apps.filter((a) => a.status === "shortlisted" || a.status === "interview" || a.status === "offered" || a.status === "hired").length,
          avgMatch: apps.length ? Math.round(apps.reduce((sum, a) => sum + a.matchScore, 0) / apps.length) : 0,
        };
      })
      .filter((p) => p.applications > 0)
      .sort((a, b) => b.applications - a.applications || b.avgMatch - a.avgMatch);

    const recentApplications = [...applications]
      .sort((a, b) => Date.parse(b.appliedAt) - Date.parse(a.appliedAt))
      .slice(0, 6);

    return {
      jobs,
      applications,
      interviews,
      projects,
      upcomingInterviews,
      stats,
      pipeline,
      weekly,
      jobPerformance,
      recentApplications,
    };
  }, [allJobs, allApplications, allInterviews, allProjects, companyId]);
}

export type EmployerData = ReturnType<typeof useEmployerData>;
