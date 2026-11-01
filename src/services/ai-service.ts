"use client";

/**
 * Mock AI service. Fully deterministic template-based "AI" — no network, no LLM.
 * Every function is async and returns plain data so it can later be replaced
 * by real API calls (e.g. POST /api/ai/chat) without touching components.
 *
 * Writes to the AI activity log (`aiHistory`) where noted.
 */

import { nowIso } from "@/lib/clock";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants";
import { formatJobSalary, formatCurrency } from "@/lib/format";
import { getPublicJobs } from "@/lib/job-filters";
import { computeMatch, profileCompletion } from "@/lib/matching";
import { delay } from "@/services/api";
import { makeId, useAppStore } from "@/store/app-store";
import type {
  AIChatMessage,
  AISuggestionCard,
  Candidate,
  Company,
  ExperienceLevel,
  Job,
  ResumeAnalysis,
  Role,
} from "@/types";

const store = () => useAppStore.getState();

export type CoverLetterTone = "professional" | "enthusiastic" | "concise";

export const AI_SEEKER_SUGGESTIONS = [
  "Find Solidity developer jobs",
  "What jobs match my skills?",
  "Analyze my CV",
  "How can I improve my profile?",
  "Prepare me for a React interview",
  "Generate a cover letter",
] as const;

export const AI_EMPLOYER_SUGGESTIONS = [
  "Summarize my top candidates",
  "Write a job description for a Senior Solidity Developer",
  "Suggest interview questions for a smart contract role",
  "Give me recruitment insights",
  "Compare my shortlisted candidates",
] as const;

/* ------------------------------------------------------------------ */
/* Cover letter                                                        */
/* ------------------------------------------------------------------ */

