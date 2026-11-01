import type { Contract, Milestone, MilestoneStatus, Network, PaymentToken, Transaction } from "@/types";
import { daysAgo, daysFromNow, mockAddress, mockTxHash, pad } from "./helpers";

/** Every day-count in this file is "days before SEED_NOW" unless the name says otherwise. */
interface MilestoneSpec {
  title: string;
  description: string;
  amount: number;
  /** due date as days after the contract started */
  dueIn: number;
  status: MilestoneStatus;
  funded?: number;
  submitted?: number;
  approved?: number;
  released?: number;
  note?: string;
}

interface ContractSpec {
  n: number;
  projectId: string;
  proposalId: string;
  clientCompanyId: string;
  freelancerId: string;
  title: string;
  token: PaymentToken;
  network: Network;
  status: Contract["status"];
  /** days ago the contract started */
  started: number;
  milestones: MilestoneSpec[];
}

function dateFromOffset(startedAgo: number, dueIn: number): string {
  const ago = startedAgo - dueIn;
  return ago >= 0 ? daysAgo(ago, 17) : daysFromNow(-ago, 17);
}

const contractSpecs: ContractSpec[] = [
  {
    n: 1,
    projectId: "proj-001",
    proposalId: "prop-001",
    clientCompanyId: "co-001",
    freelancerId: "cand-001",
    title: "Audit & gas-optimise an ERC-4626 vault",
    token: "USDC",
    network: "Ethereum",
    status: "active",
    started: 30,
    milestones: [
      {
        title: "Threat model & initial audit report",
        description: "Deliver a threat model and a first audit report covering access control, rounding and inflation attacks.",
        amount: 3500, dueIn: 14, status: "released",
        funded: 30, submitted: 18, approved: 17, released: 16,
        note: "Report v1 attached with 2 medium and 5 low findings, each with a proof-of-concept test.",
      },
      {
        title: "Gas optimisation pass with benchmarks",
        description: "Optimise deposit, withdraw and harvest paths and provide Foundry gas snapshots before and after.",
        amount: 4500, dueIn: 28, status: "submitted",
        funded: 16, submitted: 3,
        note: "Pull request #42 merged to the staging branch. Average deposit gas down 24%, harvest down 31%. Snapshots included.",
      },
      {
        title: "Fix review & final report",
        description: "Verify remediation of all findings and issue the final signed-off report.",
        amount: 4000, dueIn: 40, status: "funded",
        funded: 3,
      },
    ],
  },
  {
    n: 2,
    projectId: "proj-002",
    proposalId: "prop-003",
    clientCompanyId: "co-001",
    freelancerId: "cand-005",
    title: "Wallet-connect onboarding flow in Next.js",
    token: "USDC",
    network: "Base",
    status: "active",
    started: 22,
    milestones: [
      {
        title: "Design review & connection architecture",
        description: "Review designs with Nimbus product, define connector architecture and error taxonomy.",
        amount: 2500, dueIn: 10, status: "released",
        funded: 22, submitted: 14, approved: 13, released: 12,
        note: "Architecture doc and connector matrix shared in Notion; design questions resolved with Maya.",
      },
      {
        title: "Implement onboarding flow (Wagmi + SIWE)",
        description: "Build the three-step flow with passkey wallet support and SIWE session handling.",
        amount: 4000, dueIn: 24, status: "approved",
        funded: 12, submitted: 4, approved: 1,
        note: "Flow deployed to the preview environment with full e2e coverage; includes rejected-request and wrong-network states.",
      },
      {
        title: "QA, accessibility pass & documentation",
        description: "Run an accessibility audit, fix issues and document the flow for the team.",
        amount: 2500, dueIn: 35, status: "pending",
      },
    ],
  },
  {
    n: 3,
    projectId: "proj-003",
    proposalId: "prop-005",
    clientCompanyId: "co-002",
    freelancerId: "cand-001",
    title: "Subgraph for lending markets",
    token: "USDC",
    network: "Arbitrum",
    status: "active",
    started: 20,
    milestones: [
      {
        title: "Schema design & market indexing",
        description: "Design entities for isolated markets and index market creation, supply and borrow events.",
        amount: 2400, dueIn: 12, status: "released",
        funded: 20, submitted: 10, approved: 9, released: 8,
        note: "Schema reviewed by Helix risk team. Markets and rate updates indexed back to genesis with matchstick tests.",
      },
      {
        title: "Positions & liquidations indexing",
        description: "Index user positions, interest accruals and liquidation events with derived fields.",
        amount: 2800, dueIn: 28, status: "funded",
        funded: 8,
      },
      {
        title: "Deployment, monitoring & docs",
        description: "Deploy to the hosted service, add health checks and write query documentation.",
        amount: 2000, dueIn: 40, status: "pending",
      },
    ],
  },
  {
    n: 4,
    projectId: "proj-004",
    proposalId: "prop-007",
    clientCompanyId: "co-001",
    freelancerId: "cand-020",
    title: "Foundry invariant & fuzzing suite for staking contracts",
    token: "USDC",
    network: "Base",
    status: "active",
    started: 18,
    milestones: [
      {
        title: "Handlers & core invariants",
        description: "Write handlers, ghost variables and the first set of accounting invariants.",
        amount: 2000, dueIn: 10, status: "released",
        funded: 18, submitted: 10, approved: 9, released: 8,
        note: "12 invariants passing across 4 handlers; one real rounding issue found and ticketed.",
      },
      {
        title: "Rewards & edge-case fuzzing",
        description: "Extend invariants to reward accrual, slashing and emergency withdrawals.",
        amount: 2200, dueIn: 24, status: "submitted",
        funded: 8, submitted: 2,
        note: "All reward invariants merged. Fuzz campaign ran 5M calls without violations after the rounding fix.",
      },
      {
        title: "Coverage report & team handoff",
        description: "Produce a coverage report and run a handoff session with the Nimbus team.",
        amount: 1800, dueIn: 35, status: "pending",
      },
    ],
  },
  {
    n: 5,
    projectId: "proj-005",
    proposalId: "prop-009",
    clientCompanyId: "co-005",
    freelancerId: "cand-012",
    title: "Design system for a DeFi dashboard",
    token: "USDC",
    network: "Polygon",
    status: "completed",
    started: 70,
    milestones: [
      {
        title: "Audit & foundations (tokens, type, colour)",
        description: "Audit existing UI and define design tokens for colour, type and spacing.",
        amount: 2500, dueIn: 14, status: "released",
        funded: 70, submitted: 58, approved: 57, released: 56,
        note: "Token library in Figma with light and dark themes plus an audit summary deck.",
      },
      {
        title: "Core components & chart styles",
        description: "Design the core component set and data-visualisation styles.",
        amount: 3000, dueIn: 28, status: "released",
        funded: 56, submitted: 44, approved: 43, released: 42,
        note: "42 components with states and variants, plus chart styles for line, bar and donut charts.",
      },
      {
        title: "Documentation & developer handoff",
        description: "Write usage documentation and run developer handoff sessions.",
        amount: 2500, dueIn: 42, status: "released",
        funded: 42, submitted: 30, approved: 29, released: 28,
        note: "Documentation site published and two handoff sessions recorded.",
      },
    ],
  },
  {
    n: 6,
    projectId: "proj-006",
    proposalId: "prop-011",
    clientCompanyId: "co-004",
    freelancerId: "cand-002",
    title: "Oracle adapter & keeper bot for perpetuals",
    token: "ETH",
    network: "Arbitrum",
    status: "active",
    started: 45,
    milestones: [
      {
        title: "Oracle adapter contract & tests",
        description: "Implement the oracle adapter with staleness and deviation guards and full tests.",
        amount: 3, dueIn: 14, status: "released",
        funded: 45, submitted: 33, approved: 32, released: 31,
        note: "Adapter contract deployed to testnet with 98% coverage and a fuzz suite for deviation bounds.",
      },
      {
        title: "Keeper bot with funding settlement",
        description: "Build the Go keeper that settles funding on schedule with leader election.",
        amount: 3.5, dueIn: 35, status: "released",
        funded: 31, submitted: 12, approved: 11, released: 10,
        note: "Keeper running on 3 replicas on staging; leader election and graceful failover verified.",
      },
      {
        title: "Liquidation triggers & observability",
        description: "Add liquidation triggers, metrics, dashboards and alerts.",
        amount: 2.5, dueIn: 49, status: "submitted",
        funded: 10, submitted: 1,
        note: "Liquidation triggers and Grafana dashboards delivered. Runbook added to the repository.",
      },
    ],
  },
];

