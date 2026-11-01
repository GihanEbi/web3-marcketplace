# Chainhire – Architecture & Conventions

Frontend-only AI-powered Web3 job marketplace. **No backend**: all data is seeded from `src/data`, held in a Zustand
store (`src/store/app-store.ts`) and persisted to `localStorage`. Writes go through async mock services
(`src/services`) so they can later be swapped for HTTP calls.

## Stack gotchas (READ THESE)

* **Next.js 16 / React 19.** Route `params` are Promises. In client components use `useParams()` from `next/navigation`
  (e.g. `const { id } = useParams<{ id: string }>()`). `useSearchParams()` must be inside a `<Suspense>` boundary.
  Every page that touches the store is a Client Component (`"use client"` at top).
* **shadcn/ui here is the `base-nova` style built on Base UI, NOT Radix.** There is **no `asChild`**.
  * Polymorphism uses the `render` prop: `<DropdownMenuTrigger render={<Button variant="ghost" />}>Open</DropdownMenuTrigger>`,
    `<TooltipTrigger render={<span />}>`, `<DialogTrigger render={<Button />}>`.
  * Links that look like buttons: `<Link href="/jobs" className={buttonVariants({ variant: "gradient", size: "lg" })}>`.
    (Do NOT nest `<Link>` inside `<Button>`.)
  * Button variants: `default | gradient | outline | secondary | ghost | destructive | link`; sizes `xs | sm | default | lg | icon | icon-xs | icon-sm | icon-lg`.
  * `Select` (Base UI): `onValueChange(value: string | null)`; `SelectValue` shows the raw value, so prefer our
    `SelectField` wrapper (`src/components/shared/select-field.tsx`, native `<select>` styling) for simple dropdowns.
  * `DropdownMenuLabel` MUST be inside a `DropdownMenuGroup` (Base UI throws otherwise). Menu rows that navigate:
    `<DropdownMenuItem render={<Link href="/x" />}>…</DropdownMenuItem>`. `DropdownMenuContent` width follows the trigger by default — pass `className="w-56"` etc.
  * `PopoverContent`/`DropdownMenuContent` accept `align`, `side`, `sideOffset`. `DialogContent` accepts `className` for width (e.g. `sm:max-w-lg`).
  * `Tabs`: `<Tabs value onValueChange><TabsList><TabsTrigger value="x"/></TabsList><TabsContent value="x"/></Tabs>`.
  * `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tooltip` – composed parts like shadcn; open state via
    `open`/`onOpenChange`. `Progress` takes `value` (0-100).
  * Toasts: `import { toast } from "sonner"` (Toaster already mounted in `Providers`).
* **lucide-react has NO brand icons** (no Github/Twitter/Linkedin). Use `GithubIcon`, `XIcon`, `LinkedinIcon`, `DiscordIcon` from
  `@/components/brand/brand-icons`. Logo: `Logo`/`LogoMark` from `@/components/brand/logo`.
* Imports use the `@/` alias. `cn` lives in `@/lib/utils`.
* Icons: `lucide-react` (import named icons, e.g. `import { Briefcase } from "lucide-react"`).
* Animations: `framer-motion` (`import { motion } from "framer-motion"`) – keep them subtle.
* Charts: `recharts`. Use CSS vars for colours: `var(--chart-1)` … `var(--chart-5)` (they are full `oklch()` colours, use them directly as `stroke`/`fill`).
* Forms: `react-hook-form` + `zod` + `@hookform/resolvers/zod` (`zodResolver`). Zod v4.
* Fonts/theme: set up in root layout; dark theme is default, light optional via `next-themes`. Use semantic tokens
  (`bg-background`, `bg-card`, `text-muted-foreground`, `border-border`, `text-primary`, `text-success`, `text-warning`, `text-info`)
  — never hard-code gray palettes. Brand gradient helpers: `gradient-text`, `gradient-brand`, `glass`, `card-glow`, `bg-grid`.

## Data & state rules