export function buildCoverLetter(candidate: Candidate, job: Job, company: Company | undefined, tone: CoverLetterTone = "professional", variant = 0): string {
  const match = computeMatch(candidate, job);
  const top = (match.matchingSkills.length ? match.matchingSkills : candidate.skills).slice(0, 4);
  const skillList = top.length > 1 ? `${top.slice(0, -1).join(", ")} and ${top[top.length - 1]}` : (top[0] ?? "Web3 engineering");
  const exp = candidate.experience[0];
  const project = candidate.portfolio[variant % Math.max(candidate.portfolio.length, 1)];
  const companyName = company?.name ?? "your team";
  const hook = [
    `I was excited to see the ${job.title} opening at ${companyName}`,
    `${companyName}'s work in ${job.blockchain === "Multi-chain" ? "multi-chain infrastructure" : `the ${job.blockchain} ecosystem`} is exactly where I want to build next, so I'm applying for the ${job.title} role`,
    `Having followed ${companyName} for a while, the ${job.title} position feels like a natural next step`,
  ][variant % 3];

  if (tone === "concise") {
    return `Hi ${companyName} hiring team,

${hook}. With ${candidate.yearsOfExperience} years of experience in ${skillList}, I can contribute from week one${exp ? ` — most recently as ${exp.title} at ${exp.company}` : ""}.${project ? ` One relevant example: ${project.title} (${project.url}).` : ""}

I'm available ${candidate.availability === "Immediately" ? "immediately" : `in ${candidate.availability}`} and would love to talk.

Best regards,
${candidate.name}`;
  }

  const warmth = tone === "enthusiastic" ? "I'm genuinely thrilled by" : "I am writing to express my interest in";
  return `Dear ${companyName} Hiring Team,

${warmth} the ${job.title} position. ${hook}. As a ${candidate.headline.toLowerCase()} based in ${candidate.location} with ${candidate.yearsOfExperience} years of hands-on experience, I bring deep expertise in ${skillList} — the core of what this role requires.

${exp ? `In my most recent role as ${exp.title} at ${exp.company}, ${exp.description.charAt(0).toLowerCase()}${exp.description.slice(1)}` : candidate.summary}${project ? `\n\nI'd also point you to ${project.title}, ${project.description.charAt(0).toLowerCase()}${project.description.slice(1)}` : ""}

${match.missingSkills.length ? `While I'm still deepening my experience with ${match.missingSkills.slice(0, 2).join(" and ")}, I ramp up quickly and have a track record of shipping in unfamiliar stacks. ` : ""}${job.cryptoPayment ? `I'm comfortable with ${job.paymentTokens.join("/")} compensation and on-chain payroll. ` : ""}I'd welcome the chance to discuss how I can help ${companyName} reach its goals${job.salaryMax ? ` — my expectations are in line with the posted ${formatJobSalary(job)} range` : ""}.

Thank you for your time and consideration.

Warm regards,
${candidate.name}
${candidate.email}${candidate.githubUrl ? `\n${candidate.githubUrl}` : ""}`;
}

export async function generateCoverLetter(
  candidateId: string,
  jobId: string,
  opts: { tone?: CoverLetterTone; variant?: number; log?: boolean } = {},
): Promise<string> {
  await delay(1100);
  const s = store();
  const candidate = s.candidates.find((c) => c.id === candidateId);
  const job = s.jobs.find((j) => j.id === jobId);
  if (!candidate || !job) throw new Error("Could not find the candidate or job for this cover letter");
  const company = s.companies.find((c) => c.id === job.companyId);
  const letter = buildCoverLetter(candidate, job, company, opts.tone ?? "professional", opts.variant ?? 0);
  if (opts.log !== false) {
    s.addAIHistory({
      role: "seeker",
      type: "cover_letter",
      title: `Cover letter for ${job.title} at ${company?.name ?? "company"}`,
      summary: `${opts.tone ?? "professional"} tone · ${letter.split(/\s+/).length} words`,
    });
  }
  return letter;
}

/* ------------------------------------------------------------------ */
/* Resume analysis                                                     */
/* ------------------------------------------------------------------ */

export async function analyzeResume(candidateId: string): Promise<ResumeAnalysis> {
  await delay(1400);
  const s = store();
  const candidate = s.candidates.find((c) => c.id === candidateId);
  if (!candidate) throw new Error("Candidate not found");
  const seeded = s.resumeAnalyses.find((r) => r.candidateId === candidateId);
  if (seeded) {
    s.addAIHistory({ role: "seeker", type: "resume_analysis", title: "Resume analysis", summary: `Score ${seeded.score}/100` });
    return seeded;
  }
  const { percent, missing } = profileCompletion(candidate);
  const score = Math.min(95, 48 + Math.round(percent * 0.4) + Math.min(candidate.skills.length, 10));
  const analysis: ResumeAnalysis = {
    candidateId,
    score,
    summary: `${candidate.name}'s profile is ${percent >= 80 ? "strong" : percent >= 55 ? "solid but incomplete" : "still early-stage"}, with ${candidate.skills.length} listed skills and ${candidate.experience.length} work experience entries.`,
    strengths: [
      candidate.skills.length >= 5 ? `Broad skill set (${candidate.skills.slice(0, 4).join(", ")})` : "Clear focus area",
      candidate.experience.length ? `Relevant experience at ${candidate.experience[0].company}` : "Willingness to learn quickly",
      candidate.githubUrl ? "Public GitHub profile adds credibility" : "Concise headline",
    ],
    improvements: missing.slice(0, 4).map((m) => `Add or complete: ${m}`),
    relevantSkills: candidate.skills.slice(0, 6),
    missingInfo: missing.slice(0, 3),
    formatting: ["Lead each role with measurable impact (e.g. TVL secured, gas saved)", "Keep the resume to a single page per ~5 years of experience", "Use a consistent date format (MMM YYYY)"],
  };
  s.addAIHistory({ role: "seeker", type: "resume_analysis", title: "Resume analysis", summary: `Score ${analysis.score}/100` });
  return analysis;
}

/* ------------------------------------------------------------------ */
/* Recruiter tools                                                     */
/* ------------------------------------------------------------------ */

export interface GeneratedJobDescription {
  description: string;
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
}

