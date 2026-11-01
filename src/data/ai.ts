import type { AIHistoryItem, ResumeAnalysis } from "@/types";
import { daysAgo } from "./helpers";

export const aiHistory: AIHistoryItem[] = [
  {
    id: "ai-001",
    role: "seeker",
    type: "recommendation",
    title: "Top job matches for your Solidity profile",
    summary:
      "Surfaced 5 roles that fit a remote senior Solidity engineer. Highest match: Senior Solidity Developer at Nimbus Labs (94%), followed by DeFi Protocol Developer at Helix Protocol (92%).",
    createdAt: daysAgo(1, 8),
  },
  {
    id: "ai-002",
    role: "seeker",
    type: "chat",
    title: "Negotiating a senior DeFi offer",
    summary:
      "Discussed how to weigh a base salary plus token allocation, asked about vesting cliffs and drafted two follow-up questions for the hiring manager.",
    createdAt: daysAgo(2, 19),
  },
  {
    id: "ai-003",
    role: "seeker",
    type: "chat",
    title: "Preparing for a Foundry live-coding interview",
    summary:
      "Walked through an invariant-testing warm-up for an ERC-4626 vault, including handler design and common pitfalls with rounding.",
    createdAt: daysAgo(3, 21),
  },
  {
    id: "ai-004",
    role: "seeker",
    type: "cover_letter",
    title: "Cover letter for Full Stack Web3 Engineer at Parallax Finance",
    summary:
      "Generated a 3-paragraph letter highlighting the Governance Explorer project and contract-level understanding for UI work. Tone: confident, concise.",
    createdAt: daysAgo(4, 9),
  },
  {
    id: "ai-005",
    role: "seeker",
    type: "resume_analysis",
    title: "Resume analysis: aria-chen-cv.pdf",
    summary:
      "Score 88 out of 100. Strong quantified impact in Solidity roles; suggested adding audit outcomes and a skills summary at the top.",
    createdAt: daysAgo(6, 10),
  },
  {
    id: "ai-006",
    role: "seeker",
    type: "recommendation",
    title: "Skills to learn next for Layer 2 roles",
    summary:
      "Suggested deepening knowledge of rollup fraud proofs, account abstraction and cross-chain messaging based on the roles you saved.",
    createdAt: daysAgo(9, 15),
  },
  {
    id: "ai-007",
    role: "seeker",
    type: "cover_letter",
    title: "Cover letter for Senior Solidity Developer at Nimbus Labs",
    summary:
      "Drafted a letter emphasising invariant testing at Halcyon Finance and the 40% reduction in audit findings, tailored to Nimbus' bridge and paymaster work.",
    createdAt: daysAgo(13, 11),
  },
  {
    id: "ai-008",
    role: "employer",
    type: "chat",
    title: "Compare shortlisted candidates for Security Engineer",
    summary:
      "Compared Elena Petrova and Aria Chen on audit depth, communication and remote fit; suggested follow-up questions for the system design round.",
    createdAt: daysAgo(0, 7),
  },
  {
    id: "ai-009",
    role: "employer",
    type: "recruitment_insight",
    title: "Pipeline insight: Senior Solidity Developer",
    summary:
      "5 applicants, 2 past technical screening. Average time-to-shortlist is 5 days, better than the platform median of 8. Interview-to-offer conversion looks healthy.",
    createdAt: daysAgo(1, 9),
  },
  {
    id: "ai-010",
    role: "employer",
    type: "recommendation",
    title: "Candidate suggestions for Blockchain Backend Engineer",
    summary:
      "Recommended 4 additional candidates with Go and PostgreSQL experience outside your current pipeline, ranked by indexing and reorg-handling skills.",
    createdAt: daysAgo(2, 10),
  },
  {
    id: "ai-011",
    role: "employer",
    type: "job_description",
    title: "Draft: Developer Advocate job description",
    summary:
      "Generated responsibilities, qualifications and benefits for a remote developer advocate role, aligned with Nimbus Labs' brand voice. Saved as a pending job.",
    createdAt: daysAgo(3, 14),
  },
  {
    id: "ai-012",
    role: "employer",
    type: "interview_questions",
    title: "Interview questions for Smart Contract Security Engineer",
    summary:
      "Produced 12 technical and 5 behavioural questions covering threat modelling, upgrade safety and incident response, with scoring guidance.",
    createdAt: daysAgo(5, 13),
  },
  {
    id: "ai-013",
    role: "employer",
    type: "job_description",
    title: "Rewrite: Junior Solidity Developer internship",
    summary:
      "Simplified the qualifications to remove unnecessary barriers and added a clearer mentorship section, improving the inclusivity score by 18%.",
    createdAt: daysAgo(11, 12),
  },
];

