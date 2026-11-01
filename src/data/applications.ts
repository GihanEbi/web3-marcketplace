import type { Application, ApplicationStatus, TimelineEvent } from "@/types";
import { candidates } from "./candidates";
import { daysAgo, pad } from "./helpers";
import { jobs } from "./jobs";
import { users } from "./users";

/** [status, days ago, optional note] — every step after the initial "applied" event. */
type Step = [ApplicationStatus, number, string?];

interface Spec {
  job: string;
  cand: string;
  status: ApplicationStatus;
  /** days before SEED_NOW when the candidate applied */
  applied: number;
  /** deterministic 55-96 match score, higher where skills overlap the job */
  match: number;
  salary: number;
  letter: string;
  /** one answer per job.screeningQuestions entry, in order */
  answers: string[];
  steps?: Step[];
  /** [days ago, text] internal recruiter notes */
  notes?: [number, string][];
}

function build(n: number, s: Spec): Application {
  const job = jobs.find((j) => j.id === s.job);
  const cand = candidates.find((c) => c.id === s.cand);
  if (!job || !cand) throw new Error(`Seed error: application ${n} references a missing job or candidate`);
  const id = `app-${pad(n)}`;
  const author = users.find((u) => u.id === job.postedBy)?.name ?? "Hiring team";

  const timeline: TimelineEvent[] = [
    { id: `tl-${id}-1`, status: "applied", at: daysAgo(s.applied, 8 + (n % 9)), note: "Application submitted" },
  ];
  (s.steps ?? []).forEach(([status, ago, note], i) => {
    timeline.push({ id: `tl-${id}-${i + 2}`, status, at: daysAgo(ago, 9 + ((n + i * 2) % 8)), ...(note ? { note } : {}) });
  });

  return {
    id,
    jobId: job.id,
    candidateId: cand.id,
    companyId: job.companyId,
    status: s.status,
    appliedAt: timeline[0].at,
    updatedAt: timeline[timeline.length - 1].at,
    coverLetter: s.letter,
    portfolioUrl: cand.portfolio[0]?.url ?? cand.website,
    expectedSalary: s.salary,
    salaryCurrency: job.currency,
    availability: cand.availability,
    resumeName: cand.resume?.fileName ?? "resume.pdf",
    screeningAnswers: job.screeningQuestions.map((question, i) => ({ question, answer: s.answers[i] ?? "" })),
    timeline,
    notes: (s.notes ?? []).map(([ago, text], i) => ({
      id: `note-${id}-${i + 1}`,
      authorName: author,
      text,
      at: daysAgo(ago, 14 + (i % 3)),
    })),
    matchScore: s.match,
  };
}