export async function generateJobDescription(input: {
  title: string;
  category?: string;
  experience: ExperienceLevel;
  skills: string[];
  companyName?: string;
  workMode?: string;
  blockchain?: string;
}): Promise<GeneratedJobDescription> {
  await delay(1300);
  const skills = input.skills.length ? input.skills : ["Solidity", "TypeScript"];
  const company = input.companyName ?? "our team";
  const level = input.experience.toLowerCase();
  const out: GeneratedJobDescription = {
    description: `${company} is looking for a ${level}-level ${input.title} to help build secure, user-friendly products${input.blockchain ? ` on ${input.blockchain}` : " in Web3"}. You will work ${input.workMode ? input.workMode.toLowerCase() : "closely"} with a small, high-ownership team to design, ship and iterate on core features${input.category ? ` in ${input.category.toLowerCase()}` : ""}, using ${skills.slice(0, 4).join(", ")}.`,
    responsibilities: [
      `Design, build and maintain production-grade ${skills[0]} components`,
      "Collaborate with product, design and security to ship reliable releases",
      "Write thorough tests and documentation, and participate in code review",
      "Monitor, debug and improve performance of live systems",
      "Contribute to technical decisions and mentor teammates",
    ],
    qualifications: [
      `${input.experience === "Entry" ? "1+" : input.experience === "Mid" ? "3+" : input.experience === "Senior" ? "5+" : "8+"} years of relevant professional experience`,
      `Strong proficiency with ${skills.slice(0, 3).join(", ")}`,
      "Solid understanding of blockchain fundamentals and security best practices",
      "Excellent written communication in an async-first environment",
    ],
    benefits: ["Competitive salary with optional crypto payment", "Token / equity participation", "Flexible remote-friendly schedule", "Annual learning & conference budget", "Home-office stipend"],
  };
  store().addAIHistory({ role: "employer", type: "job_description", title: `Job description: ${input.title}`, summary: `${level} · ${skills.slice(0, 3).join(", ")}` });
  return out;
}

export async function summarizeCandidate(applicationId: string): Promise<string> {
  await delay(900);
  const s = store();
  const app = s.applications.find((a) => a.id === applicationId);
  const candidate = s.candidates.find((c) => c.id === app?.candidateId);
  const job = s.jobs.find((j) => j.id === app?.jobId);
  if (!app || !candidate || !job) throw new Error("Application not found");
  const m = computeMatch(candidate, job);
  const text = `${candidate.name} is a ${candidate.experienceLevel.toLowerCase()}-level ${candidate.headline.toLowerCase()} with ${candidate.yearsOfExperience} years of experience. They match ${m.matchingSkills.length} of ${job.skills.length} required skills (${m.matchingSkills.slice(0, 4).join(", ") || "none"}) for the ${job.title} role${m.missingSkills.length ? `, with gaps in ${m.missingSkills.slice(0, 3).join(", ")}` : ""}. ${m.experienceNote} ${m.salaryNote} Overall suitability: ${m.score}/100. Recommendation: ${m.score >= 80 ? "move forward to interview" : m.score >= 62 ? "shortlist and run a technical screen" : "keep in pipeline, probe skill gaps before proceeding"} — final decision rests with the recruiter.`;
  s.addAIHistory({ role: "employer", type: "recruitment_insight", title: `Candidate summary: ${candidate.name}`, summary: `Match ${m.score}/100 for ${job.title}` });
  return text;
}

export interface CandidateComparison {
  rows: { applicationId: string; candidateName: string; score: number; strengths: string[]; gaps: string[]; verdict: string }[];
  recommendation: string;
}

