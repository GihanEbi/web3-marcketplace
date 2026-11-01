import type { AdminAnalytics, AdminSettings, Report, Subscription } from "@/types";
import { JOB_CATEGORIES } from "@/lib/constants";
import { daysAgo, daysFromNow } from "./helpers";

export const reports: Report[] = [
  {
    id: "rep-001",
    targetType: "job",
    targetId: "job-026",
    targetLabel: "Smart Contract Developer, NFT Platform (Meridian Labs)",
    reportedBy: "Zainab Ahmed",
    relatedUser: "Priya Raman",
    reason: "Suspected scam / asks for upfront payment",
    details:
      "After applying, the recruiter asked for a refundable 'onboarding deposit' in ETH before sharing the interview schedule. The listing has been hidden while we investigate.",
    status: "in_review",
    reportedAt: daysAgo(2, 14),
  },
  {
    id: "rep-002",
    targetType: "user",
    targetId: "usr-c-018",
    targetLabel: "Olivia Nguyen (job seeker)",
    reportedBy: "Maya Lindqvist",
    relatedUser: "Olivia Nguyen",
    reason: "Spam",
    details:
      "The account submitted the same generic application to 14 unrelated roles within an hour and messaged recruiters with promotional links. Account suspended.",
    status: "resolved",
    reportedAt: daysAgo(9, 10),
  },
  {
    id: "rep-003",
    targetType: "company",
    targetId: "co-010",
    targetLabel: "Cinder Games",
    reportedBy: "Dmitri Volkov",
    relatedUser: "Sofia Marchetti",
    reason: "Misleading salary",
    details:
      "The Web3 Game Backend Engineer listing advertises $90k-$120k, but the recruiter told me during a call that the base is closer to $60k with the remainder in game tokens.",
    status: "open",
    reportedAt: daysAgo(1, 16),
  },
  {
    id: "rep-004",
    targetType: "message",
    targetId: "msg-conv-011-5",
    targetLabel: "Message in conversation conv-011 (Zainab Ahmed)",
    reportedBy: "Maya Lindqvist",
    relatedUser: "Zainab Ahmed",
    reason: "Spam",
    details:
      "Candidate followed up several times in a short window asking for an immediate decision. Review found the messages polite and within normal behaviour.",
    status: "dismissed",
    reportedAt: daysAgo(0, 8),
  },
  {
    id: "rep-005",
    targetType: "job",
    targetId: "job-020",
    targetLabel: "Senior Product Manager, Wallet (Lumen Wallet)",
    reportedBy: "Noor Al-Rashid",
    relatedUser: "Priya Raman",
    reason: "Misleading salary",
    details:
      "The advertised range of $130k-$165k does not match what the recruiter said in the first call. The listing was rejected during moderation and the employer was asked to revise it.",
    status: "resolved",
    reportedAt: daysAgo(6, 11),
  },
  {
    id: "rep-006",
    targetType: "job",
    targetId: "job-025",
    targetLabel: "NFT Marketplace Frontend Developer (Meridian Labs)",
    reportedBy: "Yuki Tanaka",
    relatedUser: "Priya Raman",
    reason: "Expired or stale posting",
    details:
      "The application deadline passed three days ago but the role is still listed as published and accepting applications.",
    status: "open",
    reportedAt: daysAgo(1, 9),
  },
  {
    id: "rep-007",
    targetType: "user",
    targetId: "usr-c-017",
    targetLabel: "Mateo Rossi (job seeker)",
    reportedBy: "Trust & Safety checks",
    relatedUser: "Mateo Rossi",
    reason: "Possible duplicate account",
    details:
      "Automated checks found a similar profile (same wallet history and portfolio links) registered under a different email. Account is pending manual verification.",
    status: "in_review",
    reportedAt: daysAgo(4, 13),
  },
  {
    id: "rep-008",
    targetType: "company",
    targetId: "co-005",
    targetLabel: "Lumen Wallet",
    reportedBy: "Ivan Kovalenko",
    relatedUser: "Priya Raman",
    reason: "Impersonation concern",
    details:
      "The company's name is close to a well-known wallet brand and I wanted to confirm it is a legitimate, independent team. Moderators reviewed the documents and found no issue.",
    status: "dismissed",
    reportedAt: daysAgo(5, 15),
  },
];

