"use client";

/**
 * Mock service layer.
 *
 * Every function is async and has the signature a real HTTP client would have,
 * so each one can later be swapped for `fetch("/api/...")` without touching the
 * components. Today they simulate latency and read/write the Zustand store
 * (which persists to localStorage). Components must call these for writes
 * instead of mutating store state directly.
 */

import { useAppStore, type AppState } from "@/store/app-store";
import { nowIso } from "@/lib/clock";
import { filterAndSortJobs, getPublicJobs, type JobFilters } from "@/lib/job-filters";
import type {
  AccountStatus,
  AdminSettings,
  Application,
  ApplicationInput,
  ApplicationStatus,
  Candidate,
  Company,
  Contract,
  Conversation,
  FreelanceProject,
  Interview,
  InterviewInput,
  InterviewStatus,
  Job,
  JobInput,
  JobStatus,
  Message,
  Network,
  PlanId,
  ProjectInput,
  Proposal,
  ProposalInput,
  Report,
  ReportStatus,
  Role,
  Transaction,
  User,
  WalletProvider,
} from "@/types";

const store = () => useAppStore.getState();

/** Simulated network latency */
export const delay = (ms = 350): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function run<T>(fn: () => T, ms = 350): Promise<T> {
  await delay(ms);
  return fn();
}

/* --------------------------------- auth --------------------------------- */

export const loginAs = (userId: string): Promise<User> =>
  run(() => {
    const user = store().users.find((u) => u.id === userId);
    if (!user) throw new Error("Account not found");
    if (user.status === "suspended") throw new Error("This account has been suspended");
    store().login(userId);
    return user;
  }, 500);

/** Demo login by e-mail: any seeded e-mail works with any password. */
export const loginWithEmail = (email: string, _password: string): Promise<User> =>
  run(() => {
    void _password;
    const user = store().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) throw new Error("No demo account found for that e-mail. Try a demo account below.");
    if (user.status === "suspended") throw new Error("This account has been suspended");
    store().login(user.id);
    return user;
  }, 600);

export const logout = (): Promise<void> => run(() => store().logout(), 150);

export const registerUser = (input: {
  name: string;
  email: string;
  role: Exclude<Role, "admin">;
  companyName?: string;
}): Promise<User> =>
  run(() => {
    if (store().users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
      throw new Error("An account with this e-mail already exists");
    }
    return store().registerUser(input);
  }, 700);

/* ---------------------------------- jobs --------------------------------- */

export const getJobs = (filters?: Partial<JobFilters>, publicOnly = true): Promise<Job[]> =>
  run(() => {
    const s = store();
    const base = publicOnly ? getPublicJobs(s.jobs, s.companies) : s.jobs;
    if (!filters) return base;
    return filterAndSortJobs(base, s.companies, {
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
      ...filters,
    });
  }, 250);

export const getJob = (id: string): Promise<Job | undefined> => run(() => store().jobs.find((j) => j.id === id), 200);

export const createJob = (input: JobInput, postedBy: string): Promise<Job> =>
  run(() => store().createJob(input, postedBy), 600);

export const updateJob = (id: string, patch: Partial<JobInput>): Promise<Job> => run(() => store().updateJob(id, patch), 450);

export const deleteJob = (id: string): Promise<void> => run(() => store().deleteJob(id), 400);

export const setJobStatus = (id: string, status: JobStatus): Promise<Job> => run(() => store().setJobStatus(id, status), 350);

/** Toggles bookmark. Resolves to `true` when the job is now saved. */
export const saveJob = (candidateId: string, jobId: string): Promise<boolean> =>
  run(() => store().toggleSavedJob(candidateId, jobId), 150);

/* ------------------------------ applications ----------------------------- */

export const applyToJob = (input: ApplicationInput): Promise<Application> => run(() => store().applyToJob(input), 900);

export const updateApplicationStatus = (id: string, status: ApplicationStatus, note?: string): Promise<Application> =>
  run(() => store().updateApplicationStatus(id, status, note), 300);

export const withdrawApplication = (id: string): Promise<Application> => run(() => store().withdrawApplication(id), 400);

export const addApplicationNote = (id: string, text: string, authorName: string): Promise<Application> =>
  run(() => store().addApplicationNote(id, text, authorName), 250);

/* ------------------------------- interviews ------------------------------ */

export const scheduleInterview = (input: InterviewInput): Promise<Interview> =>
  run(() => store().scheduleInterview(input), 600);

export const rescheduleInterview = (id: string, scheduledAt: string, notes?: string): Promise<Interview> =>
  run(() => store().rescheduleInterview(id, scheduledAt, notes), 450);

export const setInterviewStatus = (id: string, status: InterviewStatus, notes?: string): Promise<Interview> =>
  run(() => store().setInterviewStatus(id, status, notes), 350);