export async function compareCandidates(applicationIds: string[]): Promise<CandidateComparison> {
  await delay(1200);
  const s = store();
  const rows = applicationIds
    .map((id) => {
      const app = s.applications.find((a) => a.id === id);
      const candidate = s.candidates.find((c) => c.id === app?.candidateId);
      const job = s.jobs.find((j) => j.id === app?.jobId);
      if (!app || !candidate || !job) return null;
      const m = computeMatch(candidate, job);
      return {
        applicationId: id,
        candidateName: candidate.name,
        score: m.score,
        strengths: m.matchingSkills.slice(0, 3),
        gaps: m.missingSkills.slice(0, 3),
        verdict: m.score >= 80 ? "Strong fit" : m.score >= 62 ? "Good fit with gaps" : "Weak fit",
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.score - a.score);
  const recommendation = rows.length
    ? `${rows[0].candidateName} has the highest deterministic match (${rows[0].score}/100). Consider interviewing them first${rows[1] ? `, then ${rows[1].candidateName}` : ""}. This is a suggestion only — you decide who advances.`
    : "Select at least two applications to compare.";
  s.addAIHistory({ role: "employer", type: "recruitment_insight", title: "Candidate comparison", summary: `${rows.length} candidates compared` });
  return { rows, recommendation };
}

export async function suggestInterviewQuestions(input: { jobTitle: string; skills: string[]; level?: ExperienceLevel }): Promise<string[]> {
  await delay(1000);
  const [a = "Solidity", b = "TypeScript", c = "smart contract security"] = input.skills;
  const questions = [
    `Walk me through the architecture of the most complex ${a} project you've shipped. What trade-offs did you make?`,
    `How do you approach testing and verifying correctness for ${b} code in production?`,
    `Describe a security issue you found (or nearly shipped) related to ${c}. How was it resolved?`,
    "How do you reason about gas / performance costs when designing a feature?",
    "Tell me about a time you disagreed with a teammate on a technical decision. What happened?",
    `What would you improve first if you joined as ${input.jobTitle}?`,
  ];
  if (input.level === "Lead" || input.level === "Senior") questions.push("How do you mentor engineers and set technical direction in an async remote team?");
  store().addAIHistory({ role: "employer", type: "interview_questions", title: `Interview questions: ${input.jobTitle}`, summary: `${questions.length} questions generated` });
  return questions;
}

export interface RecruitmentInsight {
  id: string;
  title: string;
  body: string;
  tone: "positive" | "neutral" | "warning";
}

export async function getRecruitmentInsights(companyId: string, opts: { log?: boolean } = {}): Promise<RecruitmentInsight[]> {
  await delay(900);
  const s = store();
  const jobs = s.jobs.filter((j) => j.companyId === companyId);
  const apps = s.applications.filter((a) => a.companyId === companyId);
  const live = jobs.filter((j) => j.status === "published");
  const shortlisted = apps.filter((a) => a.status === "shortlisted").length;
  const busiest = [...live].sort((a, b) => apps.filter((x) => x.jobId === b.id).length - apps.filter((x) => x.jobId === a.id).length)[0];
  const avgScore = apps.length ? Math.round(apps.reduce((sum, a) => sum + a.matchScore, 0) / apps.length) : 0;
  const stale = apps.filter((a) => a.status === "applied").length;
  if (opts.log) {
    s.addAIHistory({ role: "employer", type: "recruitment_insight", title: "Recruitment insights refreshed", summary: `${apps.length} applications across ${live.length} live roles analysed` });
  }
  return [
    { id: "ins-1", title: "Pipeline health", body: `${apps.length} applications across ${live.length} live roles; ${shortlisted} shortlisted. Average AI match score is ${avgScore}/100.`, tone: "neutral" },
    busiest
      ? { id: "ins-2", title: "Most in-demand role", body: `${busiest.title} is attracting the most applicants (${apps.filter((a) => a.jobId === busiest.id).length}). Consider closing early or adding screening questions.`, tone: "positive" }
      : { id: "ins-2", title: "No live roles", body: "Publish a job to start receiving applications.", tone: "warning" },
    { id: "ins-3", title: stale > 3 ? "Candidates waiting on you" : "Response time looks healthy", body: stale > 3 ? `${stale} applications are still in "Applied". Reviewing them within 48h improves offer-acceptance rates.` : "Most applications have been reviewed promptly.", tone: stale > 3 ? "warning" : "positive" },
    { id: "ins-4", title: "Compensation tip", body: "Roles offering crypto payment options receive noticeably more qualified Web3-native applicants in this demo dataset.", tone: "neutral" },
  ];
}

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

function jobCard(job: Job, companies: Company[], extra?: string): AISuggestionCard {
  return {
    id: `card-${job.id}`,
    kind: "job",
    title: job.title,
    subtitle: `${companies.find((c) => c.id === job.companyId)?.name ?? "Company"} · ${formatJobSalary(job)}${extra ? ` · ${extra}` : ""}`,
    href: `/jobs/${job.id}`,
  };
}

interface ChatContext {
  role: Role;
  candidateId?: string | null;
  companyId?: string | null;
}

function reply(text: string, cards?: AISuggestionCard[]): AIChatMessage {
  return { id: makeId("aimsg"), from: "assistant", text, at: nowIso(), cards };
}

/**
 * Context-aware mock chat reply. Pass the user's prompt and who is asking.
 * Intent detection is keyword-based and deterministic.
 */
export async function generateMockAIResponse(prompt: string, ctx: ChatContext): Promise<AIChatMessage> {
  await delay(1000 + Math.min(prompt.length * 8, 700));
  const s = store();
  const p = prompt.toLowerCase();
  const publicJobs = getPublicJobs(s.jobs, s.companies);

  const log = (title: string, summary: string) => s.addAIHistory({ role: ctx.role, type: "chat", title, summary });

  const isGreeting = /^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/.test(p) && p.trim().split(/\s+/).length <= 4;
  const isThanks = /\b(thanks|thank you|cheers)\b/.test(p) && p.trim().split(/\s+/).length <= 6;

  /* ---------------- employer ---------------- */
  if (ctx.role === "employer") {
    const companyId = ctx.companyId ?? "";
    if (isGreeting || isThanks) {
      const open = s.applications.filter((a) => a.companyId === companyId && (a.status === "applied" || a.status === "under_review")).length;
      log(isThanks ? "Thanks" : "Greeting", prompt.slice(0, 60));
      return reply(
        isThanks
          ? "You're welcome! Ask me anything else about your pipeline, candidates or job descriptions."
          : `Hello! You have **${open}** application${open === 1 ? "" : "s"} waiting for a first review. I can summarise top candidates, compare shortlists, draft job descriptions or suggest interview questions.`,
        open ? [{ id: "act-review", kind: "action", title: "Review applicants", subtitle: `${open} awaiting review`, href: "/employer/candidates" }] : undefined,
      );
    }
    if (/job description|write a job|jd/.test(p)) {
      const title = /for an? ([\w\s/.-]+?)(?:\.|$)/i.exec(prompt)?.[1]?.trim() || "Senior Solidity Developer";
      const gen = await generateJobDescription({ title, experience: "Senior", skills: ["Solidity", "Foundry", "TypeScript"], companyName: s.companies.find((c) => c.id === companyId)?.name });
      log("Job description generated", title);
      return reply(`Here's a draft for **${title}**:\n\n${gen.description}\n\n**Responsibilities**\n${gen.responsibilities.map((r) => `• ${r}`).join("\n")}\n\n**Qualifications**\n${gen.qualifications.map((r) => `• ${r}`).join("\n")}\n\nYou can paste this into the job form. Nothing is published until you approve it.`, [
        { id: "act-create", kind: "action", title: "Create a job from this draft", href: "/employer/jobs/create" },
      ]);
    }
    if (/interview question/.test(p)) {
      const qs = await suggestInterviewQuestions({ jobTitle: "Smart Contract Engineer", skills: ["Solidity", "Foundry", "smart contract security"], level: "Senior" });
      log("Interview questions", `${qs.length} questions`);
      return reply(`Suggested interview questions:\n\n${qs.map((q, i) => `${i + 1}. ${q}`).join("\n")}`);
    }
    if (/insight|pipeline|how are we doing/.test(p)) {
      const insights = await getRecruitmentInsights(companyId);
      log("Recruitment insights", `${insights.length} insights`);
      return reply(insights.map((i) => `**${i.title}** — ${i.body}`).join("\n\n"), [{ id: "act-ats", kind: "action", title: "Open candidates", href: "/employer/candidates" }]);
    }
    const apps = s.applications.filter((a) => a.companyId === companyId).sort((a, b) => b.matchScore - a.matchScore);
    if (/top candidate|summar|compare|shortlist/.test(p)) {
      const picks = (/compare|shortlist/.test(p) ? apps.filter((a) => a.status === "shortlisted" || a.status === "interview") : apps).slice(0, 3);
      const list = picks.length ? picks : apps.slice(0, 3);
      const lines = list.map((a) => `• ${s.candidates.find((c) => c.id === a.candidateId)?.name ?? "Candidate"} — ${s.jobs.find((j) => j.id === a.jobId)?.title ?? "role"} (match ${a.matchScore}/100, ${a.status.replace("_", " ")})`);
      log("Candidate summary", `${list.length} candidates`);
      return reply(`Here are your strongest candidates right now:\n\n${lines.join("\n")}\n\nI can only recommend — any move to interview, offer or rejection needs your explicit approval in the applicant tracker.`, [{ id: "act-cand", kind: "action", title: "Review in applicant tracker", href: "/employer/candidates" }]);
    }
    log("General question", prompt.slice(0, 60));
    return reply("I can help with job descriptions, candidate summaries, comparisons, interview questions and recruitment insights. Try one of the suggested prompts below.");
  }

  /* ---------------- seeker ---------------- */
  const candidate = s.candidates.find((c) => c.id === ctx.candidateId);
  if (!candidate) return reply("Sign in as a job seeker so I can personalise my answers using your profile.");

  if (isGreeting || isThanks) {
    const first = candidate.name.split(" ")[0];
    const mine = s.applications.filter((a) => a.candidateId === candidate.id && a.status !== "withdrawn");
    const { percent } = profileCompletion(candidate);
    log(isThanks ? "Thanks" : "Greeting", prompt.slice(0, 60));
    return reply(
      isThanks
        ? `Any time, ${first}! Let me know if you want to keep going with your job search.`
        : `Hi ${first}! Your profile is **${percent}%** complete and you have **${mine.length}** active application${mine.length === 1 ? "" : "s"}. What would you like to work on?`,
    );
  }

  if (/\b(my )?applications?\b|\bapplied\b|application status/.test(p) && !/cover letter/.test(p)) {
    const mine = s.applications.filter((a) => a.candidateId === candidate.id).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    log("Application status check", `${mine.length} applications`);
    if (!mine.length) {
      return reply("You haven't applied to any roles yet. Want me to find the best matches for your skills?", [{ id: "act-recs", kind: "action", title: "See recommended jobs", href: "/recommended-jobs" }]);
    }
    const lines = mine.slice(0, 5).map((a) => `• ${s.jobs.find((j) => j.id === a.jobId)?.title ?? "Role"} at ${s.companies.find((c) => c.id === a.companyId)?.name ?? "company"} — **${APPLICATION_STATUS_LABEL[a.status]}** (match ${a.matchScore}/100)`);
    return reply(`You have **${mine.length}** application${mine.length === 1 ? "" : "s"}. Most recent activity:\n\n${lines.join("\n")}`, [{ id: "act-apps", kind: "action", title: "Open my applications", href: "/applications" }]);
  }
  if (/saved|bookmark/.test(p)) {
    const saved = (s.savedJobs[candidate.id] ?? []).map((id) => publicJobs.find((j) => j.id === id)).filter((j): j is Job => Boolean(j));
    log("Saved jobs", `${saved.length} saved`);
    return saved.length
      ? reply(`You have ${saved.length} saved role${saved.length === 1 ? "" : "s"}:`, saved.slice(0, 4).map((j) => jobCard(j, s.companies, `${computeMatch(candidate, j).score}% match`)))
      : reply("You haven't saved any jobs yet. Tap the bookmark icon on a job to keep it here.", [{ id: "act-browse", kind: "action", title: "Browse jobs", href: "/jobs" }]);
  }
  if (/salary|pay\b|compensation|worth/.test(p)) {
    const best = publicJobs.map((j) => ({ j, m: computeMatch(candidate, j) })).filter(({ m }) => m.salaryFit === "match" || m.salaryFit === "above").sort((a, b) => b.m.score - a.m.score).slice(0, 3);
    log("Salary fit", `${best.length} roles in range`);
    return reply(
      `Your target is **${formatCurrency(candidate.expectedSalaryMin, candidate.salaryCurrency)} – ${formatCurrency(candidate.expectedSalaryMax, candidate.salaryCurrency)}**. ${best.length ? "These open roles pay in or above that range:" : "No open roles clearly overlap that range right now — consider widening your target or work mode."}`,
      best.map(({ j, m }) => jobCard(j, s.companies, `${m.score}% match`)),
    );
  }

  if (/cover letter/.test(p)) {
    const ranked = publicJobs.map((j) => ({ j, m: computeMatch(candidate, j) })).sort((a, b) => b.m.score - a.m.score);
    const top = ranked[0]?.j;
    if (!top) return reply("There are no open jobs to write a cover letter for right now.");
    const company = s.companies.find((c) => c.id === top.companyId);
    const letter = buildCoverLetter(candidate, top, company);
    log("Cover letter drafted", `${top.title} at ${company?.name ?? ""}`);
    return reply(`I drafted a cover letter for your best-matching role, **${top.title}** at ${company?.name ?? "the company"}:\n\n${letter}\n\nWant a different tone or role? Use the Cover Letter Generator on a job's application page.`, [jobCard(top, s.companies, `${ranked[0].m.score}% match`)]);
  }
  if (/analy[sz]e.*(cv|resume)|resume|\bcv\b/.test(p)) {
    const a = await analyzeResume(candidate.id);
    log("Resume analysis", `Score ${a.score}`);
    return reply(`**Resume score: ${a.score}/100**\n\n${a.summary}\n\n**Strengths**\n${a.strengths.map((x) => `• ${x}`).join("\n")}\n\n**Suggested improvements**\n${a.improvements.map((x) => `• ${x}`).join("\n")}`, [{ id: "act-resume", kind: "action", title: "Open full resume analysis", href: "/resume-analysis" }]);
  }
  if (/improve.*profile|profile/.test(p)) {
    const { percent, missing } = profileCompletion(candidate);
    log("Profile tips", `${percent}% complete`);
    return reply(`Your profile is **${percent}%** complete. ${missing.length ? `Quick wins: ${missing.slice(0, 4).join(", ")}.` : "Nothing major is missing — keep your project descriptions fresh."}\n\nTip: quantify impact in each experience entry (TVL secured, gas saved, users onboarded).`, [{ id: "act-profile", kind: "action", title: "Edit my profile", href: "/profile" }]);
  }
  if (/interview|prepare/.test(p)) {
    const topic = /react/.test(p) ? "React" : /solidity/.test(p) ? "Solidity" : /rust/.test(p) ? "Rust" : "Web3";
    const qs = await suggestInterviewQuestions({ jobTitle: `${topic} Engineer`, skills: [topic, "TypeScript", "security"], level: candidate.experienceLevel });
    log(`${topic} interview prep`, `${qs.length} questions`);
    return reply(`Let's prepare for a **${topic}** interview. Practise answering these out loud:\n\n${qs.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nUse the STAR format (Situation, Task, Action, Result) and keep answers under 2 minutes.`);
  }
  if (/match|skills|recommend/.test(p)) {
    const ranked = publicJobs.map((j) => ({ j, m: computeMatch(candidate, j) })).sort((a, b) => b.m.score - a.m.score).slice(0, 3);
    log("Skill-based matches", `Top: ${ranked[0]?.j.title ?? "n/a"}`);
    return reply(`Based on your skills (${candidate.skills.slice(0, 5).join(", ")}), these roles fit best:`, ranked.map(({ j, m }) => jobCard(j, s.companies, `${m.score}% match`)));
  }
  const keyword = /(solidity|rust|react|security|design|devops|frontend|backend|product|research|community)/.exec(p)?.[1];
  if (/find|search|jobs?/.test(p) || keyword) {
    const term = keyword ?? "web3";
    const found = publicJobs.filter((j) => `${j.title} ${j.skills.join(" ")} ${j.category}`.toLowerCase().includes(term)).slice(0, 4);
    log(`Job search: ${term}`, `${found.length} results`);
    return found.length
      ? reply(`I found ${found.length} open ${term} role${found.length === 1 ? "" : "s"} for you:`, found.map((j) => jobCard(j, s.companies, `${computeMatch(candidate, j).score}% match`)))
      : reply(`I couldn't find open roles for "${term}" right now. Try broadening your search or checking Web3 bounties.`);
  }
  log("General question", prompt.slice(0, 60));
  return reply(`I can search jobs, check your skill matches, analyse your CV, improve your profile, draft cover letters and prepare you for interviews. Try one of the suggestions below${candidate.expectedSalaryMin ? ` — I'll keep your target of ${formatCurrency(candidate.expectedSalaryMin, candidate.salaryCurrency)}+ in mind` : ""}.`);
}