export const resumeAnalyses: ResumeAnalysis[] = [
  {
    candidateId: "cand-001",
    score: 88,
    summary:
      "A strong senior smart contract resume with clear, quantified outcomes. The Halcyon Finance experience tells a convincing story of ownership and testing rigour. A short top summary and visible audit results would make it even more compelling to hiring managers.",
    strengths: [
      "Quantified impact such as 28% gas reduction and 40% fewer audit findings",
      "Clear progression from full-stack developer to senior protocol engineer",
      "Relevant tooling stack: Foundry, Hardhat, Wagmi and The Graph in one place",
      "Open-source projects with invariant tests demonstrate depth, not just claims",
    ],
    improvements: [
      "Add a 2-3 line professional summary at the top",
      "List audit firms or contests and the outcomes of your reviews",
      "Mention TVL or user scale for the Brightvault vault suite",
      "Show leadership scope: team size mentored and review processes introduced",
    ],
    relevantSkills: ["Solidity", "Foundry", "EVM", "DeFi", "Auditing", "Wagmi", "The Graph"],
    missingInfo: ["Public audit report links", "Notice period or visa status", "Speaking or writing samples"],
    formatting: [
      "Keep to two pages and use consistent date formatting (yyyy-MM)",
      "Group skills into categories: languages, tooling, security",
      "Move certifications next to education to save vertical space",
    ],
  },
  {
    candidateId: "cand-002",
    score: 78,
    summary:
      "A solid backend engineer profile with relevant blockchain infrastructure experience. The indexing project is a standout, but descriptions could better highlight scale, reliability metrics and ownership.",
    strengths: [
      "Real blockchain indexing experience at scale (40M events a day)",
      "Go and Node.js with PostgreSQL is a sought-after combination",
      "Open-source chain-tailer library shows craftsmanship",
    ],
    improvements: [
      "Add reliability metrics: uptime, latency and incident counts",
      "Describe on-call and ownership responsibilities explicitly",
      "Explain the impact of the reorg-handler rewrite in business terms",
      "Include team size and collaboration context",
    ],
    relevantSkills: ["Go", "Node.js", "PostgreSQL", "EVM", "GraphQL", "Docker"],
    missingInfo: ["Kubernetes or deployment experience", "Production incident examples", "Links to deployed services"],
    formatting: [
      "Shorten bullet points to one or two lines each",
      "Lead each bullet with an action verb and a metric",
      "Add a skills section grouped by backend, data and infrastructure",
    ],
  },
  {
    candidateId: "cand-003",
    score: 91,
    summary:
      "An excellent security resume that proves depth: lead auditor on 35+ engagements and public findings from contests. It is already well structured; small additions around publications and mentoring would round it out.",
    strengths: [
      "Concrete audit volume and scope (bridges, perpetuals, lending)",
      "Track record of public findings and contest placements",
      "Combines manual review with fuzzing and invariant tooling",
      "Mentoring and process ownership evident from internal checklist work",
    ],
    improvements: [
      "Link a representative public audit report prominently",
      "Add a short section on severity breakdown of findings",
      "Mention conference talks or blog posts if available",
    ],
    relevantSkills: ["Solidity", "Auditing", "Foundry", "EVM", "Rust", "DeFi"],
    missingInfo: ["Non-EVM audit exposure", "Preferred engagement length", "Availability for travel"],
    formatting: [
      "Present engagements as a compact table",
      "Use bold sparingly; highlight only top achievements",
      "Keep the document to two pages",
    ],
  },
  {
    candidateId: "cand-005",
    score: 84,
    summary:
      "A focused Web3 frontend resume with a clear specialty in wallet UX. Measurable outcomes at Kitsune Wallet are persuasive. Adding more detail on accessibility work and team collaboration would strengthen it.",
    strengths: [
      "Specific, measurable impact: 54% to 81% onboarding completion",
      "Modern stack: React, Next.js, Wagmi and Viem",
      "Open-source ConnectKit Lite demonstrates real product thinking",
      "Accessibility certification is a differentiator",
    ],
    improvements: [
      "Add design-system contributions and component library scale",
      "Describe collaboration with designers and security reviewers",
      "Include performance metrics such as Lighthouse and bundle size",
      "Show examples of error and edge-case handling",
    ],
    relevantSkills: ["React", "Next.js", "TypeScript", "Wagmi", "Viem", "Tailwind CSS"],
    missingInfo: ["Testing approach (unit, e2e)", "Smart contract familiarity", "Links to live dApps"],
    formatting: [
      "Add a portfolio link at the very top",
      "Replace the long paragraph summary with three bullets",
      "Keep consistent verb tense across bullets",
    ],
  },
  {
    candidateId: "cand-006",
    score: 66,
    summary:
      "A promising early-career resume with relevant projects and an internship. It currently reads as a list of tasks; reframing bullets around outcomes and adding test coverage details would improve its impact.",
    strengths: [
      "Hands-on Solidity projects with public repositories",
      "Internship experience in a real smart contract setting",
      "Relevant certification demonstrates commitment",
    ],
    improvements: [
      "Quantify project results: tests written, coverage, gas savings",
      "Reframe internship duties as outcomes",
      "Add a short summary stating your target role and focus area",
      "Highlight any hackathon or contest participation",
    ],
    relevantSkills: ["Solidity", "Hardhat", "Ethers.js", "JavaScript", "EVM"],
    missingInfo: ["Foundry or fuzz testing experience", "Security training or CTF history", "Links to deployed contracts"],
    formatting: [
      "Fit to one page and place Projects above Education",
      "Use a single clean font and consistent bullet style",
      "Add GitHub and LinkedIn links to the header",
    ],
  },
  {
    candidateId: "cand-009",
    score: 87,
    summary:
      "A strong protocol engineering resume with real DeFi depth and responsibility. The CDP and liquidation work is highly relevant to lending teams. Emphasising collaboration with auditors and researchers would add balance.",
    strengths: [
      "Direct ownership of liquidation and oracle-fallback design",
      "Significant value secured ($85M collateral) provides credibility",
      "Simulation toolkit shows a research-minded engineering style",
      "Clear career growth across two protocol teams",
    ],
    improvements: [
      "Add audit outcomes and firm names for shipped protocols",
      "Show collaboration with research and product stakeholders",
      "Include talks or write-ups on mechanism design",
    ],
    relevantSkills: ["Solidity", "DeFi", "Foundry", "Tokenomics", "Layer 2", "Auditing"],
    missingInfo: ["Frontend or SDK integration experience", "Preferred ecosystems beyond EVM", "Reference contacts"],
    formatting: [
      "Reduce education details and give more space to protocol work",
      "Use consistent capitalisation for protocol names",
      "Add a clickable list of GitHub repositories",
    ],
  },
  {
    candidateId: "cand-012",
    score: 82,
    summary:
      "A well-crafted designer resume that points to a strong portfolio. Product outcomes (45% fewer approval tickets) are persuasive. The resume could say more about research methods and cross-functional leadership.",
    strengths: [
      "Outcome-driven bullets tied to support ticket reduction",
      "Focused specialisation in wallets and DeFi flows",
      "Design-system experience across two organisations",
      "Certification in UX research adds credibility",
    ],
    improvements: [
      "Describe research methods and participant numbers",
      "Add collaboration scope with engineering and security",
      "Link directly to the two most relevant case studies",
      "Include tools beyond Figma, such as prototyping and analytics",
    ],
    relevantSkills: ["Figma", "UX Research", "Tailwind CSS", "Product Management"],
    missingInfo: ["Accessibility standards knowledge", "Experience with user testing platforms", "Metrics on adoption of the design system"],
    formatting: [
      "Keep the PDF lightweight; the current file is large because of embedded images",
      "Use a clean two-column layout with clear section headings",
      "Add a short statement of design philosophy",
    ],
  },
  {
    candidateId: "cand-014",
    score: 85,
    summary:
      "A rigorous research resume that bridges quantitative finance and DeFi. Publications and model-based outcomes stand out. Adding concrete protocol results and code samples would help engineering-oriented hiring managers.",
    strengths: [
      "Quantitative background that translates well to mechanism design",
      "14 public research notes demonstrate communication skill",
      "Experience setting live fee and emissions parameters",
      "Python simulation tooling is available publicly",
    ],
    improvements: [
      "Quantify the effects of parameter recommendations on live protocols",
      "Add a short list of publications with links",
      "Describe collaboration with smart contract engineers",
      "Mention governance forum experience or presentations",
    ],
    relevantSkills: ["Tokenomics", "DeFi", "Python", "Data Analysis", "Technical Writing"],
    missingInfo: ["Solidity reading or review experience", "Data tooling (SQL, dashboards)", "Availability for synchronous governance calls"],
    formatting: [
      "Place publications near the top for research roles",
      "Reduce quantitative finance detail to two bullets",
      "Make section headings consistent and scannable",
    ],
  },
];
