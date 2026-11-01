import type {
  AIHistoryItem,
  AdminAnalytics,
  AdminSettings,
  AppNotification,
  Application,
  Bounty,
  BountyInterest,
  Candidate,
  Company,
  Contract,
  Conversation,
  FreelanceProject,
  Interview,
  Job,
  Proposal,
  Report,
  ResumeAnalysis,
  Subscription,
  Transaction,
  User,
} from "@/types";
import { adminAnalytics, adminSettings, reports, subscriptions } from "./admin";
import { aiHistory, resumeAnalyses } from "./ai";
import { applications } from "./applications";
import { bountyInterests, bounties } from "./bounties";
import { candidates } from "./candidates";
import { companies } from "./companies";
import { contracts, transactions } from "./contracts";
import { conversations } from "./conversations";
import { interviews } from "./interviews";
import { jobs } from "./jobs";
import { notifications } from "./notifications";
import { projects, proposals } from "./projects";
import { users } from "./users";

export interface SeedData {
  users: User[];
  companies: Company[];
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  interviews: Interview[];
  conversations: Conversation[];
  notifications: AppNotification[];
  projects: FreelanceProject[];
  proposals: Proposal[];
  bounties: Bounty[];
  bountyInterests: BountyInterest[];
  contracts: Contract[];
  transactions: Transaction[];
  aiHistory: AIHistoryItem[];
  resumeAnalyses: ResumeAnalysis[];
  reports: Report[];
  subscriptions: Subscription[];
  /** candidateId -> saved jobIds */
  savedJobs: Record<string, string[]>;
  adminSettings: AdminSettings;
  adminAnalytics: AdminAnalytics;
}

/** Published jobs the demo seeker (Aria Chen) has bookmarked but not applied to. */
const savedJobs: Record<string, string[]> = {
  "cand-001": ["job-002", "job-004", "job-011", "job-014", "job-023"],
  "cand-005": ["job-018", "job-025"],
  "cand-009": ["job-014"],
};

export const seedData: SeedData = {
  users,
  companies,
  jobs,
  candidates,
  applications,
  interviews,
  conversations,
  notifications,
  projects,
  proposals,
  bounties,
  bountyInterests,
  contracts,
  transactions,
  aiHistory,
  resumeAnalyses,
  reports,
  subscriptions,
  savedJobs,
  adminSettings,
  adminAnalytics,
};
