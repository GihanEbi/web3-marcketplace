import { annualUsd, computeMatch } from "@/lib/matching";
import type { Blockchain, Candidate, Company, EmploymentType, ExperienceLevel, Job, WorkMode } from "@/types";

export type JobSort = "newest" | "relevance" | "salary";

export interface JobFilters {
  query: string;
  category: string; // "" = any
  location: string;
  workModes: WorkMode[];
  types: EmploymentType[];
  experience: ExperienceLevel[];
  /** minimum annual USD-equivalent salary, 0 = any */
  minSalary: number;
  ecosystems: Blockchain[];
  skills: string[];
  cryptoOnly: boolean;
  sort: JobSort;
}

export const DEFAULT_JOB_FILTERS: JobFilters = {
  query: "",
  category: "",
  location: "",
  workModes: [],
  types: [],
  experience: [],
  minSalary: 0,
  ecosystems: [],
  skills: [],
  cryptoOnly: false,
  sort: "newest",
};

/** A job is publicly visible when published and its company is not suspended */
export function isJobPublic(job: Job, companies: Company[]): boolean {
  if (job.status !== "published") return false;
  const company = companies.find((c) => c.id === job.companyId);
  return company ? !company.suspended : true;
}

export function getPublicJobs(jobs: Job[], companies: Company[]): Job[] {
  return jobs.filter((j) => isJobPublic(j, companies));
}

export function filterAndSortJobs(
  jobs: Job[],
  companies: Company[],
  filters: JobFilters,
  candidate?: Candidate | null,
): Job[] {
  const q = filters.query.trim().toLowerCase();
  const loc = filters.location.trim().toLowerCase();
  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "";

  const filtered = jobs.filter((job) => {
    if (q) {
      const haystack = [job.title, companyName(job.companyId), job.category, ...job.skills, job.description]
        .join(" ")
        .toLowerCase();
      if (!q.split(/\s+/).every((term) => haystack.includes(term))) return false;
    }
    if (filters.category && job.category !== filters.category) return false;
    if (loc && !job.location.toLowerCase().includes(loc) && !(loc === "remote" && job.workMode === "Remote")) return false;
    if (filters.workModes.length && !filters.workModes.includes(job.workMode)) return false;
    if (filters.types.length && !filters.types.includes(job.type)) return false;
    if (filters.experience.length && !filters.experience.includes(job.experience)) return false;
    if (filters.minSalary > 0 && annualUsd(job.salaryMax, job.currency, job.salaryPeriod) < filters.minSalary) return false;
    if (filters.ecosystems.length && !filters.ecosystems.includes(job.blockchain)) return false;
    if (filters.skills.length && !filters.skills.every((s) => job.skills.some((js) => js.toLowerCase() === s.toLowerCase()))) return false;
    if (filters.cryptoOnly && !job.cryptoPayment) return false;
    return true;
  });

  const sorted = [...filtered];
  if (filters.sort === "salary") {
    sorted.sort(
      (a, b) =>
        annualUsd(b.salaryMax, b.currency, b.salaryPeriod) - annualUsd(a.salaryMax, a.currency, a.salaryPeriod),
    );
  } else if (filters.sort === "relevance") {
    if (candidate) {
      const scores = new Map(sorted.map((j) => [j.id, computeMatch(candidate, j).score]));
      sorted.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
    } else {
      sorted.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || Date.parse(b.postedAt) - Date.parse(a.postedAt),
      );
    }
  } else {
    sorted.sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
  }
  return sorted;
}

export function countActiveFilters(f: JobFilters): number {
  return (
    (f.query ? 1 : 0) +
    (f.category ? 1 : 0) +
    (f.location ? 1 : 0) +
    f.workModes.length +
    f.types.length +
    f.experience.length +
    (f.minSalary > 0 ? 1 : 0) +
    f.ecosystems.length +
    f.skills.length +
    (f.cryptoOnly ? 1 : 0)
  );
}
