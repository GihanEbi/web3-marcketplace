import type { AccountStatus, PlanId, User } from "@/types";
import { candidates } from "./candidates";
import { daysAgo, mockAddress } from "./helpers";

interface SeekerMeta {
  joinedDaysAgo: number;
  lastActiveDaysAgo: number;
  plan: PlanId;
  status: AccountStatus;
}

/** Account-level facts for each seeker; names, emails and wallets come from the candidate profile. */
const seekerMeta: Record<string, SeekerMeta> = {
  "cand-001": { joinedDaysAgo: 210, lastActiveDaysAgo: 0, plan: "professional", status: "active" },
  "cand-002": { joinedDaysAgo: 160, lastActiveDaysAgo: 2, plan: "free", status: "active" },
  "cand-003": { joinedDaysAgo: 190, lastActiveDaysAgo: 1, plan: "professional", status: "active" },
  "cand-004": { joinedDaysAgo: 120, lastActiveDaysAgo: 4, plan: "free", status: "active" },
  "cand-005": { joinedDaysAgo: 175, lastActiveDaysAgo: 0, plan: "professional", status: "active" },
  "cand-006": { joinedDaysAgo: 75, lastActiveDaysAgo: 3, plan: "free", status: "active" },
  "cand-007": { joinedDaysAgo: 140, lastActiveDaysAgo: 5, plan: "free", status: "active" },
  "cand-008": { joinedDaysAgo: 130, lastActiveDaysAgo: 1, plan: "free", status: "active" },
  "cand-009": { joinedDaysAgo: 200, lastActiveDaysAgo: 0, plan: "professional", status: "active" },
  "cand-010": { joinedDaysAgo: 95, lastActiveDaysAgo: 6, plan: "free", status: "active" },
  "cand-011": { joinedDaysAgo: 60, lastActiveDaysAgo: 2, plan: "professional", status: "active" },
  "cand-012": { joinedDaysAgo: 150, lastActiveDaysAgo: 1, plan: "professional", status: "active" },
  "cand-013": { joinedDaysAgo: 85, lastActiveDaysAgo: 3, plan: "free", status: "active" },
  "cand-014": { joinedDaysAgo: 170, lastActiveDaysAgo: 9, plan: "professional", status: "active" },
  "cand-015": { joinedDaysAgo: 110, lastActiveDaysAgo: 2, plan: "free", status: "active" },
  "cand-016": { joinedDaysAgo: 6, lastActiveDaysAgo: 6, plan: "free", status: "pending" },
  "cand-017": { joinedDaysAgo: 5, lastActiveDaysAgo: 5, plan: "free", status: "pending" },
  "cand-018": { joinedDaysAgo: 100, lastActiveDaysAgo: 28, plan: "free", status: "suspended" },
  "cand-019": { joinedDaysAgo: 135, lastActiveDaysAgo: 1, plan: "free", status: "active" },
  "cand-020": { joinedDaysAgo: 105, lastActiveDaysAgo: 0, plan: "free", status: "active" },
};

const seekerUsers: User[] = candidates.map((c) => {
  const meta = seekerMeta[c.id];
  return {
    id: c.userId,
    name: c.name,
    email: c.email,
    role: "seeker",
    status: meta.status,
    joinedAt: daysAgo(meta.joinedDaysAgo, 10),
    plan: meta.plan,
    candidateId: c.id,
    walletAddress: c.walletAddress,
    lastActiveAt: daysAgo(meta.lastActiveDaysAgo, 8 + (meta.joinedDaysAgo % 9)),
  };
});

const employerUsers: User[] = [
  {
    id: "usr-e-001",
    name: "Maya Lindqvist",
    email: "maya.lindqvist@nimbuslabs.example",
    role: "employer",
    status: "active",
    joinedAt: daysAgo(240, 9),
    plan: "business",
    companyId: "co-001",
    title: "Head of Talent",
    walletAddress: mockAddress(3001),
    lastActiveAt: daysAgo(0, 8),
  },
  {
    id: "usr-e-002",
    name: "Daniel Okafor",
    email: "daniel.okafor@helixprotocol.example",
    role: "employer",
    status: "active",
    joinedAt: daysAgo(220, 11),
    plan: "business",
    companyId: "co-002",
    title: "Talent Partner",
    walletAddress: mockAddress(3002),
    lastActiveAt: daysAgo(1, 15),
  },
  {
    id: "usr-e-003",
    name: "Sofia Marchetti",
    email: "sofia.marchetti@orbitdao.example",
    role: "employer",
    status: "active",
    joinedAt: daysAgo(180, 13),
    plan: "business",
    companyId: "co-003",
    title: "Contributor Steward",
    walletAddress: mockAddress(3003),
    lastActiveAt: daysAgo(0, 7),
  },
  {
    id: "usr-e-004",
    name: "Kenji Watanabe",
    email: "kenji.watanabe@parallaxfinance.example",
    role: "employer",
    status: "active",
    joinedAt: daysAgo(150, 6),
    plan: "business",
    companyId: "co-004",
    title: "Head of People",
    walletAddress: mockAddress(3004),
    lastActiveAt: daysAgo(2, 4),
  },
  {
    id: "usr-e-005",
    name: "Priya Raman",
    email: "priya.raman@lumenwallet.example",
    role: "employer",
    status: "active",
    joinedAt: daysAgo(90, 14),
    plan: "free",
    companyId: "co-005",
    title: "Recruiting Lead",
    walletAddress: mockAddress(3005),
    lastActiveAt: daysAgo(3, 16),
  },
];

const adminUser: User = {
  id: "usr-admin",
  name: "Platform Admin",
  email: "admin@marketplace.example",
  role: "admin",
  status: "active",
  joinedAt: daysAgo(365, 9),
  plan: "free",
  lastActiveAt: daysAgo(0, 8),
};

/** 1 admin + 5 employers + 20 seekers = 26 users. */
export const users: User[] = [...seekerUsers, ...employerUsers, adminUser];