export const subscriptions: Subscription[] = [
  { userId: "usr-c-001", plan: "professional", status: "active", renewsAt: daysFromNow(14, 0), amountMonthly: 19 },
  { userId: "usr-c-003", plan: "professional", status: "active", renewsAt: daysFromNow(21, 0), amountMonthly: 19 },
  { userId: "usr-c-005", plan: "professional", status: "active", renewsAt: daysFromNow(8, 0), amountMonthly: 19 },
  { userId: "usr-c-009", plan: "professional", status: "active", renewsAt: daysFromNow(27, 0), amountMonthly: 19 },
  { userId: "usr-c-011", plan: "professional", status: "trialing", renewsAt: daysFromNow(6, 0), amountMonthly: 19 },
  { userId: "usr-c-012", plan: "professional", status: "active", renewsAt: daysFromNow(3, 0), amountMonthly: 19 },
  { userId: "usr-c-014", plan: "professional", status: "cancelled", renewsAt: daysFromNow(11, 0), amountMonthly: 19 },
  { userId: "usr-e-001", plan: "business", status: "active", renewsAt: daysFromNow(19, 0), amountMonthly: 99 },
  { userId: "usr-e-002", plan: "business", status: "active", renewsAt: daysFromNow(12, 0), amountMonthly: 99 },
  { userId: "usr-e-003", plan: "business", status: "active", renewsAt: daysFromNow(25, 0), amountMonthly: 99 },
  { userId: "usr-e-004", plan: "business", status: "active", renewsAt: daysFromNow(2, 0), amountMonthly: 99 },
];

export const adminSettings: AdminSettings = {
  categories: [...JOB_CATEGORIES],
  networks: [
    { name: "Ethereum", enabled: true },
    { name: "Polygon", enabled: true },
    { name: "Base", enabled: true },
    { name: "Arbitrum", enabled: true },
  ],
  plans: [
    {
      id: "free",
      name: "Free",
      priceMonthly: 0,
      description: "Everything you need to start exploring Web3 jobs.",
      features: ["Basic profile", "Job search", "Job applications", "Limited AI assistance"],
      highlighted: false,
    },
    {
      id: "professional",
      name: "Professional",
      priceMonthly: 19,
      description: "Level up your job search with AI and deeper insights.",
      features: [
        "Advanced AI assistance",
        "Resume analysis",
        "Enhanced professional tools",
        "Additional application insights",
      ],
      highlighted: false,
    },
    {
      id: "business",
      name: "Business",
      priceMonthly: 99,
      description: "Hire faster with a full recruitment suite for growing teams.",
      features: [
        "Job posting management",
        "Recruitment dashboard",
        "Applicant tracking",
        "AI recruitment tools",
        "Candidate discovery",
      ],
      highlighted: true,
    },
  ],
  features: {
    aiAssistant: true,
    cryptoPayments: true,
    freelanceProjects: true,
    web3Bounties: true,
    requireJobApproval: true,
    messaging: true,
  },
};

const months = ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26", "Oct 26"];

const seekers = [312, 398, 497, 611, 748, 902, 1060, 1233, 1402, 1577, 1712, 1830];
const employers = [41, 58, 79, 101, 126, 152, 178, 205, 232, 255, 272, 287];
const postings = [38, 44, 49, 57, 66, 78, 89, 101, 118, 134, 149, 164];
const applicationsPerMonth = [410, 498, 602, 735, 890, 1060, 1255, 1430, 1630, 1820, 1985, 2150];
const subscriptionRevenue = [3420, 3890, 4350, 4980, 5520, 6210, 6940, 7580, 8330, 9060, 9640, 10105];
const feeRevenue = [640, 720, 860, 980, 1150, 1320, 1540, 1730, 1980, 2210, 2480, 2760];

/** 214 Professional x $19 + 61 Business x $99 = $10,105 MRR, matching the final month of subscription revenue. */
const planDistribution = [
  { plan: "Free", users: 1842 },
  { plan: "Professional", users: 214 },
  { plan: "Business", users: 61 },
];

export const adminAnalytics: AdminAnalytics = {
  userGrowth: months.map((month, i) => ({ month, seekers: seekers[i], employers: employers[i] })),
  jobActivity: months.map((month, i) => ({ month, postings: postings[i], applications: applicationsPerMonth[i] })),
  revenue: months.map((month, i) => ({ month, subscriptions: subscriptionRevenue[i], fees: feeRevenue[i] })),
  planDistribution,
  mrr: 214 * 19 + 61 * 99,
  totalRevenue:
    subscriptionRevenue.reduce((total, v) => total + v, 0) + feeRevenue.reduce((total, v) => total + v, 0),
};
