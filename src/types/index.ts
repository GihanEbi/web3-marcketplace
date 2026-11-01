/**
 * Domain models for the Web3 Job Marketplace (frontend-only, mock data).
 * All dates are ISO-8601 strings so they serialise cleanly to localStorage.
 */

export type Role = "seeker" | "employer" | "admin";
export type PlanId = "free" | "professional" | "business";
export type AccountStatus = "active" | "suspended" | "pending";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  joinedAt: string;
  plan: PlanId;
  /** set when role === "seeker" */
  candidateId?: string;
  /** set when role === "employer" */
  companyId?: string;
  /** job title for employer accounts, e.g. "Head of Talent" */
  title?: string;
  walletAddress?: string;
  lastActiveAt?: string;
}

/* ------------------------------------------------------------------ */
/* Companies                                                           */
/* ------------------------------------------------------------------ */

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";

export interface Company {
  id: string;
  name: string;
  /** Short brand initials used for the generated logo, e.g. "NV" */
  initials: string;
  /** Tailwind-safe hex colours for the generated gradient logo */
  logoFrom: string;
  logoTo: string;
  industry: string;
  location: string;
  size: CompanySize;
  founded: number;
  website: string;
  tagline: string;
  about: string;
  techStack: string[];
  ecosystems: Blockchain[];
  verified: boolean;
  /** Admin can suspend a company's listings */
  suspended: boolean;
  isDao: boolean;
  /** All seeded companies are fictional demo organisations */
  isDemo: boolean;
  walletAddress?: string;
  social: { twitter?: string; github?: string; linkedin?: string; discord?: string };
}

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Freelance" | "Internship";
export type WorkMode = "Remote" | "Hybrid" | "Onsite";
export type ExperienceLevel = "Entry" | "Mid" | "Senior" | "Lead";
export type Blockchain =
  | "Ethereum"
  | "Polygon"
  | "Base"
  | "Arbitrum"
  | "Solana"
  | "Optimism"
  | "Avalanche"
  | "Cosmos"
  | "Multi-chain";
export type SalaryCurrency = "USD" | "USDC" | "ETH" | "SOL" | "DAI";
export type SalaryPeriod = "year" | "month" | "hour";

export type JobStatus =
  | "draft"
  | "pending" // awaiting admin approval
  | "published"
  | "paused"
  | "closed"
  | "rejected"
  | "hidden";

export interface Job {
  id: string;
  companyId: string;
  /** employer user who created it */
  postedBy: string;
  title: string;
  category: string;
  type: EmploymentType;
  workMode: WorkMode;
  location: string;
  experience: ExperienceLevel;
  salaryMin: number;
  salaryMax: number;
  currency: SalaryCurrency;
  salaryPeriod: SalaryPeriod;
  cryptoPayment: boolean;
  /** tokens accepted for payment when cryptoPayment is true */
  paymentTokens: string[];
  blockchain: Blockchain;
  skills: string[];
  description: string;
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  screeningQuestions: string[];
  deadline: string;
  postedAt: string;
  updatedAt: string;
  status: JobStatus;
  featured: boolean;
  isDao: boolean;
  daoName?: string;
  /** DAO jobs only */
  contributorType?: "Core contributor" | "Part-time contributor" | "Grant-funded";
}

/** Input used by the job form (create + update) */
export type JobInput = Omit<Job, "id" | "postedAt" | "updatedAt" | "postedBy" | "featured"> & {
  featured?: boolean;
};

/* ------------------------------------------------------------------ */
/* Candidates                                                          */
/* ------------------------------------------------------------------ */

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string; // yyyy-MM
  endDate: string | null; // null = present
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startYear: number;
  endYear: number | null;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: number;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
}

export type Availability = "Immediately" | "2 weeks" | "1 month" | "Not looking";
export type RemotePreference = "Remote only" | "Hybrid" | "Onsite" | "Flexible";

export interface Candidate {
  id: string;
  userId: string;
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  /** Optional image URL; UI falls back to generated initials avatar */
  avatar?: string;
  summary: string;
  skills: string[];
  yearsOfExperience: number;
  experienceLevel: ExperienceLevel;
  experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  portfolio: PortfolioProject[];
  githubUrl: string;
  linkedinUrl: string;
  website: string;
  preferredJobTypes: EmploymentType[];
  preferredEcosystems: Blockchain[];
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  salaryCurrency: SalaryCurrency;
  remotePreference: RemotePreference;
  availability: Availability;
  resume?: { fileName: string; sizeKb: number; uploadedAt: string };
  walletAddress?: string;
  /** Used by freelance features */
  hourlyRate?: number;
}

