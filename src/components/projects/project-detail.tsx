"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Coins,
  FileText,
  Flag,
  Info,
  Layers,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/shared/company-logo";
import { EmptyState, NotFoundState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatProjectBudget, ProjectCard } from "@/components/shared/project-card";
import { SkillTagList } from "@/components/shared/skill-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { DemoOrgBadge, VerifiedBadge } from "@/components/shared/verified-badge";
import { formatCurrency, formatDate, formatNumber, formatRelative, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCompany, useCurrentCandidate, useCurrentUser, useHydrated } from "@/store/hooks";
import { SubmitProposalDialog } from "./submit-proposal-dialog";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="mb-3 font-heading text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const projects = useAppStore((s) => s.projects);
  const proposals = useAppStore((s) => s.proposals);
  const user = useCurrentUser();
  const candidate = useCurrentCandidate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  const client = useCompany(project?.clientCompanyId);

  const projectProposals = useMemo(
    () => (project ? proposals.filter((p) => p.projectId === project.id) : []),
    [proposals, project],
  );
  const proposalCount = useMemo(() => projectProposals.filter((p) => p.status !== "withdrawn").length, [projectProposals]);
  const myProposals = useMemo(
    () => (candidate ? projectProposals.filter((p) => p.freelancerId === candidate.id) : []),
    [projectProposals, candidate],
  );
  const activeProposal = myProposals.find((p) => p.status !== "withdrawn");

  const similar = useMemo(() => {
    if (!project) return [];
    const mine = new Set(project.skills.map((s) => s.toLowerCase()));
    return projects
      .filter((p) => p.id !== project.id && p.status === "open")
      .map((p) => ({ p, score: p.skills.filter((s) => mine.has(s.toLowerCase())).length }))
      .sort((a, b) => b.score - a.score || Date.parse(b.p.postedAt) - Date.parse(a.p.postedAt))
      .slice(0, 3)
      .map((x) => x.p);
  }, [projects, project]);

  if (!hydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  const hiddenFromPublic = project && (project.status === "draft" || client?.suspended);
  const isOwner = Boolean(project && user?.role === "employer" && user.companyId === project.clientCompanyId);

  if (!project || (hiddenFromPublic && !isOwner && user?.role !== "admin")) {
    return (
      <div className="container mx-auto px-4 py-12">
        <NotFoundState entity="project" backHref="/projects" backLabel="Browse projects" />
      </div>
    );
  }

  const isOpen = project.status === "open";
  const total = project.milestones.reduce((sum, m) => sum + m.amount, 0);
  const loginHref = `/login?next=${encodeURIComponent(`/projects/${project.id}`)}`;

  let proposalPanel: ReactNode;
  if (!user) {
    proposalPanel = (
      <>
        <p className="text-sm text-muted-foreground">Log in with a job seeker account to send a proposal to this client.</p>
        <Link href={loginHref} className={cn(buttonVariants({ variant: "gradient", size: "lg" }), "w-full")}>
          Log in to submit a proposal
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create a free profile
          </Link>
        </p>
      </>
    );
  } else if (isOwner) {
    proposalPanel = (
      <>
        <p className="text-sm text-muted-foreground">
          This is your project. You have {pluralize(proposalCount, "proposal")} to review.
        </p>
        <Link href="/employer/proposals" className={cn(buttonVariants({ variant: "gradient", size: "lg" }), "w-full")}>
          Review proposals
        </Link>
      </>
    );
  } else if (user.role !== "seeker" || !candidate) {
    proposalPanel = (
      <div className="flex items-start gap-2.5 rounded-lg border border-info/30 bg-info/10 p-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
        <p className="text-muted-foreground">Only freelancer (job seeker) accounts can submit proposals. Switch accounts to apply to this project.</p>
      </div>
    );
  } else if (activeProposal) {
    proposalPanel = (
      <>
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="size-5" aria-hidden />
          <p className="font-semibold">Proposal submitted</p>
          <StatusBadge status={activeProposal.status} context="generic" size="sm" />
        </div>
        <p className="text-sm text-muted-foreground">
          You offered {formatCurrency(activeProposal.price, activeProposal.currency)} in {pluralize(activeProposal.deliveryWeeks, "week")}{" "}
          {formatRelative(activeProposal.submittedAt)}.
        </p>
        <Link href="/contracts" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
          Track in contracts
        </Link>
      </>
    );
  } else if (!isOpen) {
    proposalPanel = (
      <Button size="lg" className="w-full" disabled>
        Not accepting proposals
      </Button>
    );
  } else {
    proposalPanel = (
      <>
        <Button variant="gradient" size="lg" className="w-full" onClick={() => setDialogOpen(true)}>
          <Send aria-hidden />
          Submit Proposal
        </Button>
        <p className="text-center text-xs text-muted-foreground">Funds are held in a simulated escrow once your proposal is accepted.</p>
      </>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to projects
      </Link>

      {!isOpen && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold">
              {project.status === "in_progress"
                ? "This project has been filled"
                : project.status === "draft"
                  ? "This project is a draft"
                  : `This project is ${project.status.replace("_", " ")}`}
            </p>
            <p className="text-sm text-muted-foreground">It is no longer accepting new proposals.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <header className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              <span className="text-xs text-muted-foreground">Posted {formatRelative(project.postedAt)}</span>
            </div>
            <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{project.title}</h1>
            {client && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>by</span>
                <Link
                  href={`/companies/${client.id}`}
                  className="rounded-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  {client.name}
                </Link>
                <VerifiedBadge verified={client.verified} />
              </div>
            )}
            <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <Fact icon={<Banknote className="size-5" aria-hidden />} label={project.budgetType === "hourly" ? "Hourly rate" : "Fixed budget"}>
                <span className="font-heading text-lg">{formatProjectBudget(project)}</span>
              </Fact>
              <Fact icon={<CalendarClock className="size-5" aria-hidden />} label="Estimated duration">
                {pluralize(project.durationWeeks, "week")}
              </Fact>
              <Fact icon={<Coins className="size-5" aria-hidden />} label="Payment currency">
                {project.currency}
              </Fact>
              <Fact icon={<Layers className="size-5" aria-hidden />} label="Blockchain">
                {project.blockchain}
              </Fact>
              <Fact icon={<Flag className="size-5" aria-hidden />} label="Proposal deadline">
                {formatDate(project.deadline)}
              </Fact>
              <Fact icon={<FileText className="size-5" aria-hidden />} label="Proposals">
                {pluralize(proposalCount, "proposal")}
              </Fact>
            </dl>
          </header>

          <Section title="Project description">
            <div className="space-y-3 text-sm leading-relaxed text-pretty text-muted-foreground">
              {project.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </Section>

          <Section title="Skills required">
            <SkillTagList skills={project.skills} size="md" />
          </Section>

          {project.milestones.length > 0 && (
            <Section title="Milestone plan">
              <ol className="space-y-3">
                {project.milestones.map((m, i) => (
                  <li key={m.title} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">Due about {pluralize(Math.round(m.dueInDays / 7), "week")} after the start</p>
                    </div>
                    <p className="shrink-0 font-heading text-sm font-semibold tabular-nums">
                      {formatNumber(m.amount)} <span className="text-xs font-normal text-muted-foreground">{project.currency}</span>
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                Total across milestones: {formatNumber(total)} {project.currency}. Payments are released from a simulated escrow as each milestone is approved.
              </p>
            </Section>
          )}

          {myProposals.length > 0 && (
            <Section title="Your proposals">
              <ul className="space-y-3">
                {myProposals.map((p) => (
                  <li key={p.id} className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {formatCurrency(p.price, p.currency)} · {pluralize(p.deliveryWeeks, "week")}
                      </p>
                      <StatusBadge status={p.status} context="generic" size="sm" />
                    </div>
                    <p className="line-clamp-3 text-sm text-pretty text-muted-foreground">{p.coverLetter}</p>
                    <p className="text-xs text-muted-foreground">Submitted {formatRelative(p.submittedAt)}</p>
                  </li>
                ))}
              </ul>
              <Link href="/contracts" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Go to my contracts
              </Link>
            </Section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20" aria-label="Proposal and client information">
          <div className="space-y-3 rounded-xl border border-border bg-card p-5 card-glow">
            <div>
              <p className="font-heading text-xl font-semibold">{formatProjectBudget(project)}</p>
              <p className="text-sm text-muted-foreground">
                {pluralize(proposalCount, "proposal")} so far · {pluralize(project.durationWeeks, "week")}
              </p>
            </div>
            {proposalPanel}
          </div>

          {client && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading font-semibold">About the client</h2>
              <div className="flex items-center gap-3">
                <CompanyLogo company={client} size="md" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium">
                    <span className="truncate">{client.name}</span>
                    <VerifiedBadge verified={client.verified} />
                  </p>
                  <p className="text-xs text-muted-foreground">{client.industry}</p>
                </div>
              </div>
              {client.isDemo && <DemoOrgBadge />}
              <p className="line-clamp-4 text-sm text-pretty text-muted-foreground">{client.tagline}</p>
              <p className="text-xs text-muted-foreground">
                {client.location} · {client.size} people
              </p>
              <Link href={`/companies/${client.id}`} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                View company
              </Link>
            </div>
          )}
        </aside>
      </div>

      <SubmitProposalDialog
        project={project}
        candidateId={candidate?.id ?? ""}
        open={dialogOpen && Boolean(candidate)}
        onOpenChange={setDialogOpen}
      />

      <section aria-labelledby="similar-projects" className="space-y-4 pt-4">
        <h2 id="similar-projects" className="font-heading text-xl font-semibold">
          Similar projects
        </h2>
        {similar.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {similar.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="No other open projects" description="Check back soon, new freelance work is posted every week." />
        )}
      </section>
    </div>
  );
}
