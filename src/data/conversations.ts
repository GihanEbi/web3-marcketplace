import type { Conversation, Message } from "@/types";
import { applications } from "./applications";
import { candidates } from "./candidates";
import { daysAgo, pad } from "./helpers";
import { users } from "./users";

/** "s" = seeker (candidate) speaking, "e" = employer. Tuple: [who, days ago, UTC hour, text]. */
type Line = ["s" | "e", number, number, string];

interface Spec {
  application: string;
  employerUserId: string;
  subject: string;
  unread: { seeker: number; employer: number };
  lines: Line[];
}

function build(n: number, spec: Spec): Conversation {
  const app = applications.find((a) => a.id === spec.application);
  if (!app) throw new Error(`Seed error: conversation ${n} references missing application ${spec.application}`);
  const candidate = candidates.find((c) => c.id === app.candidateId);
  const employer = users.find((u) => u.id === spec.employerUserId);
  if (!candidate || !employer) throw new Error(`Seed error: conversation ${n} has missing participants`);
  const id = `conv-${pad(n)}`;

  const messages: Message[] = spec.lines.map(([who, ago, hour, text], i) => ({
    id: `msg-${id}-${i + 1}`,
    senderRole: who === "s" ? "seeker" : "employer",
    senderName: who === "s" ? candidate.name : employer.name,
    text,
    at: daysAgo(ago, hour),
  }));

  return {
    id,
    candidateId: candidate.id,
    companyId: app.companyId,
    employerUserId: employer.id,
    subject: spec.subject,
    applicationId: app.id,
    jobId: app.jobId,
    messages,
    unread: spec.unread,
    updatedAt: messages[messages.length - 1].at,
  };
}