const HELD: MilestoneStatus[] = ["funded", "submitted", "approved"];

function buildContract(spec: ContractSpec): Contract {
  const id = `ctr-${pad(spec.n)}`;
  const milestones: Milestone[] = spec.milestones.map((m, i) => {
    const milestone: Milestone = {
      id: `ms-${pad(spec.n)}-${i + 1}`,
      title: m.title,
      description: m.description,
      amount: m.amount,
      dueDate: dateFromOffset(spec.started, m.dueIn),
      status: m.status,
    };
    if (m.note) milestone.submissionNote = m.note;
    if (m.submitted !== undefined) milestone.submittedAt = daysAgo(m.submitted, 15);
    if (m.approved !== undefined) milestone.approvedAt = daysAgo(m.approved, 11);
    if (m.released !== undefined) milestone.releasedAt = daysAgo(m.released, 12);
    return milestone;
  });

  return {
    id,
    projectId: spec.projectId,
    proposalId: spec.proposalId,
    clientCompanyId: spec.clientCompanyId,
    freelancerId: spec.freelancerId,
    title: spec.title,
    totalAmount: milestones.reduce((total, m) => total + m.amount, 0),
    token: spec.token,
    network: spec.network,
    status: spec.status,
    startedAt: daysAgo(spec.started, 9),
    milestones,
    escrowBalance: milestones.filter((m) => HELD.includes(m.status)).reduce((total, m) => total + m.amount, 0),
    escrowAddress: mockAddress(5000 + spec.n),
  };
}