const specs: Spec[] = [
  /* ===================== co-001 Nimbus Labs (app-001 … app-020) ===================== */
  // 001 — demo seeker, interview
  {
    job: "job-001", cand: "cand-001", status: "interview", applied: 14, match: 94, salary: 165000,
    letter:
      "I am excited to apply for the Senior Solidity Developer role at Nimbus Labs. At Halcyon Finance I led the vault and rewards contracts behind a $120M TVL protocol and introduced Foundry invariant testing that cut audit findings by 40%. I would love to bring that rigour to your bridge and paymaster modules.",
    answers: [
      "At Halcyon a handler-based invariant test showed total shares drifting from assets after a rounding edge case in partial withdrawals. It never reproduced in unit tests, and we fixed it before the audit started.",
      "I use namespaced storage, run storage-layout diffs in CI and rehearse every upgrade on a mainnet fork with real state before proposing it.",
      "$165,000 base, with half paid in USDC if that works for the team.",
    ],
    steps: [
      ["under_review", 12, "Screened by Maya Lindqvist"],
      ["shortlisted", 9, "Strong invariant-testing background; moving to technical round"],
      ["interview", 4, "Technical interview scheduled with Oskar Brandt for Nov 4"],
    ],
    notes: [
      [9, "Excellent Foundry portfolio and a clear communicator. Fast-track to the technical round."],
      [4, "Salary ask sits inside the band and she prefers a USDC split. No concerns."],
    ],
  },
  // 002 — offered
  {
    job: "job-001", cand: "cand-009", status: "offered", applied: 20, match: 91, salary: 175000,
    letter:
      "Six years of building lending and stablecoin protocols have taught me to think about incentives and invariants before writing code. The Senior Solidity role at Nimbus matches the kind of infrastructure work I want to own next. I have shipped liquidation auctions and oracle fallbacks that secure tens of millions in collateral.",
    answers: [
      "A fuzz run on our CDP system revealed that a liquidation could leave dust positions that were impossible to close. We added a minimum-debt rule and an invariant to guarantee it.",
      "Proxy upgrades go through a timelock, a layout check against the previous implementation and a dry run on a forked network with archived state.",
      "$175,000, flexible on the split between fiat and USDC.",
    ],
    steps: [
      ["under_review", 18, "Initial screen passed"],
      ["shortlisted", 15, "Panel agreed to proceed"],
      ["interview", 11, "Technical and design interviews with Oskar Brandt and Lena Fischer"],
      ["offered", 3, "Offer sent: $178,000 base plus token grant, start date negotiable"],
    ],
    notes: [
      [10, "Outstanding design interview, one of the best this quarter."],
      [3, "Offer approved by finance. Candidate has a competing process, so follow up within 48 hours."],
    ],
  },
  // 003 — shortlisted
  {
    job: "job-001", cand: "cand-020", status: "shortlisted", applied: 11, match: 84, salary: 140000,
    letter:
      "I split my time between building and auditing smart contracts, which has made me very deliberate about invariants and edge cases. I have written Foundry suites for lending and vault code and would be glad to apply that experience on Nimbus' bridge contracts. The Senior role is a step up, and I am ready for the scope.",
    answers: [
      "While auditing an ERC-4626 vault, an invariant that total assets never fall below total supply value exposed a donation-style inflation edge case.",
      "I look for storage collisions, initialiser safety and function-selector clashes, then verify them with a dry run on a fork.",
      "$140,000 base. I am open to USDC for part of it.",
    ],
    steps: [
      ["under_review", 9, "Screened"],
      ["shortlisted", 5, "Good technical background; consider alongside the security opening"],
    ],
    notes: [[5, "Slightly junior for this level but exceptional testing mindset. Keep warm for the security role too."]],
  },
  // 004 — rejected
  {
    job: "job-001", cand: "cand-006", status: "rejected", applied: 16, match: 62, salary: 55000,
    letter:
      "I recently completed a smart contract internship and have built several ERC-20 and ERC-721 projects with Hardhat. Although the role asks for more experience than I have today, I wanted to introduce myself and learn what skills I should build next. Nimbus Labs is a team I admire.",
    answers: [
      "In a ticketing contract my tests caught a case where refunds could be claimed twice. I added a state flag and a regression test.",
      "I have not shipped an upgrade yet, but I have studied proxies and would run tests against the new implementation before deploying.",
      "$55,000, though I am mainly looking for strong mentorship.",
    ],
    steps: [
      ["under_review", 14, "Screened"],
      ["rejected", 10, "Not moving forward; the role requires senior experience. Invited to apply to the internship track."],
    ],
  },
  // 005 — applied
  {
    job: "job-001", cand: "cand-019", status: "applied", applied: 3, match: 66, salary: 150000,
    letter:
      "I am a backend engineer with eight years of experience in Go and Rust and growing interest in on-chain systems. I have worked with EVM nodes extensively and have studied Solidity on the side. I would welcome the chance to discuss whether my systems background could complement your contract team.",
    answers: [
      "I wrote property tests for an order book rather than a contract, but the principle is the same: a matching invariant exposed a rounding edge case in partial fills.",
      "I would insist on storage-layout checks and a staged rollout with monitoring and a rollback path.",
      "$150,000.",
    ],
  },
  // 006 — interview
  {
    job: "job-002", cand: "cand-005", status: "interview", applied: 13, match: 93, salary: 125000,
    letter:
      "Wallet connection and transaction UX are the focus of my work at Kitsune Wallet, where I rebuilt onboarding and lifted first-transaction completion from 54% to 81%. The Web3 Frontend Engineer role at Nimbus is exactly the kind of product-minded work I want to keep doing. I would love to help make rollup tooling feel effortless.",
    answers: [
      "My open-source ConnectKit Lite (github.example/yuki-tanaka/connectkit-lite) is a wallet-connect modal with passkey and SIWE support, and I built and maintain all of it.",
      "I show a persistent status banner with the transaction hash, estimated confirmation time and a speed-up or cancel action, and I keep the UI usable while it waits.",
    ],
    steps: [
      ["under_review", 11, "Screened"],
      ["shortlisted", 8, "Portfolio impressed the design team"],
      ["interview", 5, "Technical interview scheduled for Nov 3"],
    ],
    notes: [[8, "ConnectKit Lite is a great sample. Check Wagmi v2 depth in the technical round."]],
  },
  // 007 — under_review
  {
    job: "job-002", cand: "cand-008", status: "under_review", applied: 8, match: 82, salary: 105000,
    letter:
      "I build full stack Web3 products and most recently shipped a portfolio tracker with a custom subgraph and a Next.js dashboard used by 60,000 wallets. I am drawn to Nimbus because of the focus on developer experience. I enjoy owning the frontend details that make complex data feel simple.",
    answers: [
      "WalletFolio (walletfolio.example) is a multi-chain portfolio tracker I designed and built end to end.",
      "I surface the pending state clearly, poll receipts with backoff and offer replacement transactions once the user confirms they want to speed it up.",
    ],
    steps: [["under_review", 6, "In screening"]],
  },
  // 008 — applied
  {
    job: "job-002", cand: "cand-012", status: "applied", applied: 2, match: 71, salary: 110000,
    letter:
      "I am a product designer who codes comfortably in React and Tailwind, and I am looking to move closer to the implementation of DeFi interfaces. I have designed and prototyped wallet flows and would bring a strong eye for detail to the Nimbus console. I am happy to share Figma and code samples.",
    answers: [
      "My DeFi dashboard design system (hannah-becker.example/defi-design-system) includes a coded React component library I built with Tailwind.",
      "I would design for it explicitly with progress states, an explanation of why it is slow and clear options to speed up or cancel.",
    ],
  },
  // 009 — interview
  {
    job: "job-003", cand: "cand-003", status: "interview", applied: 18, match: 95, salary: 175000,
    letter:
      "I have led more than 35 smart contract audits, including two bridges and a perpetuals exchange, and enjoy turning findings into practical engineering improvements. Building Nimbus' internal security programme is the kind of long-term ownership I am looking for after years of consulting. I can start in about a month.",
    answers: [
      "A cross-chain message replay in a bridge where nonces were scoped per sender but not per destination. It would have allowed double mints, and I wrote the PoC and mitigation.",
      "I start with a diff against the previous version, map the changed trust boundaries, run existing invariants and then deep-read only the risky deltas.",
      "Berlin is fine; I can relocate or commute from Tbilisi for onsite weeks.",
    ],
    steps: [
      ["under_review", 16, "Screened by Maya Lindqvist"],
      ["shortlisted", 13, "Exceptional audit track record"],
      ["interview", 8, "System design interview scheduled with Lena Fischer for Nov 6"],
    ],
    notes: [
      [13, "Top candidate for the role. Public reports are first rate."],
      [8, "Wants a 1-month notice. Fine for our timeline."],
    ],
  },
  // 010 — demo seeker, shortlisted
  {
    job: "job-003", cand: "cand-001", status: "shortlisted", applied: 9, match: 90, salary: 170000,
    letter:
      "My background combines production Solidity work with a security-first approach: I introduced invariant testing at Halcyon Finance and hold the Certified Smart Contract Auditor credential. The Security Engineer role would let me deepen that focus inside a team that ships real infrastructure. I would be glad to support internal reviews and mentor engineers on secure design.",
    answers: [
      "A rounding bug in a rewards accumulator that let early depositors skim yield. I found it with a differential fuzz test against a Python model before the audit.",
      "I would triage by call graph: external entry points first, then privilege boundaries, then arithmetic hotspots, running invariants alongside the read.",
      "Berlin works well; I am Lisbon-based and happy to travel for the two onsite days.",
    ],
    steps: [
      ["under_review", 7, "Screened"],
      ["shortlisted", 4, "Strong match; panel review in progress"],
    ],
    notes: [[4, "Aria is a stronger engineer than most auditors we see. Compare against Elena before scheduling."]],
  },
  // 011 — under_review
  {
    job: "job-003", cand: "cand-020", status: "under_review", applied: 5, match: 86, salary: 150000,
    letter:
      "I currently audit lending and staking protocols at Northstar Audits and previously wrote Solidity for a term-loan protocol, so I know both sides of the review. I am keen to move in-house and own a security programme end to end. I would bring a reusable Foundry invariant template and a habit of writing precise findings.",
    answers: [
      "A rounding issue in staking rewards that let a depositor withdraw slightly more than they were owed; it only appeared under specific share ratios.",
      "I would concentrate on state-changing functions with external calls first, then run existing invariants to prioritise anything that fails.",
      "Yes, two days a week in Berlin is workable after a relocation timeline.",
    ],
    steps: [["under_review", 3, "In screening"]],
  },
  // 012 — shortlisted
  {
    job: "job-004", cand: "cand-002", status: "shortlisted", applied: 10, match: 89, salary: 130000,
    letter:
      "I own an indexing pipeline at Ledgerline that handles 40 million events a day and rewrote its reorg handling in Go. Nimbus' focus on rollup reliability is the kind of problem I enjoy. I would bring strong PostgreSQL skills and a bias for observability.",
    answers: [
      "Track block hashes alongside block numbers, store events with their block hash and roll back by hash when a parent mismatch is detected.",
      "A 2 TB events table partitioned by month with BRIN indexes and materialised views for aggregation.",
    ],
    steps: [
      ["under_review", 8, "Screened"],
      ["shortlisted", 6, "Great indexer experience; scheduling team interviews"],
    ],
    notes: [[6, "Reorg design answer was spot on. Check on-call experience."]],
  },
  // 013 — interview
  {
    job: "job-004", cand: "cand-019", status: "interview", applied: 15, match: 92, salary: 140000,
    letter:
      "Performance-sensitive backend systems in Go and Rust are my specialty, and for the past three years I have applied them to blockchain settlement. The Nimbus indexing and relayer work is a natural next step for me. I would bring discipline around latency budgets, tracing and incident response.",
    answers: [
      "Keep a rolling window of recent block hashes, detect parent mismatches and replay events from the fork point with idempotent writes.",
      "A trade ledger with 6 billion rows on partitioned PostgreSQL, with careful index design and archival to columnar storage.",
    ],
    steps: [
      ["under_review", 13, "Screened"],
      ["shortlisted", 10, "Excellent systems experience"],
      ["interview", 7, "Technical round complete; final round scheduled"],
    ],
    notes: [[7, "Strong technical round. Final round with Tariq to assess collaboration."]],
  },
  // 014 — applied
  {
    job: "job-004", cand: "cand-008", status: "applied", applied: 1, match: 74, salary: 115000,
    letter:
      "I have built the subgraph, GraphQL gateway and dashboard for a portfolio product, and I enjoy the data-plumbing side of Web3. Nimbus' backend role would let me go deeper on indexers and APIs. I am comfortable in Node.js and learning Go.",
    answers: [
      "Handle reorgs by tracking block hashes and re-indexing from the common ancestor, as the Graph node does.",
      "A 300 GB PostgreSQL dataset for wallet activity, where I added partial indexes to cut dashboard latency by 70%.",
    ],
  },
  // 015 — offered
  {
    job: "job-005", cand: "cand-007", status: "offered", applied: 19, match: 94, salary: 145000,
    letter:
      "I currently lead infrastructure for a 120-validator fleet and have automated almost everything with Terraform and Kubernetes. Nimbus' sequencer and RPC infrastructure is a compelling next challenge. I can start within a month and am happy to work from Berlin part of the week.",
    answers: [
      "A misconfigured upgrade took a validator group offline for 40 minutes. I led recovery, added a canary stage to the rollout process and wrote a postmortem that changed our release policy.",
      "Keys live in HSM-backed signers with short-lived access, strict network policy and rehearsed rotation procedures; no key ever touches disk unencrypted.",
    ],
    steps: [
      ["under_review", 17, "Screened"],
      ["shortlisted", 14, "Outstanding infra background"],
      ["interview", 10, "Technical and team interviews completed"],
      ["offered", 2, "Offer sent: $148,000 base plus token grant"],
    ],
    notes: [[2, "Unanimous yes from the panel. Candidate wants to confirm relocation support."]],
  },
  // 016 — withdrawn
  {
    job: "job-005", cand: "cand-002", status: "withdrawn", applied: 12, match: 58, salary: 130000,
    letter:
      "I am a backend engineer curious about infrastructure work and have run production Go services on AWS for several years. The DevOps role at Nimbus is slightly outside my recent focus, but I would enjoy a conversation about how my experience could translate.",
    answers: [
      "A queue backlog took down our indexer during a chain halt. I added backpressure, alerts and a replay tool afterwards.",
      "I rely on cloud KMS and avoid long-lived credentials, but I have limited experience with HSMs.",
    ],
    steps: [
      ["under_review", 10, "Screened"],
      ["withdrawn", 8, "Candidate withdrew to pursue another opportunity"],
    ],
  },
  // 017 — interview
  {
    job: "job-006", cand: "cand-015", status: "interview", applied: 22, match: 90, salary: 220000,
    letter:
      "I have led engineering teams in blockchain for seven years, taking two protocols from whitepaper to mainnet and growing a team from 5 to 28 engineers. Nimbus' mission and engineering culture stand out to me. I would bring calm, accountable leadership and a track record of shipping under security constraints.",
    answers: [
      "A written on-call policy with clear escalation tiers, blameless postmortems within 72 hours and a quarterly review of recurring incident causes.",
      "I reserve a fixed share of each cycle for debt, tie it to measurable reliability goals and make the trade-off visible in planning.",
    ],
    steps: [
      ["under_review", 20, "Screened"],
      ["shortlisted", 17, "Great leadership track record"],
      ["interview", 11, "System design and leadership interview scheduled"],
    ],
    notes: [[6, "System design interview went well. Hiring is paused, so keep candidate informed about the timeline."]],
  },
  // 018 — under_review
  {
    job: "job-006", cand: "cand-010", status: "under_review", applied: 7, match: 64, salary: 150000,
    letter:
      "I am a product leader with eight years in fintech and wallets, and I have worked side by side with technical leads on complex launches. Although my background is product rather than engineering, I wanted to express interest in a technical-leadership role where I could partner closely on delivery.",
    answers: [
      "I have co-run incident reviews with engineering and introduced a severity rubric that standardised response across squads.",
      "I use a quarterly capacity allocation that explicitly reserves time for reliability and debt reduction.",
    ],
    steps: [["under_review", 5, "In screening; may be better suited to a product role"]],
  },
  // 019 — hired
  {
    job: "job-007", cand: "cand-006", status: "hired", applied: 53, match: 88, salary: 3000,
    letter:
      "I am a recent graduate who built a ticketing dApp and a multisig wallet and found my love for Solidity in a hackathon. The Nimbus internship is the best way I can think of to learn from experienced protocol engineers. I am eager, reliable and open to feedback.",
    answers: [
      "TicketChain (github.example/amara-nwosu/ticketchain), an ERC-721 ticketing dApp with resale royalty caps. I would add fuzz tests and better role management.",
      "Contracts feel like software with real consequences, which makes careful engineering feel important.",
    ],
    steps: [
      ["under_review", 50, "Screened"],
      ["shortlisted", 46, "Strong portfolio for a junior"],
      ["interview", 41, "Intro and technical interviews completed"],
      ["offered", 36, "Offer extended for the 6-month internship"],
      ["hired", 32, "Offer accepted; start date confirmed"],
    ],
    notes: [[41, "Great attitude and thoughtful questions. Pair with Oskar for onboarding."]],
  },
  // 020 — rejected
  {
    job: "job-007", cand: "cand-013", status: "rejected", applied: 50, match: 55, salary: 3000,
    letter:
      "I am an on-chain data analyst interested in learning more about the contract side of Web3. The internship would give me the engineering grounding I currently lack. I know Python and SQL well and am picking up Solidity.",
    answers: [
      "I have not written a production Solidity project yet, but I am working through an ERC-20 staking contract.",
      "I have worked with contract events for years in analytics and want to understand how the code behind them is designed.",
    ],
    steps: [
      ["under_review", 47, "Screened"],
      ["rejected", 40, "Preferred candidates with Solidity projects; encouraged to reapply"],
    ],
  },

  /* ===================== Other companies (app-021 … app-040) ===================== */
  // 021 — demo seeker, offered at Helix
  {
    job: "job-010", cand: "cand-001", status: "offered", applied: 18, match: 92, salary: 180000,
    letter:
      "Isolated lending markets are among the most interesting design spaces in DeFi, and I have spent the last three years building vaults and reward systems on top of them. At Halcyon I designed oracle-fallback logic and owned an audit from kickoff to remediation. Helix's emphasis on transparent risk is why I am applying.",
    answers: [
      "Use a time-weighted oracle with deviation checks against a secondary source, cap borrow against freshly listed assets and add circuit breakers on sudden utilisation spikes.",
      "I chose a simpler piecewise-linear rate curve over a more capital-efficient adaptive one because it is easier to reason about under stress, even at the cost of some yield.",
      "$180,000 in USDC, with room to discuss the token allocation.",
    ],
    steps: [
      ["under_review", 16, "Screened by Daniel Okafor"],
      ["shortlisted", 13, "Research and engineering both keen"],
      ["interview", 9, "Final round with Daniel Okafor and Ines Moreau"],
      ["offered", 2, "Offer: 185,000 USDC plus 0.8% token allocation"],
    ],
    notes: [
      [9, "Impressive design discussion. Ines wants her on the parameters working group."],
      [2, "Offer expires in 10 days; Aria is also interviewing elsewhere."],
    ],
  },
  // 022 — interview
  {
    job: "job-010", cand: "cand-009", status: "interview", applied: 10, match: 90, salary: 180000,
    letter:
      "I build liquidation and oracle systems for CDP-style protocols and would welcome the chance to work on isolated markets at Helix. I enjoy simulating mechanisms before writing code and publishing the results. I think my experience maps well onto your roadmap.",
    answers: [
      "Combine TWAP with a secondary feed, enforce deviation bounds and use conservative collateral factors for assets with thin liquidity.",
      "We moved from a pure Dutch auction to a hybrid with a fixed bonus floor, trading some price discovery for more reliable liquidations.",
      "$180,000 in USDC.",
    ],
    steps: [
      ["under_review", 8, "Screened"],
      ["shortlisted", 6, "Strong protocol-engineering background"],
      ["interview", 3, "Culture-fit interview scheduled with Daniel Okafor"],
    ],
    notes: [[3, "Technical review passed with flying colours. Culture-fit chat next."]],
  },
  // 023 — applied
  {
    job: "job-010", cand: "cand-015", status: "applied", applied: 2, match: 69, salary: 200000,
    letter:
      "After leading engineering teams for several years, I want to return to hands-on protocol work on a focused team. I have shipped a lending protocol v2 migration and can contribute architecture and mentorship alongside implementation.",
    answers: [
      "Multiple independent price sources, bounded deviations and delay-based sanity checks on large oracle jumps.",
      "We deliberately limited the number of collateral types at launch to reduce risk surface, sacrificing early TVL.",
      "$200,000 in USDC.",
    ],
  },
  // 024 — shortlisted
  {
    job: "job-011", cand: "cand-014", status: "shortlisted", applied: 12, match: 93, salary: 150000,
    letter:
      "I design incentive systems for live protocols and publish the analysis behind them. At Mercury Labs I set fee and emission curves for two protocols and wrote 14 public research notes. Helix's monthly risk reports are exactly the type of rigorous, public work I want to be doing.",
    answers: [
      "My emissions-simulator write-up (chloe-dubois.example/research) changed how a protocol sized its liquidity incentives and reduced mercenary capital by roughly 30%.",
      "Utilisation distribution, liquidation latency, bad-debt-at-risk under price shocks and borrower concentration.",
    ],
    steps: [
      ["under_review", 10, "Screened"],
      ["shortlisted", 6, "Excellent research samples"],
    ],
    notes: [[6, "Best written research of the batch. Schedule with Ines next week."]],
  },
  // 025 — interview (cancelled interview)
  {
    job: "job-012", cand: "cand-013", status: "interview", applied: 9, match: 91, salary: 75,
    letter:
      "I build dashboards and datasets for on-chain teams, including a DAO treasury monitor tracked by 25 DAOs. This contract fits my skills in subgraphs, SQL and metric design. I can start immediately and work well with a distributed team.",
    answers: [
      "My DAO Treasury Monitor (jin-park.example/treasury-monitor) surfaces runway and concentration risk, and two DAOs changed their spending pace after seeing it.",
      "I reconcile subgraph outputs against raw RPC samples and a separate warehouse model and monitor for sudden drops in event counts.",
    ],
    steps: [
      ["under_review", 8, "Screened"],
      ["shortlisted", 6, "Great fit for the analytics contract"],
      ["interview", 4, "Technical interview requested"],
    ],
  },
  // 026 — under_review
  {
    job: "job-013", cand: "cand-010", status: "under_review", applied: 7, match: 67, salary: 4500,
    letter:
      "I have led product communities in wallets and DeFi and enjoy bringing people together around shared goals. Orbit's contributor-led model is appealing, and I would love to help scale onboarding and governance participation. I can commit around 25 hours a week.",
    answers: [
      "I have contributed to two grants committees in an advisory capacity and helped run a delegate-onboarding workshop.",
      "Short, plain-language proposal summaries, delegate office hours and reminders timed to voting windows.",
    ],
    steps: [["under_review", 5, "Reviewing alongside other candidates"]],
  },
  // 027 — applied
  {
    job: "job-014", cand: "cand-011", status: "applied", applied: 3, match: 63, salary: 120,
    letter:
      "I am a cryptography engineer who also writes Solidity verifiers, and I am interested in the privacy and delegation-incentive aspects of Orbit's governor design. I can contribute ZK-based private voting ideas alongside the core implementation.",
    answers: [
      "I built a private-voting prototype with a Solidity verifier, but I have not shipped a production governor.",
      "Snapshot voting power at a past block and use checkpoints, not live balances, which prevents flash-loan inflation.",
    ],
  },
  // 028 — shortlisted
  {
    job: "job-014", cand: "cand-020", status: "shortlisted", applied: 8, match: 85, salary: 105,
    letter:
      "I write and audit Solidity daily and have a strong interest in governance security. Orbit's delegation-reward design raises some interesting incentive questions I would be glad to help solve. I can commit about 15 hours a week for the duration.",
    answers: [
      "I audited a governor with a mis-scoped proposal threshold and have implemented timelock-based role separation in a lending protocol.",
      "Voting power must be read from a past checkpoint, never from current balances, and proposals should require a minimum snapshot delay.",
    ],
    steps: [
      ["under_review", 6, "Screened"],
      ["shortlisted", 3, "Contributors approve of her audit background"],
    ],
    notes: [[3, "Steward vote: 4 of 5 in favour. Waiting on availability confirmation."]],
  },
  // 029 — demo seeker, applied
  {
    job: "job-016", cand: "cand-001", status: "applied", applied: 4, match: 78, salary: 135000,
    letter:
      "I enjoy working across the stack, from Solidity contracts through to the Next.js interfaces that expose them, and Parallax's trading platform is an exciting place to do that. I have built a governance explorer with a subgraph and Wagmi front end and would bring contract-level understanding to the UI. I am happy to discuss the hybrid arrangement.",
    answers: [
      "Governance Explorer renders thousands of proposal and delegation events; I used virtualised lists, query batching and optimistic updates to keep it instant.",
      "I am based in Lisbon and would need to discuss a relocation or a mostly-remote arrangement.",
    ],
  },
  // 030 — interview
  {
    job: "job-016", cand: "cand-008", status: "interview", applied: 11, match: 88, salary: 115000,
    letter:
      "I have shipped a multi-chain portfolio tracker as a one-person full stack team, from the subgraph through the GraphQL API to the Next.js UI. Parallax's trading platform feels like the right next step. I am excited by the challenge of real-time interfaces.",
    answers: [
      "WalletFolio updates positions via WebSocket subscriptions with throttled rendering and memoised selectors, keeping 60 fps on large portfolios.",
      "I am relocating to Singapore in the new year and can work from the office three days a week.",
    ],
    steps: [
      ["under_review", 9, "Screened"],
      ["shortlisted", 7, "Good full-stack depth"],
      ["interview", 4, "Technical interview scheduled with Mei Tan"],
    ],
    notes: [[4, "Solid take-home. Ask about real-time performance experience."]],
  },
  // 031 — interview
  {
    job: "job-018", cand: "cand-012", status: "interview", applied: 14, match: 95, salary: 115000,
    letter:
      "I redesigned the swap and approvals flows at Brightwave Wallet and reduced approval-related support tickets by 45%. Lumen's focus on making self-custody safe and understandable is what I want to spend my career on. I would love to share how I research and prototype.",
    answers: [
      "My approvals redesign case study (hannah-becker.example/approvals) simplifies ERC-20 allowances into plain-language limits users can adjust.",
      "I run comprehension tests where participants explain a transaction in their own words before and after the preview, and iterate until misreads disappear.",
    ],
    steps: [
      ["under_review", 12, "Screened"],
      ["shortlisted", 10, "Portfolio is a strong match"],
      ["interview", 6, "Portfolio review with Jonas Weber being scheduled"],
    ],
    notes: [[10, "Top portfolio of the round. Priority candidate."]],
  },
  // 032 — shortlisted
  {
    job: "job-019", cand: "cand-005", status: "shortlisted", applied: 9, match: 87, salary: 130000,
    letter:
      "I have built wallet onboarding and connection flows for the past two years and would enjoy going deeper into the extension itself. My experience with Wagmi, Viem and accessibility would carry over directly. Toronto is on my list of cities to move to.",
    answers: [
      "Run dApp content in an isolated iframe or separate context, validate every message with strict schemas and never expose privileged APIs to page scripts.",
      "I would need relocation support, but I am open to a three-day office arrangement after a trial period.",
    ],
    steps: [
      ["under_review", 7, "Screened"],
      ["shortlisted", 5, "Strong frontend skills; exploring relocation fit"],
    ],
    notes: [[5, "Great skills. Need to confirm relocation expectations before technical round."]],
  },
  // 033 — demo seeker, rejected
  {
    job: "job-021", cand: "cand-001", status: "rejected", applied: 16, match: 77, salary: 150000,
    letter:
      "I have audited and reviewed contracts as part of my engineering work and hold a Certified Smart Contract Auditor credential. Quill's rigorous methodology is something I admire, and I would love to develop as a full-time auditor. My engineering depth would help me understand client codebases quickly.",
    answers: [
      "Most notable: a rounding exploit in a rewards accumulator, an ERC-4626 inflation edge case and an access-control gap in a vault upgrade, all found pre-audit in my own team's code.",
      "I map trust boundaries between contracts, list every external call with state implications and write invariants for cross-contract accounting.",
    ],
    steps: [
      ["under_review", 14, "Screened"],
      ["shortlisted", 12, "Engineering background impressive"],
      ["interview", 10, "Technical interview completed with Gareth Holloway"],
      ["rejected", 6, "Not moving forward: the role needs 3+ years of dedicated audit experience"],
    ],
  },
  // 034 — shortlisted
  {
    job: "job-021", cand: "cand-003", status: "shortlisted", applied: 7, match: 94, salary: 160000,
    letter:
      "I have led more than 35 audits and would welcome the opportunity to bring that experience to a firm that values methodical review. Quill's public methodology and mentoring culture appeal to me. I am comfortable leading engagements and coaching analysts.",
    answers: [
      "A cross-chain message replay in a bridge, a share inflation bug in a lending vault and a governance takeover via mis-scoped quorum.",
      "I start from the interactions diagram, enumerate trust assumptions between contracts and use invariants to test system-wide accounting.",
    ],
    steps: [
      ["under_review", 5, "Screened"],
      ["shortlisted", 3, "Very strong auditor profile"],
    ],
  },
  // 035 — interview
  {
    job: "job-021", cand: "cand-020", status: "interview", applied: 12, match: 89, salary: 145000,
    letter:
      "I audit lending and staking protocols today and want to join a larger team where I can learn from principal auditors. My Foundry invariant template is used on every engagement at my current firm. I would enjoy contributing it and more to Quill.",
    answers: [
      "A rounding bug in a staking contract, an unsafe external call in a vault withdrawal and an unchecked oracle freshness assumption.",
      "I map every external call and its callers, look for reentrancy across contracts and test accounting invariants system-wide.",
    ],
    steps: [
      ["under_review", 10, "Screened"],
      ["shortlisted", 8, "Great profile"],
      ["interview", 5, "Technical interview requested"],
    ],
  },
  // 036 — withdrawn
  {
    job: "job-022", cand: "cand-006", status: "withdrawn", applied: 8, match: 79, salary: 2500,
    letter:
      "I am a junior developer eager to move into security. I have practised with Ethernaut-style challenges and enjoy reasoning about how contracts can break. The analyst programme looks like a perfect way to learn the craft.",
    answers: [
      "I completed the first 20 Ethernaut levels and wrote up reentrancy and delegatecall lessons on my blog.",
      "Reentrancy through callbacks, because it is easy to miss even when you know the pattern.",
    ],
    steps: [
      ["under_review", 6, "Screened"],
      ["withdrawn", 4, "Candidate withdrew after accepting another internship"],
    ],
  },
  // 037 — interview
  {
    job: "job-023", cand: "cand-011", status: "interview", applied: 11, match: 96, salary: 195000,
    letter:
      "I design Circom circuits for private voting and light-client verification and have implemented pairing-based SNARK verifiers in Rust. Tessera's ZK light clients are exactly the problem I want to work on full time. I can start in two weeks.",
    answers: [
      "A missing range check on a bit-decomposition let a malicious prover forge values; we caught it in review and added a standard gadget.",
      "Use lookup tables or custom gates for hashing, restructure the circuit to reduce non-native arithmetic and batch where possible.",
    ],
    steps: [
      ["under_review", 9, "Screened"],
      ["shortlisted", 7, "Top-tier ZK profile"],
      ["interview", 3, "Technical deep dive requested"],
    ],
  },
  // 038 — shortlisted
  {
    job: "job-024", cand: "cand-019", status: "shortlisted", applied: 13, match: 80, salary: 150000,
    letter:
      "I have built Go services for blockchain settlement for three years and am interested in moving closer to the protocol layer. Cosmos SDK is new territory, but I have studied it and built a small module as a learning project.",
    answers: [
      "A custom module for rate-limiting transfers as a learning project; I would welcome deeper involvement.",
      "I would simulate upgrades on a fork of mainnet state, run migration tests and stage the rollout on a testnet first.",
    ],
    steps: [
      ["under_review", 11, "Screened"],
      ["shortlisted", 8, "Strong Go engineer; Cosmos knowledge to be assessed"],
    ],
  },
  // 039 — interview
  {
    job: "job-027", cand: "cand-004", status: "interview", applied: 10, match: 93, salary: 150000,
    letter:
      "I write Anchor programs for payments and have optimised compute usage by 35% with zero-copy accounts. Solstice's stablecoin rails are exactly the kind of production Solana work I want to do. I can start immediately.",
    answers: [
      "I verify every account's owner, discriminator and seeds with Anchor constraints and never trust client-provided PDAs without re-deriving them.",
      "Moving large account state to zero-copy and removing redundant deserialisation saved roughly 35% of compute in our streaming payroll program.",
    ],
    steps: [
      ["under_review", 8, "Screened"],
      ["shortlisted", 6, "Excellent Anchor portfolio"],
      ["interview", 3, "Technical interview requested"],
    ],
  },
  // 040 — demo seeker, withdrawn
  {
    job: "job-027", cand: "cand-001", status: "withdrawn", applied: 9, match: 57, salary: 160000,
    letter:
      "I am a Solidity engineer looking to broaden into Solana. I have studied Anchor and built a small escrow program, and I would like to learn how Solstice approaches payment security. I understand the role is Rust-heavy and am keen to grow into it.",
    answers: [
      "Verify account ownership and use PDA seeds with bump validation, which I learned building a small escrow program.",
      "I have not yet profiled compute units in production, but I would start with account layout and serialisation costs.",
    ],
    steps: [
      ["under_review", 7, "Screened"],
      ["withdrawn", 5, "Candidate withdrew: role is Rust-heavy and she prefers EVM"],
    ],
  },
];

export const applications: Application[] = specs.map((spec, index) => build(index + 1, spec));
