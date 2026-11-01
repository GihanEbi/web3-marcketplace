import type { Candidate, ExperienceLevel, Job, MatchResult, SalaryCurrency, SalaryPeriod } from "@/types";

/**
 * Deterministic candidate ↔ job matching. Same inputs always give the same
 * output (no randomness, no clock). Can later be swapped for an API call.
 */

const LEVEL_ORDER: Record<ExperienceLevel, number> = { Entry: 0, Mid: 1, Senior: 2, Lead: 3 };

const FX_TO_USD: Record<SalaryCurrency, number> = { USD: 1, USDC: 1, DAI: 1, ETH: 3200, SOL: 160 };
const PERIOD_TO_YEAR: Record<SalaryPeriod, number> = { year: 1, month: 12, hour: 2000 };

export function annualUsd(amount: number, currency: SalaryCurrency, period: SalaryPeriod): number {
  return amount * (FX_TO_USD[currency] ?? 1) * PERIOD_TO_YEAR[period];
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function workModeFits(pref: Candidate["remotePreference"], mode: Job["workMode"]): boolean {
  switch (pref) {
    case "Remote only":
      return mode === "Remote";
    case "Hybrid":
      return mode === "Hybrid" || mode === "Remote";
    case "Onsite":
      return mode === "Onsite" || mode === "Hybrid";
    default:
      return true;
  }
}

export function computeMatch(candidate: Candidate, job: Job): MatchResult {
  const candSkills = new Set(candidate.skills.map(norm));
  const matchingSkills = job.skills.filter((s) => candSkills.has(norm(s)));
  const missingSkills = job.skills.filter((s) => !candSkills.has(norm(s)));
  const skillRatio = job.skills.length ? matchingSkills.length / job.skills.length : 0.5;

  // Experience (20 pts)
  const diff = LEVEL_ORDER[candidate.experienceLevel] - LEVEL_ORDER[job.experience];
  let expPts = 4;
  let experienceFit: MatchResult["experienceFit"] = "match";
  let experienceNote = `Your ${candidate.experienceLevel.toLowerCase()}-level background matches the ${job.experience.toLowerCase()} requirement.`;
  if (diff === 0) expPts = 20;
  else if (diff === 1) {
    expPts = 17;
    experienceFit = "over";
    experienceNote = `You are one level above the ${job.experience.toLowerCase()} requirement — strong fit, possible room to negotiate.`;
  } else if (diff > 1) {
    expPts = 12;
    experienceFit = "over";
    experienceNote = `You are significantly more experienced than the ${job.experience.toLowerCase()} requirement.`;
  } else if (diff === -1) {
    expPts = 10;
    experienceFit = "under";
    experienceNote = `The role asks for ${job.experience.toLowerCase()} experience — a stretch but achievable.`;
  } else {
    experienceFit = "under";
    experienceNote = `The role asks for ${job.experience.toLowerCase()} experience, which is well above your current level.`;
  }

  // Work mode (10 pts)
  const modeOk = workModeFits(candidate.remotePreference, job.workMode);
  const modePts = modeOk ? 10 : 2;

  // Salary (10 pts)
  const jobMin = annualUsd(job.salaryMin, job.currency, job.salaryPeriod);
  const jobMax = annualUsd(job.salaryMax, job.currency, job.salaryPeriod);
  const expMin = annualUsd(candidate.expectedSalaryMin, candidate.salaryCurrency, "year");
  const expMax = annualUsd(candidate.expectedSalaryMax, candidate.salaryCurrency, "year");
  let salaryFit: MatchResult["salaryFit"] = "unknown";
  let salaryNote = "Salary information is not available for comparison.";
  let salaryPts = 5;
  if (jobMax > 0 && expMax > 0) {
    if (jobMax < expMin) {
      salaryFit = "below";
      salaryPts = 3;
      salaryNote = "Posted compensation tops out below your expected range.";
    } else if (jobMin > expMax) {
      salaryFit = "above";
      salaryPts = 10;
      salaryNote = "Posted compensation starts above your expected range.";
    } else {
      salaryFit = "match";
      salaryPts = 10;
      salaryNote = "Posted compensation overlaps your expected range.";
    }
  }

  // Ecosystem affinity (5 pts)
  const ecoPts = candidate.preferredEcosystems.includes(job.blockchain) || job.blockchain === "Multi-chain" ? 5 : 1;

  const raw = skillRatio * 55 + expPts + modePts + salaryPts + ecoPts;
  const score = Math.max(12, Math.min(99, Math.round(raw)));

  const topMatches = matchingSkills.slice(0, 3).join(", ");
  const explanation =
    matchingSkills.length === 0
      ? `This role needs ${job.skills.slice(0, 3).join(", ")} — none of which appear on your profile yet.`
      : `You match ${matchingSkills.length} of ${job.skills.length} required skills (${topMatches}${
          matchingSkills.length > 3 ? "…" : ""
        }). ${experienceNote} ${modeOk ? `The ${job.workMode.toLowerCase()} setup fits your preferences.` : `The ${job.workMode.toLowerCase()} setup does not fit your work preference.`}`;

  return {
    score,
    matchingSkills,
    missingSkills,
    experienceFit,
    experienceNote,
    salaryFit,
    salaryNote,
    workModeFit: modeOk,
    explanation,
  };
}

export function matchLabel(score: number): "Excellent" | "Strong" | "Good" | "Fair" | "Low" {
  if (score >= 85) return "Excellent";
  if (score >= 72) return "Strong";
  if (score >= 58) return "Good";
  if (score >= 40) return "Fair";
  return "Low";
}

/** Profile completeness 0-100 for the job-seeker dashboard */
export function profileCompletion(c: Candidate): { percent: number; missing: string[] } {
  const checks: [string, boolean][] = [
    ["Profile photo", Boolean(c.avatar)],
    ["Headline", c.headline.trim().length > 5],
    ["Professional summary", c.summary.trim().length > 40],
    ["Skills (5+)", c.skills.length >= 5],
    ["Work experience", c.experience.length > 0],
    ["Education", c.education.length > 0],
    ["Certifications", c.certifications.length > 0],
    ["Portfolio projects", c.portfolio.length > 0],
    ["Resume / CV", Boolean(c.resume)],
    ["GitHub link", c.githubUrl.trim().length > 0],
    ["LinkedIn link", c.linkedinUrl.trim().length > 0],
    ["Wallet address", Boolean(c.walletAddress)],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
  };
}