/* ------------------------------------------------------------------ */
/* Applications (ATS)                                                  */
/* ------------------------------------------------------------------ */

/**
 * Single status enum shared by candidate + employer views.
 * `under_review` is labelled "Under Review" for candidates and "Screening" in the ATS.
 */
export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface TimelineEvent {
  id: string;
  status: ApplicationStatus;
  at: string;
  note?: string;
}

export interface InternalNote {
  id: string;
  authorName: string;
  text: string;
  at: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  companyId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  coverLetter: string;
  portfolioUrl: string;
  expectedSalary: number;
  salaryCurrency: SalaryCurrency;
  availability: Availability;
  resumeName: string;
  screeningAnswers: { question: string; answer: string }[];
  timeline: TimelineEvent[];
  notes: InternalNote[];
  /** Deterministic score 0-100, computed at submission time */
  matchScore: number;
}

export interface ApplicationInput {
  jobId: string;
  candidateId: string;
  coverLetter: string;
  portfolioUrl: string;
  expectedSalary: number;
  availability: Availability;
  resumeName: string;
  screeningAnswers: { question: string; answer: string }[];
}

/* ------------------------------------------------------------------ */
/* Interviews                                                          */
/* ------------------------------------------------------------------ */

export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";
export type InterviewType = "Intro call" | "Technical" | "System design" | "Culture fit" | "Final round";

export interface Interview {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  companyId: string;
  type: InterviewType;
  scheduledAt: string;
  durationMin: number;
  meetingLink: string;
  status: InterviewStatus;
  notes: string;
  interviewerName: string;
}

export type InterviewInput = Pick<
  Interview,
  "applicationId" | "type" | "scheduledAt" | "durationMin" | "meetingLink" | "notes" | "interviewerName"
>;

/* ------------------------------------------------------------------ */
/* Messaging + notifications                                           */
/* ------------------------------------------------------------------ */

export interface Message {
  id: string;
  senderRole: "seeker" | "employer";
  senderName: string;
  text: string;
  at: string;
}

export interface Conversation {
  id: string;
  candidateId: string;
  companyId: string;
  /** employer user on the other side */
  employerUserId: string;
  subject: string;
  /** application / job context shown above the chat */
  applicationId?: string;
  jobId?: string;
  messages: Message[];
  /** number of messages the given role has not read yet */
  unread: { seeker: number; employer: number };
  updatedAt: string;
}

export type NotificationType =
  | "application"
  | "status_change"
  | "interview"
  | "message"
  | "recommendation"
  | "proposal"
  | "payment"
  | "system";

export interface AppNotification {
  id: string;
  /** which role's inbox the notification belongs to */
  role: Role;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

/* ------------------------------------------------------------------ */
/* Freelance projects, bounties, contracts, escrow                     */
/* ------------------------------------------------------------------ */

export type PaymentToken = "USDC" | "ETH" | "DAI" | "MATIC" | "SOL" | "USD";
export type Network = "Ethereum" | "Polygon" | "Base" | "Arbitrum";

export type ProjectStatus = "draft" | "open" | "in_progress" | "completed" | "closed";

export interface ProjectMilestoneTemplate {
  title: string;
  amount: number;
  dueInDays: number;
}

export interface FreelanceProject {
  id: string;
  clientCompanyId: string;
  postedBy: string;
  title: string;
  description: string;
  skills: string[];
  budgetType: "fixed" | "hourly";
  budgetMin: number;
  budgetMax: number;
  currency: PaymentToken;
  durationWeeks: number;
  blockchain: Blockchain;
  status: ProjectStatus;
  milestones: ProjectMilestoneTemplate[];
  postedAt: string;
  deadline: string;
}

export type ProjectInput = Omit<FreelanceProject, "id" | "postedAt" | "postedBy">;

export type ProposalStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface Proposal {
  id: string;
  projectId: string;
  freelancerId: string; // candidateId
  price: number;
  currency: PaymentToken;
  deliveryWeeks: number;
  coverLetter: string;
  status: ProposalStatus;
  submittedAt: string;
}

export interface ProposalInput {
  projectId: string;
  freelancerId: string;
  price: number;
  currency: PaymentToken;
  deliveryWeeks: number;
  coverLetter: string;
}

export type BountyStatus = "open" | "in_review" | "closed";

export interface Bounty {
  id: string;
  daoId: string; // companyId (isDao)
  title: string;
  description: string;
  rewardAmount: number;
  token: string;
  blockchain: Blockchain;
  skills: string[];
  deadline: string;
  postedAt: string;
  status: BountyStatus;
  deliverables: string[];
}

export interface BountyInterest {
  id: string;
  bountyId: string;
  candidateId: string;
  note: string;
  submittedAt: string;
  status: "submitted" | "accepted" | "rejected";
}

export type MilestoneStatus = "pending" | "funded" | "submitted" | "approved" | "released";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  submissionNote?: string;
  submittedAt?: string;
  approvedAt?: string;
  releasedAt?: string;
}

