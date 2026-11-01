# Chainhire — AI-powered Web3 Job Marketplace (frontend demo)

A premium, fully interactive **frontend-only** Web3 job marketplace built with Next.js (App Router), TypeScript, Tailwind CSS and shadcn/ui.
Everything runs in the browser against realistic **mock data** persisted to `localStorage` — there is no backend, database, real
authentication, blockchain connection, payment gateway or LLM call.

> It is designed as a portfolio piece, a product prototype and a foundation for real backend / AI / Web3 integration.
> All companies, people, wallets and transactions are fictional or simulated.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npx tsc --noEmit`.

Requires Node.js 20+.

## Demo accounts

Open **/login** and click a demo card (or use the **Demo role** switcher in the dashboard header at any time):

| Role | User | What you can do |
| --- | --- | --- |
| Job Seeker | Aria Chen | Search & apply, profile, applications, saved jobs, AI assistant, recommendations, interviews, wallet, freelance contracts |
| Employer | Maya Lindqvist (Nimbus Labs) | Post & manage jobs, ATS (kanban + table), interviews, freelance projects, proposals, escrow contracts, AI recruitment tools |
| Administrator | Platform admin | Users, companies, job moderation, reports, subscriptions, platform settings |

Any seeded e-mail works with any password on the e-mail form. You can also **register** new seeker / employer accounts (stored locally).
Role switching is simulated in the browser — it is **not** real authentication or security.

## Feature tour

* **Public site** – landing page, job directory with working filters/sort/pagination, job details, companies directory + profiles,
  freelance projects, Web3 bounties, pricing.
* **Job seeker** – dashboard, editable profile (persisted), applications with timeline, saved jobs, multi-step application flow with
  AI cover-letter help and duplicate prevention, deterministic job recommendations with match breakdown, interviews, messages, wallet, contracts.
* **Employer** – dashboard analytics, company profile, job create/edit/preview/publish/pause/close/delete, Applicant Tracking System
  (drag-and-drop Kanban + table), candidate details with internal notes, interview scheduling, freelance projects & proposals, escrow contracts.
* **AI (mocked)** – career assistant chat, resume analysis, cover-letter generator, recruitment assistant (job description, candidate summaries,
  comparison, interview questions, insights) and an AI activity log. See `src/services/ai-service.ts`.
* **Web3 (simulated)** – connect demo wallet (MetaMask / WalletConnect / Coinbase / Phantom / Rainbow), network switching, mock balances,
  and a smart-contract **escrow simulation** (fund → submit → approve → release) clearly labelled as simulated.
* **Admin** – KPIs & charts, user management, job moderation, company verification/suspension, reports & disputes, subscriptions, settings.
* **Cross-role sync** – applications, statuses, interviews, messages, proposals and contracts are shared state: act as an employer, switch
  to the seeker and see the result immediately.
* Dark-first theme with light mode, responsive layouts, skeleton/empty/error states, toasts, confirmation dialogs, accessible controls.

### End-to-end flows to try

1. **Seeker applies** – /jobs → filter → open a job → save → *Apply now* → submit → see it in *Applications* → switch to Employer → *Jobs → Applicants*.
2. **Employer publishes** – Employer → *Jobs → Create* → preview → publish → *Manage jobs* → check public /jobs.
   (With "Require job approval" on in Admin settings a new job first shows as *Pending* until an admin approves it.)
3. **Recruitment pipeline** – Employer → job applicants → drag a candidate to *Shortlisted* → schedule interview → send message → switch to Seeker.
4. **AI matching** – Seeker → *Recommended jobs* → pick a job → matching/missing skills → generate, edit and copy a cover letter.
5. **Freelance & escrow** – Employer creates a project → Seeker submits a proposal → Employer accepts → fund escrow → Seeker submits milestone → Employer approves and releases payment.

Use **Settings → Reset demo data** to restore the seeded state at any time.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for conventions. In short:

```
src/app          routes (route groups: (public), (auth), (seeker), employer, admin)
src/components   ui (shadcn/Base UI), shared (domain components), layout, wallet, ai, feature folders
src/config       navigation per role
src/data         typed seed data (30 jobs, 12 companies, 20 candidates, 40 applications, …)
src/lib          clock, formatting, deterministic matching, job filters, constants
src/services     async mock API layer (api.ts, ai-service.ts) — swap for HTTP calls later
src/store        Zustand store (persisted to localStorage) + read hooks
src/types        domain models
```

Key design decisions:

* **Replaceable services** – components never mutate data directly; they call async functions such as `applyToJob`, `createJob`,
  `updateApplicationStatus`, `submitProposal`, `approveMilestone`, `generateMockAIResponse` (all in `src/services`). Each simulates latency and
  throws friendly errors, so swapping in `fetch()` calls later requires no component changes.
* **Hydration-safe persistence** – the store renders seed data on the server and first client render, then merges `localStorage` after mount
  (`skipHydration`); pages show skeletons until `useHydrated()` is true.
* **Virtual clock** – `src/lib/clock.ts` anchors "now" to the seed date so relative times and deadlines stay realistic regardless of when you run the demo.
* **Deterministic AI/matching** – scores are computed from candidate skills, experience, salary and work preferences (`src/lib/matching.ts`); no randomness.

## Scope

Intentionally **not** implemented: real backend/APIs, database, e-mail delivery, authentication providers, wallet SDKs, on-chain transactions,
smart-contract deployment, payment gateways, real LLM calls, DAO governance, NFT minting, staking, referrals, KYC, compliance automation.