const specs: Spec[] = [
  // 001 — Aria x Nimbus (interview prep), 1 unread for Aria
  {
    application: "app-001",
    employerUserId: "usr-e-001",
    subject: "Technical interview: Senior Solidity Developer",
    unread: { seeker: 1, employer: 0 },
    lines: [
      ["e", 4, 10, "Hi Aria, thanks for your patience. We'd like to move you to a technical interview for the Senior Solidity Developer role. Would Tuesday, Nov 4 at 14:00 UTC work for you?"],
      ["s", 4, 11.5, "Hi Maya, thank you! Nov 4 at 14:00 UTC works well for me. Is there anything specific I should prepare?"],
      ["e", 4, 13, "Great, I'll send the invite. You'll meet Oskar Brandt, our Staff Engineer. Expect a live exercise writing an invariant for a vault withdrawal, followed by a design discussion on our paymaster module."],
      ["s", 3, 9, "Perfect. Should I use my own Foundry setup or will you provide a repo?"],
      ["e", 3, 10.5, "Your own setup is fine. We'll share a small repo with starter contracts 24 hours before. Please make sure Foundry is on the latest stable release."],
      ["s", 1, 16, "Understood, thanks. Is the interview pair-programming style or more of a whiteboard conversation?"],
      ["e", 0, 8, "Mostly pair-programming, with the last 15 minutes for design discussion. The starter repo is now attached to the calendar invite, so you can take a look whenever you like."],
    ],
  },
  // 002 — Aria x Nimbus (security role), 2 unread for Aria
  {
    application: "app-010",
    employerUserId: "usr-e-001",
    subject: "Smart Contract Security Engineer: next steps",
    unread: { seeker: 2, employer: 0 },
    lines: [
      ["e", 4, 15, "Hi Aria, we've shortlisted you for the Smart Contract Security Engineer role. The panel loved your invariant testing work."],
      ["s", 4, 16.5, "Thank you, Maya! That's great to hear. I'm particularly interested in building out internal review processes."],
      ["e", 3, 9, "That's exactly what this role is about. The position is hybrid in Berlin, two days a week. Would that work, or would you rather focus on the remote Solidity role?"],
      ["s", 3, 10, "I'm Lisbon-based, so two days a week in Berlin is a stretch long term, but I'd happily travel for onsite weeks. The remote Solidity role is my first preference."],
      ["e", 1, 14, "Understood. I'll raise it with the security panel and see whether a remote arrangement is possible. I'll confirm by Friday."],
      ["e", 0, 7.5, "Quick update: the panel is open to a mostly-remote setup with a monthly onsite week in Berlin. Would you be comfortable with that?"],
    ],
  },
  // 003 — Aria x Helix (offer), 1 unread for employer
  {
    application: "app-021",
    employerUserId: "usr-e-002",
    subject: "Offer details: DeFi Protocol Developer",
    unread: { seeker: 0, employer: 1 },
    lines: [
      ["e", 2, 10, "Hi Aria, great news: the team would like to offer you the DeFi Protocol Developer role. The formal letter is attached, but the headline is 185,000 USDC base plus a 0.8% token allocation vesting over four years."],
      ["s", 2, 12, "Thank you so much, Daniel, I'm thrilled! I'll review the letter carefully. Could you tell me more about the vesting cliff and whether the token allocation has lock-ups?"],
      ["e", 2, 14.5, "Of course. There's a 12-month cliff, then monthly vesting for 36 months. Tokens are liquid as they vest, with no extra lock-ups beyond standard trading windows."],
      ["s", 1, 9, "That's clear, thanks. I have another process finishing this week. Could I confirm by next Friday, Nov 7?"],
      ["e", 1, 11, "Absolutely, Nov 7 works. Let me know if you'd like another call with Ines or me to discuss the roadmap before deciding."],
      ["s", 0, 7, "I'd love a short call with Ines to discuss the risk-parameters working group. Is Thursday possible?"],
    ],
  },
  // 004 — Aria x Parallax
  {
    application: "app-029",
    employerUserId: "usr-e-004",
    subject: "Your application: Full Stack Web3 Engineer",
    unread: { seeker: 0, employer: 1 },
    lines: [
      ["e", 3, 6, "Hello Aria, thank you for applying to the Full Stack Web3 Engineer role at Parallax Finance. Your contract experience stands out. Could you tell us about your timeline for a potential move to Singapore?"],
      ["s", 3, 10, "Hi Kenji, thanks for reaching out. I'm based in Lisbon and would prefer a primarily remote setup, but I'm open to periodic stays in Singapore. Is the hybrid requirement flexible?"],
      ["e", 2, 5.5, "Thanks for being upfront. The role is built around three office days a week, though we sometimes make exceptions for senior hires. I'll check with the team and come back to you."],
      ["s", 2, 9, "Understood, I appreciate it. I'm happy to continue if an exception is possible, otherwise I fully respect your needs."],
    ],
  },
  // 005 — Yuki x Nimbus
  {
    application: "app-006",
    employerUserId: "usr-e-001",
    subject: "Frontend technical interview scheduling",
    unread: { seeker: 0, employer: 1 },
    lines: [
      ["e", 5, 10, "Hi Yuki, we enjoyed your portfolio. Can we schedule a technical interview for Nov 3 at 13:00 UTC (22:00 JST)?"],
      ["s", 5, 12, "Hello Maya, thank you. 22:00 JST works for me. Will it be a pair-programming session?"],
      ["e", 5, 13.5, "Yes, we'll pair on a Wagmi hook for transaction status, then discuss your onboarding project at Kitsune Wallet."],
      ["s", 1, 8, "Quick note: I'll share my screen with VS Code and a local Next.js app. Is that fine, or would you prefer a hosted sandbox?"],
    ],
  },
  // 006 — Elena x Nimbus
  {
    application: "app-009",
    employerUserId: "usr-e-001",
    subject: "System design round: Security Engineer",
    unread: { seeker: 0, employer: 0 },
    lines: [
      ["e", 8, 10, "Hi Elena, thank you for the great first conversation. We'd like to invite you to a system design interview with Lena Fischer, our Security Lead."],
      ["s", 8, 12, "Thank you, Maya. I'm happy to continue. Is there a design topic I should prepare?"],
      ["e", 7, 9, "We'll ask you to threat-model a cross-rollup messaging design and propose a review plan. No need to prepare slides."],
      ["s", 7, 10.5, "Sounds good. Is it a whiteboard-style session? I'd like to prepare a few diagrams if useful."],
      ["e", 7, 13, "Whiteboard style works well, and we'll use a shared board. Nov 6 at 10:00 UTC is now in your calendar."],
      ["s", 6, 8, "Confirmed. Looking forward to it."],
    ],
  },
  // 007 — Tomás x Nimbus (offer negotiation), employer unread
  {
    application: "app-002",
    employerUserId: "usr-e-001",
    subject: "Offer: Senior Solidity Developer",
    unread: { seeker: 0, employer: 1 },
    lines: [
      ["e", 3, 10, "Hi Tomás, congratulations! The team would like to offer you the Senior Solidity Developer role at Nimbus Labs. The headline: $178,000 base with a four-year token grant, fully remote from Buenos Aires."],
      ["s", 3, 13, "Thank you, Maya, this is wonderful news and I'm very excited about the role. May I take a few days to review the details?"],
      ["e", 3, 14, "Of course. Take the time you need; the offer is open for two weeks. I'm happy to answer any questions."],
      ["s", 2, 9, "I have two questions: is there flexibility on the start date, and have other hires in Argentina had to handle anything special for the token grant?"],
      ["e", 1, 11, "Start date is flexible within six weeks. For tax matters we recommend a local advisor, and we can reimburse up to $1,000 for professional advice."],
      ["s", 1, 14, "That's very helpful, thank you. Could the base be revisited to $185,000? I have a competing process, but Nimbus is my first choice."],
    ],
  },
  // 008 — Dmitri x Nimbus
  {
    application: "app-013",
    employerUserId: "usr-e-001",
    subject: "Backend Engineer: final round",
    unread: { seeker: 0, employer: 1 },
    lines: [
      ["e", 7, 10, "Hi Dmitri, thank you for the technical round. Feedback was excellent. We'd like to schedule a final conversation with Tariq Haddad, our Engineering Manager."],
      ["s", 7, 12, "Thanks Maya! Happy to proceed. Do you have times next week?"],
      ["e", 6, 9, "How about Nov 8 at 15:00 UTC (16:00 in Belgrade)?"],
      ["s", 6, 11, "That works perfectly. Could you share who else will join?"],
      ["e", 5, 14, "Tariq plus a senior backend engineer from the indexing team. It runs 60 minutes and covers collaboration and ownership topics."],
      ["s", 0, 6.5, "Thanks. One more question: will the on-call rotation be part of the discussion? I'd like to understand how frequent it is."],
    ],
  },
  // 009 — Lars x Nimbus (offer)
  {
    application: "app-015",
    employerUserId: "usr-e-001",
    subject: "Offer: DevOps Engineer",
    unread: { seeker: 1, employer: 0 },
    lines: [
      ["e", 2, 10, "Hi Lars, I'm delighted to share that we'd like to offer you the DevOps Engineer role. Base is $148,000 plus a token grant, hybrid in Berlin."],
      ["s", 2, 13, "Thank you, Maya, I'm very happy. The Berlin hybrid is something I need to discuss with my family. Is relocation support available?"],
      ["e", 1, 9, "Yes: we offer up to €8,000 as a relocation allowance plus two weeks of temporary housing."],
      ["s", 1, 11, "That's generous. I'd like to propose starting January 5 so I can serve my notice and move. Would that work?"],
      ["e", 1, 14, "January 5 works for us. I'll update the offer letter and send it for signature today."],
    ],
  },
  // 010 — Ethan x Nimbus (hiring paused)
  {
    application: "app-017",
    employerUserId: "usr-e-001",
    subject: "Technical Lead role: update",
    unread: { seeker: 0, employer: 0 },
    lines: [
      ["e", 5, 11, "Hi Ethan, thank you for the thoughtful system design interview. The panel was impressed."],
      ["s", 5, 13, "Thank you, Maya. I enjoyed the conversation. Any sense of next steps?"],
      ["e", 4, 9, "Honest update: we've paused hiring for this role while we finalise our team structure. We'd like to keep you warm and revisit in about four weeks."],
      ["s", 4, 10.5, "I appreciate the transparency. I'm happy to wait, though I'm also speaking with other teams. Please keep me posted."],
      ["e", 4, 11, "Will do. You'll hear from me by the end of November either way."],
    ],
  },
  // 011 — Zainab x Nimbus
  {
    application: "app-003",
    employerUserId: "usr-e-001",
    subject: "Shortlisted: Senior Solidity Developer",
    unread: { seeker: 0, employer: 1 },
    lines: [
      ["e", 5, 14, "Hi Zainab, we've shortlisted you for the Senior Solidity Developer role. Before booking interviews, could you share a sample audit report or a Foundry suite you're proud of?"],
      ["s", 5, 16, "Hi Maya, thank you! I'll send my Fuzz Starter template and an anonymised audit summary shortly."],
      ["s", 4, 9, "Here's the link: github.example/zainab-ahmed/fuzz-starter, plus a redacted report attached to this message."],
      ["e", 3, 10, "Thanks, Zainab. The team really liked the invariant structure. We'll get back to you with next steps by Thursday."],
      ["s", 0, 7, "Just checking in as I haven't heard back yet. I'm also weighing an audit-firm opportunity and wanted to keep you updated on my timeline."],
    ],
  },
  // 012 — Tomás x Helix
  {
    application: "app-022",
    employerUserId: "usr-e-002",
    subject: "Culture-fit interview: Helix Protocol",
    unread: { seeker: 0, employer: 0 },
    lines: [
      ["e", 3, 10, "Hi Tomás, our team enjoyed your technical review. We'd like to book a culture-fit conversation with me next week."],
      ["s", 3, 12, "Hi Daniel, thanks! I'm available most afternoons Buenos Aires time."],
      ["e", 2, 9, "Great: Nov 5 at 16:00 UTC (13:00 in Buenos Aires) works for us. Does that suit you?"],
      ["s", 2, 11, "Perfect. See you then."],
    ],
  },
  // 013 — Noor x Orbit DAO
  {
    application: "app-026",
    employerUserId: "usr-e-003",
    subject: "Community Lead application",
    unread: { seeker: 1, employer: 0 },
    lines: [
      ["e", 5, 9, "Hi Noor, thanks for applying for the Community Lead role at Orbit DAO. Your wallet product background is interesting."],
      ["s", 5, 11, "Thank you, Sofia. I've admired Orbit's contributor model for a while and I'm happy to answer any questions."],
      ["e", 4, 8, "Could you tell me which governance communities you've been active in, and how many hours a week you could commit?"],
      ["s", 4, 10, "I've been a delegate in two protocol DAOs and could commit around 25 hours a week alongside part-time consulting."],
      ["e", 0, 7, "Thanks, that's helpful. The stewards will review your application at Thursday's call and I'll confirm next steps afterwards."],
    ],
  },
  // 014 — Priyanka x Parallax
  {
    application: "app-030",
    employerUserId: "usr-e-004",
    subject: "Technical interview: Parallax Finance",
    unread: { seeker: 0, employer: 0 },
    lines: [
      ["e", 4, 4, "Hi Priyanka, thank you for completing the take-home exercise. We'd like to invite you to a technical interview with Mei Tan, our frontend lead."],
      ["s", 4, 8, "Hi Kenji, thank you! I'd be glad to. I'm available any weekday afternoon IST."],
      ["e", 3, 5, "Nov 7 at 09:00 UTC (14:30 IST) is open. Does that work?"],
      ["s", 3, 7, "Yes, that works. Will there be a coding component?"],
      ["e", 3, 8, "We'll review your take-home together and then talk through real-time UI performance. No live coding."],
    ],
  },
  // 015 — Hannah x Lumen
  {
    application: "app-031",
    employerUserId: "usr-e-005",
    subject: "Portfolio review: Product Designer",
    unread: { seeker: 1, employer: 0 },
    lines: [
      ["e", 6, 14, "Hi Hannah, your approvals redesign case study was brilliant. We'd love to schedule a portfolio review with Jonas Weber, our design lead."],
      ["s", 6, 16, "Thank you, Priya! I'd be delighted. Would Wednesday or Thursday work?"],
      ["e", 5, 13, "Thursday afternoon CET suits us. I'll send a few slots shortly."],
      ["e", 2, 10, "Sending the slots now: Thursday 13:00, 14:30 or 16:00 CET. Please pick whichever suits you best."],
      ["s", 2, 12, "13:00 CET works for me. Thank you!"],
      ["e", 1, 9, "Booked. Jonas will send a calendar invite shortly."],
    ],
  },
];

export const conversations: Conversation[] = specs.map((spec, i) => build(i + 1, spec));