export interface Contract {
  id: string;
  projectId: string;
  proposalId: string;
  clientCompanyId: string;
  freelancerId: string; // candidateId
  title: string;
  totalAmount: number;
  token: PaymentToken;
  network: Network;
  status: "active" | "completed" | "cancelled";
  startedAt: string;
  milestones: Milestone[];
  /** Funds currently held in the simulated escrow */
  escrowBalance: number;
  /** Mock smart-contract address, clearly simulated */
  escrowAddress: string;
}

export type TransactionType = "fund" | "submit" | "approve" | "release";

export interface Transaction {
  id: string;
  contractId: string;
  milestoneId?: string;
  type: TransactionType;
  amount: number;
  token: PaymentToken;
  network: Network;
  hash: string;
  at: string;
  status: "confirmed" | "pending";
  /** always true – no real on-chain operation exists */
  simulated: true;
}

/* ------------------------------------------------------------------ */
/* Wallet                                                              */
/* ------------------------------------------------------------------ */

export type WalletProvider = "MetaMask" | "WalletConnect" | "Coinbase Wallet" | "Phantom" | "Rainbow";

export interface WalletState {
  connected: boolean;
  provider: WalletProvider | null;
  address: string | null;
  network: Network;
  balances: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/* AI                                                                  */
/* ------------------------------------------------------------------ */

export type AIHistoryType =
  | "recommendation"
  | "cover_letter"
  | "resume_analysis"
  | "recruitment_insight"
  | "job_description"
  | "interview_questions"
  | "chat";

export interface AIHistoryItem {
  id: string;
  role: Role;
  type: AIHistoryType;
  title: string;
  summary: string;
  createdAt: string;
}

export interface AIChatMessage {
  id: string;
  from: "user" | "assistant";
  text: string;
  at: string;
  /** optional rich cards rendered under assistant messages */
  cards?: AISuggestionCard[];
}

export interface AISuggestionCard {
  id: string;
  kind: "job" | "tip" | "action";
  title: string;
  subtitle?: string;
  href?: string;
}

export interface MatchResult {
  score: number; // 0-100
  matchingSkills: string[];
  missingSkills: string[];
  experienceFit: "under" | "match" | "over";
  experienceNote: string;
  salaryFit: "below" | "match" | "above" | "unknown";
  salaryNote: string;
  workModeFit: boolean;
  explanation: string;
}

export interface ResumeAnalysis {
  candidateId: string;
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  relevantSkills: string[];
  missingInfo: string[];
  formatting: string[];
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export type ReportStatus = "open" | "in_review" | "resolved" | "dismissed";

export interface Report {
  id: string;
  targetType: "job" | "user" | "company" | "message";
  targetId: string;
  targetLabel: string;
  reportedBy: string;
  relatedUser: string;
  reason: string;
  details: string;
  status: ReportStatus;
  reportedAt: string;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export interface AdminSettings {
  categories: string[];
  networks: { name: Network; enabled: boolean }[];
  plans: PlanConfig[];
  features: {
    aiAssistant: boolean;
    cryptoPayments: boolean;
    freelanceProjects: boolean;
    web3Bounties: boolean;
    requireJobApproval: boolean;
    messaging: boolean;
  };
}

export interface AdminAnalytics {
  userGrowth: { month: string; seekers: number; employers: number }[];
  jobActivity: { month: string; postings: number; applications: number }[];
  revenue: { month: string; subscriptions: number; fees: number }[];
  planDistribution: { plan: string; users: number }[];
  mrr: number;
  totalRevenue: number;
}

export interface Subscription {
  userId: string;
  plan: PlanId;
  status: "active" | "trialing" | "cancelled";
  renewsAt: string;
  amountMonthly: number;
}
