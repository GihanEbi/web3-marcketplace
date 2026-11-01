"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { seedData, type SeedData } from "@/data";
import { STORAGE_KEY, APPLICATION_STATUS_LABEL, NETWORKS } from "@/lib/constants";
import { appNow, nowIso, addDaysIso, resetClock } from "@/lib/clock";
import { computeMatch } from "@/lib/matching";
import type {
  AdminSettings,
  AIHistoryItem,
  AppNotification,
  Application,
  ApplicationInput,
  ApplicationStatus,
  BountyInterest,
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
  NotificationType,
  PlanId,
  ProjectInput,
  Proposal,
  ProposalInput,
  Report,
  ReportStatus,
  Role,
  Transaction,
  TransactionType,
  User,
  WalletProvider,
  WalletState,
  AccountStatus,
} from "@/types";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

let idCounter = 0;
export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}`;
}

function hex(len: number): string {
  let out = "";
  for (let i = 0; i < len; i += 1) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}
export const mockTxHash = () => `0x${hex(64)}`;
export const mockWalletAddress = () => `0x${hex(40)}`;

const DEFAULT_BALANCES: Record<string, number> = {
  ETH: 4.2381,
  USDC: 12450.5,
  DAI: 3200,
  MATIC: 1840.25,
};

const DEFAULT_WALLET: WalletState = {
  connected: false,
  provider: null,
  address: null,
  network: "Ethereum",
  balances: DEFAULT_BALANCES,
};

function toNetwork(chain: string): Network {
  return (NETWORKS as string[]).includes(chain) ? (chain as Network) : "Ethereum";
}

/* ------------------------------------------------------------------ */
/* State shape                                                         */
/* ------------------------------------------------------------------ */

type Data = Omit<SeedData, "adminAnalytics">;

export interface AppState extends Data {
  hydrated: boolean;
  currentUserId: string | null;
  wallet: WalletState;
  sidebarCollapsed: boolean;
  adminAnalytics: SeedData["adminAnalytics"];

  /* session */
  login: (userId: string) => void;
  logout: () => void;
  registerUser: (input: { name: string; email: string; role: Exclude<Role, "admin">; companyName?: string }) => User;
  setSidebarCollapsed: (v: boolean) => void;

  /* jobs */
  createJob: (input: JobInput, postedBy: string) => Job;
  updateJob: (id: string, patch: Partial<JobInput>) => Job;
  deleteJob: (id: string) => void;
  setJobStatus: (id: string, status: JobStatus) => Job;
  toggleSavedJob: (candidateId: string, jobId: string) => boolean;

  /* applications */
  applyToJob: (input: ApplicationInput) => Application;
  updateApplicationStatus: (id: string, status: ApplicationStatus, note?: string) => Application;
  withdrawApplication: (id: string) => Application;
  addApplicationNote: (id: string, text: string, authorName: string) => Application;

  /* interviews */
  scheduleInterview: (input: InterviewInput) => Interview;
  rescheduleInterview: (id: string, scheduledAt: string, notes?: string) => Interview;
  setInterviewStatus: (id: string, status: InterviewStatus, notes?: string) => Interview;
  updateInterviewNotes: (id: string, notes: string) => void;

  /* messaging */
  sendMessage: (conversationId: string, senderRole: "seeker" | "employer", senderName: string, text: string) => Message;
  startConversation: (input: {
    candidateId: string;
    companyId: string;
    employerUserId: string;
    subject: string;
    applicationId?: string;
    jobId?: string;
  }) => Conversation;
  markConversationRead: (id: string, role: "seeker" | "employer") => void;

  /* notifications */
  pushNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => AppNotification;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (role: Role) => void;

  /* profiles */
  updateCandidate: (id: string, patch: Partial<Candidate>) => Candidate;
  updateCompany: (id: string, patch: Partial<Company>) => Company;

  /* projects + proposals + contracts */
  createProject: (input: ProjectInput, postedBy: string) => FreelanceProject;
  setProjectStatus: (id: string, status: FreelanceProject["status"]) => void;
  submitProposal: (input: ProposalInput) => Proposal;
  withdrawProposal: (id: string) => Proposal;
  rejectProposal: (id: string) => Proposal;
  acceptProposal: (id: string) => Contract;
  fundMilestone: (contractId: string, milestoneId: string) => Transaction;
  submitMilestone: (contractId: string, milestoneId: string, note: string) => Transaction;
  approveMilestone: (contractId: string, milestoneId: string) => Transaction;
  releasePayment: (contractId: string, milestoneId: string) => Transaction;

  /* bounties */
  submitBountyInterest: (bountyId: string, candidateId: string, note: string) => BountyInterest;

  /* wallet */
  connectWallet: (provider: WalletProvider) => void;
  disconnectWallet: () => void;
  switchWalletNetwork: (network: Network) => void;

  /* AI */
  addAIHistory: (item: Omit<AIHistoryItem, "id" | "createdAt">) => AIHistoryItem;

  /* subscription */
  setPlan: (userId: string, plan: PlanId) => void;

  /* admin */
  setUserStatus: (userId: string, status: AccountStatus) => void;
  setCompanyVerified: (companyId: string, verified: boolean) => void;
  setCompanySuspended: (companyId: string, suspended: boolean) => void;
  moderateJob: (jobId: string, action: "approve" | "reject" | "hide" | "restore") => Job;
  setReportStatus: (id: string, status: ReportStatus) => Report;
  updateAdminSettings: (patch: Partial<AdminSettings>) => void;

  /* demo */
  resetDemoData: () => void;
}

/* ------------------------------------------------------------------ */
/* Initial data                                                        */
/* ------------------------------------------------------------------ */

function cloneSeed(): Data {
  const { adminAnalytics: _omit, ...rest } = seedData;
  void _omit;
  return structuredClone(rest);
}

function getInitialData() {
  return {
    ...cloneSeed(),
    adminAnalytics: seedData.adminAnalytics,
    hydrated: false,
    currentUserId: null as string | null,
    wallet: { ...DEFAULT_WALLET, balances: { ...DEFAULT_BALANCES } },
    sidebarCollapsed: false,
  };
}

function notification(
  role: Role,
  type: NotificationType,
  title: string,
  body: string,
  href?: string,
): AppNotification {
  return { id: makeId("notif"), role, type, title, body, href, createdAt: nowIso(), read: false };
}

function nextTimeline(app: Application, status: ApplicationStatus, note?: string): Application["timeline"] {
  return [...app.timeline, { id: makeId("tl"), status, at: nowIso(), note }];
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const findOrThrow = <T extends { id: string }>(list: T[], id: string, label: string): T => {
        const found = list.find((x) => x.id === id);
        if (!found) throw new Error(`${label} not found`);
        return found;
      };

      const addNotification = (n: AppNotification) => set((s) => ({ notifications: [n, ...s.notifications] }));

      const recordTx = (
        contract: Contract,
        type: TransactionType,
        amount: number,
        milestoneId: string,
      ): Transaction => ({
        id: makeId("tx"),
        contractId: contract.id,
        milestoneId,
        type,
        amount,
        token: contract.token,
        network: contract.network,
        hash: mockTxHash(),
        at: nowIso(),
        status: "confirmed",
        simulated: true,
      });

      /** Update a contract + append a transaction in a single set() */
      const mutateContract = (
        contractId: string,
        milestoneId: string,
        type: TransactionType,
        apply: (c: Contract, m: Contract["milestones"][number]) => Contract,
        guard: (m: Contract["milestones"][number], c: Contract) => string | null,
      ): Transaction => {
        const contract = findOrThrow(get().contracts, contractId, "Contract");
        const milestone = contract.milestones.find((m) => m.id === milestoneId);
        if (!milestone) throw new Error("Milestone not found");
        const problem = guard(milestone, contract);
        if (problem) throw new Error(problem);
        const tx = recordTx(contract, type, milestone.amount, milestoneId);
        const updated = apply(contract, milestone);
        set((s) => ({
          contracts: s.contracts.map((c) => (c.id === contractId ? updated : c)),
          transactions: [tx, ...s.transactions],
        }));
        return tx;
      };

      return {
        ...getInitialData(),

        /* ------------------------------ session ------------------------------ */
        login: (userId) => set({ currentUserId: userId }),
        logout: () => set({ currentUserId: null }),
        setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
        registerUser: ({ name, email, role, companyName }) => {
          const userId = makeId("usr");
          const joinedAt = nowIso();
          if (role === "seeker") {
            const candidateId = makeId("cand");
            const user: User = { id: userId, name, email, role, status: "active", joinedAt, plan: "free", candidateId };
            const candidate: Candidate = {
              id: candidateId,
              userId,
              name,
              headline: "Web3 professional",
              location: "Remote",
              email,
              phone: "",
              summary: "",
              skills: [],
              yearsOfExperience: 0,
              experienceLevel: "Entry",
              experience: [],
              education: [],
              certifications: [],
              portfolio: [],
              githubUrl: "",
              linkedinUrl: "",
              website: "",
              preferredJobTypes: ["Full-time"],
              preferredEcosystems: [],
              expectedSalaryMin: 60000,
              expectedSalaryMax: 90000,
              salaryCurrency: "USD",
              remotePreference: "Flexible",
              availability: "Immediately",
            };
            set((s) => ({ users: [...s.users, user], candidates: [...s.candidates, candidate], currentUserId: userId }));
            return user;
          }
          const companyId = makeId("co");
          const cname = companyName?.trim() || `${name.split(" ")[0]} Labs`;
          const company: Company = {
            id: companyId,
            name: cname,
            initials: cname.slice(0, 2).toUpperCase(),
            logoFrom: "#6366f1",
            logoTo: "#a855f7",
            industry: "Web3 / Blockchain",
            location: "Remote",
            size: "1-10",
            founded: appNow().getFullYear(),
            website: "https://example.com",
            tagline: "Building the next generation of Web3 products",
            about: "",
            techStack: [],
            ecosystems: [],
            verified: false,
            suspended: false,
            isDao: false,
            isDemo: true,
            social: {},
          };
          const user: User = {
            id: userId,
            name,
            email,
            role,
            status: "active",
            joinedAt,
            plan: "free",
            companyId,
            title: "Hiring Manager",
          };
          set((s) => ({ users: [...s.users, user], companies: [...s.companies, company], currentUserId: userId }));
          return user;
        },

        /* -------------------------------- jobs -------------------------------- */
        createJob: (input, postedBy) => {
          const now = nowIso();
          const requireApproval = get().adminSettings.features.requireJobApproval;
          const status: JobStatus = input.status === "published" && requireApproval ? "pending" : input.status;
          const job: Job = {
            ...input,
            status,
            featured: input.featured ?? false,
            id: makeId("job"),
            postedBy,
            postedAt: now,
            updatedAt: now,
          };
          set((s) => ({ jobs: [job, ...s.jobs] }));
          if (status === "pending") {
            addNotification(notification("admin", "system", "Job awaiting approval", `${job.title} was submitted for review.`, "/admin/jobs"));
          }
          return job;
        },
        updateJob: (id, patch) => {
          const existing = findOrThrow(get().jobs, id, "Job");
          const updated: Job = { ...existing, ...patch, updatedAt: nowIso() };
          set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? updated : j)) }));
          return updated;
        },
        deleteJob: (id) => {
          findOrThrow(get().jobs, id, "Job");
          set((s) => ({
            jobs: s.jobs.filter((j) => j.id !== id),
            savedJobs: Object.fromEntries(Object.entries(s.savedJobs).map(([k, v]) => [k, v.filter((j) => j !== id)])),
          }));
        },
        setJobStatus: (id, status) => {
          const existing = findOrThrow(get().jobs, id, "Job");
          const requireApproval = get().adminSettings.features.requireJobApproval;
          const next: JobStatus =
            status === "published" && requireApproval && (existing.status === "draft" || existing.status === "rejected")
              ? "pending"
              : status;
          const updated: Job = { ...existing, status: next, updatedAt: nowIso() };
          set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? updated : j)) }));
          return updated;
        },
        toggleSavedJob: (candidateId, jobId) => {
          const current = get().savedJobs[candidateId] ?? [];
          const saved = !current.includes(jobId);
          set((s) => ({
            savedJobs: { ...s.savedJobs, [candidateId]: saved ? [jobId, ...current] : current.filter((id) => id !== jobId) },
          }));
          return saved;
        },

        /* ---------------------------- applications --------------------------- */
        applyToJob: (input) => {
          const { jobs, candidates, applications } = get();
          const job = findOrThrow(jobs, input.jobId, "Job");
          const candidate = findOrThrow(candidates, input.candidateId, "Candidate");
          if (job.status !== "published") throw new Error("This job is not accepting applications");
          const duplicate = applications.find(
            (a) => a.jobId === input.jobId && a.candidateId === input.candidateId && a.status !== "withdrawn",
          );
          if (duplicate) throw new Error("You have already applied to this job");
          const now = nowIso();
          const app: Application = {
            id: makeId("app"),
            jobId: job.id,
            candidateId: candidate.id,
            companyId: job.companyId,
            status: "applied",
            appliedAt: now,
            updatedAt: now,
            coverLetter: input.coverLetter,
            portfolioUrl: input.portfolioUrl,
            expectedSalary: input.expectedSalary,
            salaryCurrency: candidate.salaryCurrency,
            availability: input.availability,
            resumeName: input.resumeName,
            screeningAnswers: input.screeningAnswers,
            timeline: [{ id: makeId("tl"), status: "applied", at: now, note: "Application submitted" }],
            notes: [],
            matchScore: computeMatch(candidate, job).score,
          };
          set((s) => ({ applications: [app, ...s.applications] }));
          addNotification(
            notification(
              "employer",
              "application",
              "New application received",
              `${candidate.name} applied for ${job.title}.`,
              `/employer/jobs/${job.id}/applicants`,
            ),
          );
          return app;
        },
        updateApplicationStatus: (id, status, note) => {
          const app = findOrThrow(get().applications, id, "Application");
          const job = get().jobs.find((j) => j.id === app.jobId);
          const updated: Application = {
            ...app,
            status,
            updatedAt: nowIso(),
            timeline: nextTimeline(app, status, note),
          };
          set((s) => ({ applications: s.applications.map((a) => (a.id === id ? updated : a)) }));
          addNotification(
            notification(
              "seeker",
              "status_change",
              `Application ${APPLICATION_STATUS_LABEL[status].toLowerCase()}`,
              `Your application for ${job?.title ?? "a role"} is now "${APPLICATION_STATUS_LABEL[status]}".`,
              `/applications/${id}`,
            ),
          );
          return updated;
        },
        withdrawApplication: (id) => {
          const app = findOrThrow(get().applications, id, "Application");
          if (app.status === "hired" || app.status === "withdrawn") throw new Error("This application can no longer be withdrawn");
          const updated: Application = {
            ...app,
            status: "withdrawn",
            updatedAt: nowIso(),
            timeline: nextTimeline(app, "withdrawn", "Withdrawn by candidate"),
          };
          set((s) => ({ applications: s.applications.map((a) => (a.id === id ? updated : a)) }));
          const job = get().jobs.find((j) => j.id === app.jobId);
          const cand = get().candidates.find((c) => c.id === app.candidateId);
          addNotification(
            notification(
              "employer",
              "application",
              "Application withdrawn",
              `${cand?.name ?? "A candidate"} withdrew from ${job?.title ?? "a role"}.`,
              `/employer/jobs/${app.jobId}/applicants`,
            ),
          );
          return updated;
        },
        addApplicationNote: (id, text, authorName) => {
          const app = findOrThrow(get().applications, id, "Application");
          const updated: Application = {
            ...app,
            notes: [...app.notes, { id: makeId("note"), authorName, text, at: nowIso() }],
          };
          set((s) => ({ applications: s.applications.map((a) => (a.id === id ? updated : a)) }));
          return updated;
        },

        /* ----------------------------- interviews ---------------------------- */
        scheduleInterview: (input) => {
          const app = findOrThrow(get().applications, input.applicationId, "Application");
          const job = get().jobs.find((j) => j.id === app.jobId);
          const interview: Interview = {
            ...input,
            id: makeId("int"),
            jobId: app.jobId,
            candidateId: app.candidateId,
            companyId: app.companyId,
            status: "scheduled",
          };
          set((s) => ({ interviews: [interview, ...s.interviews] }));
          if (app.status !== "interview" && app.status !== "offered" && app.status !== "hired") {
            get().updateApplicationStatus(app.id, "interview", `${input.type} scheduled`);
          }
          addNotification(
            notification(
              "seeker",
              "interview",
              "Interview invitation",
              `${input.type} for ${job?.title ?? "your application"} has been scheduled.`,
              "/interviews",
            ),
          );
          return interview;
        },
        rescheduleInterview: (id, scheduledAt, notes) => {
          const existing = findOrThrow(get().interviews, id, "Interview");
          const updated: Interview = {
            ...existing,
            scheduledAt,
            status: "scheduled",
            notes: notes ?? existing.notes,
          };
          set((s) => ({ interviews: s.interviews.map((i) => (i.id === id ? updated : i)) }));
          addNotification(
            notification("seeker", "interview", "Interview rescheduled", "Your interview time has been updated.", "/interviews"),
          );
          return updated;
        },
        setInterviewStatus: (id, status, notes) => {
          const existing = findOrThrow(get().interviews, id, "Interview");
          const updated: Interview = { ...existing, status, notes: notes ?? existing.notes };
          set((s) => ({ interviews: s.interviews.map((i) => (i.id === id ? updated : i)) }));
          if (status === "cancelled") {
            addNotification(
              notification("seeker", "interview", "Interview cancelled", "An interview was cancelled by the employer.", "/interviews"),
            );
          }
          return updated;
        },
        updateInterviewNotes: (id, notes) => {
          set((s) => ({ interviews: s.interviews.map((i) => (i.id === id ? { ...i, notes } : i)) }));
        },

        /* ------------------------------ messaging ---------------------------- */
        sendMessage: (conversationId, senderRole, senderName, text) => {
          const conv = findOrThrow(get().conversations, conversationId, "Conversation");
          const message: Message = { id: makeId("msg"), senderRole, senderName, text, at: nowIso() };
          const other = senderRole === "seeker" ? "employer" : "seeker";
          const updated: Conversation = {
            ...conv,
            messages: [...conv.messages, message],
            updatedAt: message.at,
            unread: { ...conv.unread, [other]: conv.unread[other] + 1 },
          };
          set((s) => ({ conversations: s.conversations.map((c) => (c.id === conversationId ? updated : c)) }));
          addNotification(
            notification(
              other,
              "message",
              `New message from ${senderName}`,
              text.length > 80 ? `${text.slice(0, 77)}…` : text,
              other === "seeker" ? "/messages" : "/employer/messages",
            ),
          );
          return message;
        },
        startConversation: (input) => {
          const existing = get().conversations.find(
            (c) =>
              c.candidateId === input.candidateId &&
              c.companyId === input.companyId &&
              (input.applicationId ? c.applicationId === input.applicationId : true),
          );
          if (existing) return existing;
          const conv: Conversation = {
            id: makeId("conv"),
            ...input,
            messages: [],
            unread: { seeker: 0, employer: 0 },
            updatedAt: nowIso(),
          };
          set((s) => ({ conversations: [conv, ...s.conversations] }));
          return conv;
        },
        markConversationRead: (id, role) => {
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === id && c.unread[role] > 0 ? { ...c, unread: { ...c.unread, [role]: 0 } } : c,
            ),
          }));
        },

        /* --------------------------- notifications --------------------------- */
        pushNotification: (n) => {
          const full = notification(n.role, n.type, n.title, n.body, n.href);
          addNotification(full);
          return full;
        },
        markNotificationRead: (id) =>
          set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllNotificationsRead: (role) =>
          set((s) => ({ notifications: s.notifications.map((n) => (n.role === role ? { ...n, read: true } : n)) })),

        /* ------------------------------ profiles ----------------------------- */
        updateCandidate: (id, patch) => {
          const existing = findOrThrow(get().candidates, id, "Candidate");
          const updated = { ...existing, ...patch };
          set((s) => ({
            candidates: s.candidates.map((c) => (c.id === id ? updated : c)),
            users: s.users.map((u) => (u.candidateId === id && patch.name ? { ...u, name: patch.name } : u)),
          }));
          return updated;
        },
        updateCompany: (id, patch) => {
          const existing = findOrThrow(get().companies, id, "Company");
          const updated = { ...existing, ...patch };
          set((s) => ({ companies: s.companies.map((c) => (c.id === id ? updated : c)) }));
          return updated;
        },

        /* -------------------- projects, proposals, contracts ----------------- */
        createProject: (input, postedBy) => {
          const project: FreelanceProject = { ...input, id: makeId("proj"), postedBy, postedAt: nowIso() };
          set((s) => ({ projects: [project, ...s.projects] }));
          return project;
        },
        setProjectStatus: (id, status) => {
          findOrThrow(get().projects, id, "Project");
          set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, status } : p)) }));
        },
        submitProposal: (input) => {
          const project = findOrThrow(get().projects, input.projectId, "Project");
          if (project.status !== "open") throw new Error("This project is not accepting proposals");
          const duplicate = get().proposals.find(
            (p) => p.projectId === input.projectId && p.freelancerId === input.freelancerId && p.status !== "withdrawn",
          );
          if (duplicate) throw new Error("You have already submitted a proposal for this project");
          const proposal: Proposal = { ...input, id: makeId("prop"), status: "pending", submittedAt: nowIso() };
          set((s) => ({ proposals: [proposal, ...s.proposals] }));
          const freelancer = get().candidates.find((c) => c.id === input.freelancerId);
          addNotification(
            notification(
              "employer",
              "proposal",
              "New project proposal",
              `${freelancer?.name ?? "A freelancer"} sent a proposal for ${project.title}.`,
              "/employer/proposals",
            ),
          );
          return proposal;
        },
        withdrawProposal: (id) => {
          const p = findOrThrow(get().proposals, id, "Proposal");
          const updated: Proposal = { ...p, status: "withdrawn" };
          set((s) => ({ proposals: s.proposals.map((x) => (x.id === id ? updated : x)) }));
          return updated;
        },
        rejectProposal: (id) => {
          const p = findOrThrow(get().proposals, id, "Proposal");
          const project = get().projects.find((x) => x.id === p.projectId);
          const updated: Proposal = { ...p, status: "rejected" };
          set((s) => ({ proposals: s.proposals.map((x) => (x.id === id ? updated : x)) }));
          addNotification(
            notification(
              "seeker",
              "proposal",
              "Proposal declined",
              `Your proposal for ${project?.title ?? "a project"} was not selected.`,
              "/contracts",
            ),
          );
          return updated;
        },
        acceptProposal: (id) => {
          const proposal = findOrThrow(get().proposals, id, "Proposal");
          if (proposal.status !== "pending") throw new Error("Only pending proposals can be accepted");
          const project = findOrThrow(get().projects, proposal.projectId, "Project");
          const templateTotal = project.milestones.reduce((sum, m) => sum + m.amount, 0) || 1;
          let elapsed = 0;
          const milestones: Contract["milestones"] = (project.milestones.length
            ? project.milestones
            : [{ title: "Project delivery", amount: proposal.price, dueInDays: proposal.deliveryWeeks * 7 }]
          ).map((m, i, arr) => {
            elapsed += m.dueInDays;
            // hourly proposals quote a rate (not a total), so keep the project's milestone budget as-is
            const scaled =
              project.budgetType === "hourly" && project.milestones.length > 0
                ? m.amount
                : arr.length === 1
                  ? proposal.price
                  : Math.round((m.amount / templateTotal) * proposal.price);
            return {
              id: makeId("ms"),
              title: m.title,
              description: `Deliverable ${i + 1} of ${arr.length} for "${project.title}".`,
              amount: scaled,
              dueDate: addDaysIso(elapsed),
              status: "pending" as const,
            };
          });
          const contract: Contract = {
            id: makeId("ctr"),
            projectId: project.id,
            proposalId: proposal.id,
            clientCompanyId: project.clientCompanyId,
            freelancerId: proposal.freelancerId,
            title: project.title,
            totalAmount: milestones.reduce((sum, m) => sum + m.amount, 0),
            token: proposal.currency,
            network: toNetwork(project.blockchain),
            status: "active",
            startedAt: nowIso(),
            milestones,
            escrowBalance: 0,
            escrowAddress: mockWalletAddress(),
          };
          set((s) => ({
            proposals: s.proposals.map((p) =>
              p.id === id ? { ...p, status: "accepted" } : p.projectId === project.id && p.status === "pending" ? { ...p, status: "rejected" } : p,
            ),
            projects: s.projects.map((p) => (p.id === project.id ? { ...p, status: "in_progress" } : p)),
            contracts: [contract, ...s.contracts],
          }));
          addNotification(
            notification(
              "seeker",
              "proposal",
              "Proposal accepted 🎉",
              `Your proposal for ${project.title} was accepted. The contract workspace is ready.`,
              `/contracts/${contract.id}`,
            ),
          );
          return contract;
        },
        fundMilestone: (contractId, milestoneId) => {
          const tx = mutateContract(
            contractId,
            milestoneId,
            "fund",
            (c, m) => ({
              ...c,
              escrowBalance: c.escrowBalance + m.amount,
              milestones: c.milestones.map((x) => (x.id === milestoneId ? { ...x, status: "funded" as const } : x)),
            }),
            (m) => (m.status !== "pending" ? "This milestone is already funded" : null),
          );
          const wallet = get().wallet;
          if (wallet.connected && wallet.balances[tx.token] !== undefined) {
            set((s) => ({
              wallet: { ...s.wallet, balances: { ...s.wallet.balances, [tx.token]: Math.max(0, s.wallet.balances[tx.token] - tx.amount) } },
            }));
          }
          const c = get().contracts.find((x) => x.id === contractId);
          addNotification(
            notification("seeker", "payment", "Escrow funded", `${tx.amount} ${tx.token} was deposited into escrow for ${c?.title ?? "your contract"} (simulated).`, `/contracts/${contractId}`),
          );
          return tx;
        },
        submitMilestone: (contractId, milestoneId, note) => {
          const tx = mutateContract(
            contractId,
            milestoneId,
            "submit",
            (c) => ({
              ...c,
              milestones: c.milestones.map((x) =>
                x.id === milestoneId ? { ...x, status: "submitted" as const, submissionNote: note, submittedAt: nowIso() } : x,
              ),
            }),
            (m) => (m.status !== "funded" ? "Milestone must be funded before work can be submitted" : null),
          );
          const c = get().contracts.find((x) => x.id === contractId);
          addNotification(
            notification("employer", "payment", "Milestone submitted", `A milestone on ${c?.title ?? "a contract"} is ready for review.`, "/employer/contracts"),
          );
          return tx;
        },
        approveMilestone: (contractId, milestoneId) => {
          const tx = mutateContract(
            contractId,
            milestoneId,
            "approve",
            (c) => ({
              ...c,
              milestones: c.milestones.map((x) => (x.id === milestoneId ? { ...x, status: "approved" as const, approvedAt: nowIso() } : x)),
            }),
            (m) => (m.status !== "submitted" ? "Only submitted milestones can be approved" : null),
          );
          const c = get().contracts.find((x) => x.id === contractId);
          addNotification(
            notification("seeker", "payment", "Milestone approved", `Your work on ${c?.title ?? "a contract"} was approved. Payment release is pending.`, `/contracts/${contractId}`),
          );
          return tx;
        },
        releasePayment: (contractId, milestoneId) => {
          const tx = mutateContract(
            contractId,
            milestoneId,
            "release",
            (c, m) => {
              const milestones = c.milestones.map((x) =>
                x.id === milestoneId ? { ...x, status: "released" as const, releasedAt: nowIso() } : x,
              );
              const done = milestones.every((x) => x.status === "released");
              return {
                ...c,
                milestones,
                escrowBalance: Math.max(0, c.escrowBalance - m.amount),
                status: done ? "completed" : c.status,
              };
            },
            (m) => (m.status !== "approved" ? "Approve the milestone before releasing payment" : null),
          );
          const c = get().contracts.find((x) => x.id === contractId);
          if (c?.status === "completed") {
            set((s) => ({ projects: s.projects.map((p) => (p.id === c.projectId ? { ...p, status: "completed" } : p)) }));
          }
          addNotification(
            notification("seeker", "payment", "Payment released", `${tx.amount} ${tx.token} was released from escrow (simulated).`, `/contracts/${contractId}`),
          );
          return tx;
        },

        /* ------------------------------- bounties ---------------------------- */
        submitBountyInterest: (bountyId, candidateId, note) => {
          findOrThrow(get().bounties, bountyId, "Bounty");
          const dup = get().bountyInterests.find((b) => b.bountyId === bountyId && b.candidateId === candidateId);
          if (dup) throw new Error("You have already submitted interest for this bounty");
          const interest: BountyInterest = {
            id: makeId("bi"),
            bountyId,
            candidateId,
            note,
            submittedAt: nowIso(),
            status: "submitted",
          };
          set((s) => ({ bountyInterests: [interest, ...s.bountyInterests] }));
          return interest;
        },

        /* -------------------------------- wallet ----------------------------- */
        connectWallet: (provider) =>
          set((s) => ({
            wallet: {
              ...s.wallet,
              connected: true,
              provider,
              address: s.wallet.address ?? mockWalletAddress(),
              balances: { ...DEFAULT_BALANCES, ...s.wallet.balances },
            },
          })),
        disconnectWallet: () =>
          set((s) => ({ wallet: { ...s.wallet, connected: false, provider: null, address: null } })),
        switchWalletNetwork: (network) => set((s) => ({ wallet: { ...s.wallet, network } })),

        /* ---------------------------------- AI ------------------------------- */
        addAIHistory: (item) => {
          const full: AIHistoryItem = { ...item, id: makeId("ai"), createdAt: nowIso() };
          set((s) => ({ aiHistory: [full, ...s.aiHistory] }));
          return full;
        },

        /* ----------------------------- subscriptions ------------------------- */
        setPlan: (userId, plan) => {
          const price = get().adminSettings.plans.find((p) => p.id === plan)?.priceMonthly ?? 0;
          set((s) => ({
            users: s.users.map((u) => (u.id === userId ? { ...u, plan } : u)),
            subscriptions: [
              ...s.subscriptions.filter((x) => x.userId !== userId),
              { userId, plan, status: "active", renewsAt: addDaysIso(30), amountMonthly: price },
            ],
          }));
        },

        /* --------------------------------- admin ----------------------------- */
        setUserStatus: (userId, status) =>
          set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, status } : u)) })),
        setCompanyVerified: (companyId, verified) =>
          set((s) => ({ companies: s.companies.map((c) => (c.id === companyId ? { ...c, verified } : c)) })),
        setCompanySuspended: (companyId, suspended) =>
          set((s) => ({ companies: s.companies.map((c) => (c.id === companyId ? { ...c, suspended } : c)) })),
        moderateJob: (jobId, action) => {
          const map: Record<typeof action, JobStatus> = {
            approve: "published",
            reject: "rejected",
            hide: "hidden",
            restore: "published",
          };
          const existing = findOrThrow(get().jobs, jobId, "Job");
          const updated: Job = { ...existing, status: map[action], updatedAt: nowIso() };
          set((s) => ({ jobs: s.jobs.map((j) => (j.id === jobId ? updated : j)) }));
          addNotification(
            notification(
              "employer",
              "system",
              action === "approve" ? "Job approved" : action === "reject" ? "Job rejected" : "Job moderation update",
              `${existing.title} was ${action === "approve" ? "approved and is now live" : action === "reject" ? "rejected by moderators" : "updated by moderators"}.`,
              "/employer/jobs",
            ),
          );
          return updated;
        },
        setReportStatus: (id, status) => {
          const r = findOrThrow(get().reports, id, "Report");
          const updated: Report = { ...r, status };
          set((s) => ({ reports: s.reports.map((x) => (x.id === id ? updated : x)) }));
          return updated;
        },
        updateAdminSettings: (patch) => set((s) => ({ adminSettings: { ...s.adminSettings, ...patch } })),

        /* ---------------------------------- demo ----------------------------- */
        resetDemoData: () => {
          resetClock();
          const fresh = getInitialData();
          set({ ...fresh, hydrated: true, currentUserId: get().currentUserId });
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => {
        const { hydrated: _h, ...rest } = s;
        void _h;
        // functions are dropped by JSON serialisation automatically
        return rest as unknown as AppState;
      },
    },
  ),
);