1. **Hydration safety.** The store starts with seed data on server + first client render and merges localStorage after
   mount, then sets `hydrated = true`. Every data-driven page/component must gate on `useHydrated()` and render a
   skeleton (`LoadingSkeleton` variants) until ready. Never read `localStorage`, `window`, `Date.now()` or `Math.random()`
   during render.
2. **Time.** Never use `new Date()` / `Date.now()` for domain logic. Use `appNow()` / `nowIso()` / `addDaysIso()` from
   `@/lib/clock` (virtual clock anchored to the seed date) and `formatDate`, `formatDateTime`, `formatRelative`,
   `daysUntil` from `@/lib/format`.
3. **Reads:** use hooks in `src/store/hooks.ts` or `useAppStore((s) => s.jobs)` with `useMemo`/derivations. **Never return a new
   array/object from a zustand selector** (infinite loop). Select raw slices; derive with `useMemo`.
4. **Writes:** only through `src/services` (`import { applyToJob, ... } from "@/services"`). They are async (simulated latency),
   throw `Error` with user-friendly messages, and mutate the store. Wrap calls in `try/catch` + `toast.success/error`, and
   show a pending/disabled state on the triggering button. Components must never mutate seeded data directly.
5. **Session:** `useCurrentUser()`, `useRole()`, `useCurrentCandidate()`, `useCurrentCompany()`. Demo accounts are in
   `DEMO_ACCOUNTS` (`@/lib/constants`). Role gating is simulated by `RoleGuard` in the layouts (not real security).
6. **Matching:** `computeMatch(candidate, job)` from `@/lib/matching` – deterministic. `profileCompletion(candidate)` too.
7. **Public job visibility:** `isJobPublic(job, companies)` / `getPublicJobs()` in `@/lib/job-filters`; filtering via
   `filterAndSortJobs()` with `JobFilters` / `DEFAULT_JOB_FILTERS`.
8. Handle missing records gracefully: use `NotFoundState` (shared) when an `[id]` lookup fails.
9. Strict TypeScript, no `any`. Domain types live in `src/types/index.ts`; constants in `src/lib/constants.ts`.

## Folder map

```
src/app
  (public)/        marketing + discovery pages (public header/footer layout)
  (auth)/          login, register
  (seeker)/        job-seeker dashboard routes (shared DashboardShell role="seeker")
  employer/        employer routes (DashboardShell role="employer")
  admin/           admin routes (DashboardShell role="admin")
src/components
  ui/              shadcn primitives (Base UI)
  shared/          reusable domain components (JobCard, StatusBadge, DataTable, …)
  layout/          shells: AppSidebar, DashboardHeader, MobileNavigation, public header/footer, RoleGuard, …
  wallet/          WalletConnectModal, WalletButton, escrow components
  ai/              AIChatInterface and AI widgets
  <feature>/       feature-specific components (jobs/, ats/, messaging/, …)
src/config/nav.ts  sidebar navigation per role
src/data           seed data (do not import in components – use the store)
src/lib            clock, format, matching, job-filters, constants, utils
src/services       async mock API layer (+ ai-service.ts)
src/store          zustand store + read hooks
src/types          domain models
```

## Layout / UX conventions

* Dashboard pages render inside `DashboardShell` (sidebar + header + breadcrumbs already provided). Each page starts with
  `<PageHeader title description actions />` and content in a `space-y-6` stack. Max width is handled by the shell.
* Public pages render inside the public layout (header + footer provided); wrap content in `<div className="container mx-auto px-4 ...">`.
* Always provide: loading skeleton, empty state (`EmptyState`), and error/not-found state. Destructive actions use `ConfirmationDialog`.
* Cards: `rounded-xl border bg-card`, subtle hover `hover:border-primary/40`, soft shadows. Keep spacing generous.
* Responsive: mobile-first, test at 375px, 768px, 1280px. Tables inside `overflow-x-auto`.
* Accessible: label every input, `aria-label` on icon-only buttons, visible focus rings (provided by primitives).
