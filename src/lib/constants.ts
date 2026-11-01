import type {
  ApplicationStatus,
  Blockchain,
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  Network,
  PaymentToken,
  WorkMode,
} from "@/types";

export const JOB_CATEGORIES = [
  "Smart Contracts",
  "Frontend Engineering",
  "Backend Engineering",
  "Security",
  "DevOps & Infrastructure",
  "Product & Design",
  "Engineering Leadership",
  "Data & Analytics",
  "Community & Growth",
  "Research",
] as const;

export const EMPLOYMENT_TYPES: EmploymentType[] = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
export const WORK_MODES: WorkMode[] = ["Remote", "Hybrid", "Onsite"];
export const EXPERIENCE_LEVELS: ExperienceLevel[] = ["Entry", "Mid", "Senior", "Lead"];

export const BLOCKCHAINS: Blockchain[] = [
  "Ethereum",
  "Polygon",
  "Base",
  "Arbitrum",
  "Solana",
  "Optimism",
  "Avalanche",
  "Cosmos",
  "Multi-chain",
];

export const NETWORKS: Network[] = ["Ethereum", "Polygon", "Base", "Arbitrum"];
export const PAYMENT_TOKENS: PaymentToken[] = ["USDC", "ETH", "DAI", "MATIC", "SOL", "USD"];

export const SKILLS = [
  "Solidity",
  "Rust",
  "Move",
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Go",
  "Python",
  "Hardhat",
  "Foundry",
  "Ethers.js",
  "Wagmi",
  "Viem",
  "The Graph",
  "Anchor",
  "Solana",
  "EVM",
  "ZK Proofs",
  "Circom",
  "Auditing",
  "DeFi",
  "NFTs",
  "Tokenomics",
  "Kubernetes",
  "Terraform",
  "AWS",
  "Docker",
  "PostgreSQL",
  "GraphQL",
  "Figma",
  "UX Research",
  "Product Management",
  "Technical Writing",
  "Community Management",
  "Data Analysis",
  "Tailwind CSS",
  "IPFS",
  "Layer 2",
] as const;

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "applied",
  "under_review",
  "shortlisted",
  "interview",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
];

/** Labels as the candidate sees them */
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

/** Labels as the recruiter sees them in the ATS (Kanban columns) */
export const ATS_STAGE_LABEL: Record<Exclude<ApplicationStatus, "withdrawn">, string> = {
  applied: "Applied",
  under_review: "Screening",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
};

export const ATS_STAGES = Object.keys(ATS_STAGE_LABEL) as Exclude<ApplicationStatus, "withdrawn">[];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  draft: "Draft",
  pending: "Pending approval",
  published: "Published",
  paused: "Paused",
  closed: "Closed",
  rejected: "Rejected",
  hidden: "Hidden",
};

export const WALLET_PROVIDERS = ["MetaMask", "WalletConnect", "Coinbase Wallet", "Phantom", "Rainbow"] as const;

/** Currency symbol helper for salary formatting */
export const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  USDC: "$",
  DAI: "$",
  ETH: "Ξ",
  SOL: "◎",
  MATIC: "",
};

export const DEMO_ACCOUNTS = {
  seeker: { userId: "usr-c-001", label: "Job Seeker", description: "Aria Chen · Solidity & Web3 engineer" },
  employer: { userId: "usr-e-001", label: "Employer", description: "Maya Lindqvist · Head of Talent, Nimbus Labs" },
  admin: { userId: "usr-admin", label: "Administrator", description: "Platform admin · moderation & revenue" },
} as const;

export const STORAGE_KEY = "web3-marketplace-demo-v1";

/** Fixed "now" used for seed data so relative dates look stable. */
export const SEED_NOW = "2026-11-01T09:00:00.000Z";