export const cancelInterview = (id: string): Promise<Interview> => setInterviewStatus(id, "cancelled");

export const completeInterview = (id: string, notes?: string): Promise<Interview> =>
  setInterviewStatus(id, "completed", notes);

/* -------------------------------- messaging ------------------------------ */

export const sendMessage = (
  conversationId: string,
  senderRole: "seeker" | "employer",
  senderName: string,
  text: string,
): Promise<Message> => run(() => store().sendMessage(conversationId, senderRole, senderName, text), 200);

export const startConversation = (input: Parameters<AppState["startConversation"]>[0]): Promise<Conversation> =>
  run(() => store().startConversation(input), 300);

/* -------------------------------- profiles ------------------------------- */

export const updateCandidateProfile = (id: string, patch: Partial<Candidate>): Promise<Candidate> =>
  run(() => store().updateCandidate(id, patch), 500);

/** Mock CV upload – only records file metadata. */
export const uploadResume = (candidateId: string, fileName: string, sizeKb: number): Promise<Candidate> =>
  run(
    () =>
      store().updateCandidate(candidateId, {
        resume: { fileName, sizeKb, uploadedAt: nowIso() },
      }),
    900,
  );

export const updateCompanyProfile = (id: string, patch: Partial<Company>): Promise<Company> =>
  run(() => store().updateCompany(id, patch), 500);

/* ----------------------- freelance projects & contracts ------------------ */

export const createProject = (input: ProjectInput, postedBy: string): Promise<FreelanceProject> =>
  run(() => store().createProject(input, postedBy), 600);

export const setProjectStatus = (id: string, status: FreelanceProject["status"]): Promise<void> =>
  run(() => store().setProjectStatus(id, status), 300);

export const submitProposal = (input: ProposalInput): Promise<Proposal> => run(() => store().submitProposal(input), 800);

export const withdrawProposal = (id: string): Promise<Proposal> => run(() => store().withdrawProposal(id), 300);

export const rejectProposal = (id: string): Promise<Proposal> => run(() => store().rejectProposal(id), 300);

/** Accepting a proposal creates the contract + escrow workspace. */
export const createContract = (proposalId: string): Promise<Contract> => run(() => store().acceptProposal(proposalId), 900);

export const fundEscrow = (contractId: string, milestoneId: string): Promise<Transaction> =>
  run(() => store().fundMilestone(contractId, milestoneId), 1200);

export const submitMilestone = (contractId: string, milestoneId: string, note: string): Promise<Transaction> =>
  run(() => store().submitMilestone(contractId, milestoneId, note), 900);

export const approveMilestone = (contractId: string, milestoneId: string): Promise<Transaction> =>
  run(() => store().approveMilestone(contractId, milestoneId), 900);

export const releasePayment = (contractId: string, milestoneId: string): Promise<Transaction> =>
  run(() => store().releasePayment(contractId, milestoneId), 1400);

/* -------------------------------- bounties ------------------------------- */

export const submitBountyInterest = (bountyId: string, candidateId: string, note: string) =>
  run(() => store().submitBountyInterest(bountyId, candidateId, note), 700);

/* --------------------------------- wallet -------------------------------- */

export const connectWallet = (provider: WalletProvider): Promise<void> =>
  run(() => store().connectWallet(provider), 1100);

export const disconnectWallet = (): Promise<void> => run(() => store().disconnectWallet(), 200);

export const switchWalletNetwork = (network: Network): Promise<void> => run(() => store().switchWalletNetwork(network), 300);

/* ----------------------------- subscriptions ----------------------------- */

export const upgradePlan = (userId: string, plan: PlanId): Promise<void> => run(() => store().setPlan(userId, plan), 1000);

/* --------------------------------- admin --------------------------------- */

export const setUserStatus = (userId: string, status: AccountStatus): Promise<void> =>
  run(() => store().setUserStatus(userId, status), 300);

export const setCompanyVerified = (companyId: string, verified: boolean): Promise<void> =>
  run(() => store().setCompanyVerified(companyId, verified), 300);

export const setCompanySuspended = (companyId: string, suspended: boolean): Promise<void> =>
  run(() => store().setCompanySuspended(companyId, suspended), 300);

export const moderateJob = (jobId: string, action: "approve" | "reject" | "hide" | "restore"): Promise<Job> =>
  run(() => store().moderateJob(jobId, action), 400);

export const setReportStatus = (id: string, status: ReportStatus): Promise<Report> =>
  run(() => store().setReportStatus(id, status), 300);

export const updateAdminSettings = (patch: Partial<AdminSettings>): Promise<void> =>
  run(() => store().updateAdminSettings(patch), 250);

/* ---------------------------------- demo --------------------------------- */

export const resetDemoData = (): Promise<void> => run(() => store().resetDemoData(), 600);