export const contracts: Contract[] = contractSpecs.map(buildContract);

/** Transactions are derived from each milestone's lifecycle so they can never drift from contract state. */
function buildTransactions(): Transaction[] {
  type Draft = Omit<Transaction, "id" | "hash">;
  const drafts: Draft[] = [];

  contractSpecs.forEach((spec) => {
    const contractId = `ctr-${pad(spec.n)}`;
    spec.milestones.forEach((m, i) => {
      const base = {
        contractId,
        milestoneId: `ms-${pad(spec.n)}-${i + 1}`,
        amount: m.amount,
        token: spec.token,
        network: spec.network,
        status: "confirmed" as const,
        simulated: true as const,
      };
      if (m.funded !== undefined) drafts.push({ ...base, type: "fund", at: daysAgo(m.funded, 9) });
      if (m.submitted !== undefined) drafts.push({ ...base, type: "submit", at: daysAgo(m.submitted, 15) });
      if (m.approved !== undefined) drafts.push({ ...base, type: "approve", at: daysAgo(m.approved, 11) });
      if (m.released !== undefined) drafts.push({ ...base, type: "release", at: daysAgo(m.released, 12) });
    });
  });

  return drafts
    .map((draft, order) => ({ draft, order }))
    .sort((a, b) => a.draft.at.localeCompare(b.draft.at) || a.order - b.order)
    .map(({ draft }, i) => ({ ...draft, id: `tx-${pad(i + 1)}`, hash: mockTxHash(9000 + i) }));
}

export const transactions: Transaction[] = buildTransactions();
