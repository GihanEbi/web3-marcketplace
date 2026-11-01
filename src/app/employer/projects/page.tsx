"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Banknote,
  CalendarClock,
  ExternalLink,
  FileText,
  FolderKanban,
  Hourglass,
  Layers,
  ListChecks,
  Loader2,
  Plus,
  Rocket,
  RotateCcw,
  XCircle,
  Handshake,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { formatProjectBudget } from "@/components/shared/project-card";
import { SkillTagList } from "@/components/shared/skill-tag";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusTabs } from "@/components/contracts/status-tabs";
import { formatDate, formatRelative, pluralize } from "@/lib/format";
import { setProjectStatus } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentCompany, useHydrated } from "@/store/hooks";
import type { FreelanceProject, ProjectStatus } from "@/types";

type Tab = "all" | ProjectStatus;

const TABS: { value: ProjectStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
];

interface ProjectRowProps {
  project: FreelanceProject;
  total: number;
  pending: number;
  busy: boolean;
  onPublish: () => void;
  onClose: () => void;
  onReopen: () => void;
}

function ProjectRow({ project, total, pending, busy, onPublish, onClose, onReopen }: ProjectRowProps) {
  const isDraft = project.status === "draft";
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-balance">
              {isDraft ? (
                project.title
              ) : (
                <Link href={`/projects/${project.id}`} className="rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60">
                  {project.title}
                </Link>
              )}
            </h2>
            <StatusBadge status={project.status} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground">Posted {formatRelative(project.postedAt)}</p>
        </div>
        <Link
          href={`/employer/proposals?project=${project.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm outline-none hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`${total} proposals for ${project.title}`}
        >
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          <span className="font-semibold tabular-nums">{total}</span>
          <span className="text-muted-foreground">{total === 1 ? "proposal" : "proposals"}</span>
          {pending > 0 && (
            <span className="rounded-full bg-warning/15 px-1.5 text-[11px] font-medium text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning">
              {pending} new
            </span>
          )}
        </Link>
      </div>

      <p className="line-clamp-2 text-sm text-pretty text-muted-foreground">{project.description || "No description yet."}</p>

      {project.skills.length > 0 && <SkillTagList skills={project.skills} max={6} />}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div className="flex items-center gap-1.5">
          <Banknote className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Budget</dt>
          <dd className="font-medium">{formatProjectBudget(project)}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Duration</dt>
          <dd>{pluralize(project.durationWeeks, "week")}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ListChecks className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Milestones</dt>
          <dd>{pluralize(project.milestones.length, "milestone")}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Layers className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Blockchain</dt>
          <dd>
            {project.blockchain} · {project.currency}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {project.status === "open" ? `Proposals close ${formatDate(project.deadline)}` : `Deadline ${formatDate(project.deadline)}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {!isDraft && (
            <Link href={`/projects/${project.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ExternalLink aria-hidden />
              View public page
            </Link>
          )}
          {project.status === "in_progress" && (
            <Link href="/employer/contracts" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Handshake aria-hidden />
              Contracts
            </Link>
          )}
          {isDraft && (
            <Button variant="gradient" size="sm" onClick={onPublish} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />}
              Publish
            </Button>
          )}
          {project.status === "open" && (
            <Button variant="destructive" size="sm" onClick={onClose} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <XCircle aria-hidden />}
              Close
            </Button>
          )}
          {project.status === "closed" && (
            <Button variant="outline" size="sm" onClick={onReopen} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
              Reopen
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function EmployerProjectsPage() {
  const hydrated = useHydrated();
  const company = useCurrentCompany();
  const projects = useAppStore((s) => s.projects);
  const proposals = useAppStore((s) => s.proposals);

  const [tab, setTab] = useState<Tab>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [closing, setClosing] = useState<FreelanceProject | null>(null);

  const mine = useMemo(
    () =>
      company
        ? projects.filter((p) => p.clientCompanyId === company.id).sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))
        : [],
    [projects, company],
  );

  const counts = useMemo(() => {
    const map = new Map<string, { total: number; pending: number }>();
    for (const p of proposals) {
      if (p.status === "withdrawn") continue;
      const entry = map.get(p.projectId) ?? { total: 0, pending: 0 };
      entry.total += 1;
      if (p.status === "pending") entry.pending += 1;
      map.set(p.projectId, entry);
    }
    return map;
  }, [proposals]);

  const tabCounts = useMemo(() => {
    const c: Record<ProjectStatus, number> = { draft: 0, open: 0, in_progress: 0, completed: 0, closed: 0 };
    for (const p of mine) c[p.status] += 1;
    return c;
  }, [mine]);

  const visible = useMemo(() => (tab === "all" ? mine : mine.filter((p) => p.status === tab)), [mine, tab]);

  const awaitingReview = useMemo(
    () => mine.reduce((sum, p) => sum + (counts.get(p.id)?.pending ?? 0), 0),
    [mine, counts],
  );

  async function changeStatus(project: FreelanceProject, status: ProjectStatus, successTitle: string, successBody: string) {
    setBusyId(project.id);
    try {
      await setProjectStatus(project.id, status);
      toast.success(successTitle, { description: successBody });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the project");
    } finally {
      setBusyId(null);
    }
  }

  function publish(project: FreelanceProject) {
    if (project.description.trim().length < 20 || project.skills.length === 0 || project.budgetMax <= 0) {
      toast.error("This draft is incomplete", {
        description: "Add a description, at least one skill and a budget before publishing. Create a new project to start from a full form.",
      });
      return;
    }
    void changeStatus(project, "open", "Project published", `"${project.title}" is now live on the public projects board.`);
  }

  const header = (
    <PageHeader
      title="Freelance projects"
      description="Post projects, review proposals and track every engagement from draft to completion."
      actions={
        <Link href="/employer/projects/create" className={buttonVariants({ variant: "gradient" })}>
          <Plus aria-hidden />
          Create project
        </Link>
      }
    />
  );

  if (!hydrated) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingSkeleton variant="stats" count={3} />
        <LoadingSkeleton variant="list" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Open for proposals" value={tabCounts.open} icon={FolderKanban} accent="info" href="#projects" />
        <StatsCard label="In progress" value={tabCounts.in_progress} icon={Handshake} accent="success" hint="Active contracts" />
        <StatsCard label="Proposals to review" value={awaitingReview} icon={Hourglass} accent="warning" href="/employer/proposals" />
      </div>

      <div id="projects" className="scroll-mt-24 space-y-4">
        <StatusTabs
          value={tab}
          onChange={setTab}
          tabs={[{ value: "all", label: "All", count: mine.length }, ...TABS.map((t) => ({ ...t, count: tabCounts[t.value] }))]}
        />

        {mine.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="You have not posted any projects"
            description="Describe the work, set milestones and publish it to the freelance board. Proposals will land in your inbox."
            action={
              <Link href="/employer/projects/create" className={buttonVariants({ variant: "gradient" })}>
                <Plus aria-hidden />
                Create your first project
              </Link>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={`No ${TABS.find((t) => t.value === tab)?.label.toLowerCase() ?? ""} projects`}
            description="Projects with this status will appear here."
            action={
              <Button variant="outline" onClick={() => setTab("all")}>
                Show all projects
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {visible.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                total={counts.get(project.id)?.total ?? 0}
                pending={counts.get(project.id)?.pending ?? 0}
                busy={busyId === project.id}
                onPublish={() => publish(project)}
                onClose={() => setClosing(project)}
                onReopen={() =>
                  void changeStatus(project, "open", "Project reopened", `"${project.title}" is accepting proposals again.`)
                }
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={closing !== null}
        onOpenChange={(o) => !o && setClosing(null)}
        destructive
        title="Close this project?"
        confirmLabel="Close project"
        onConfirm={() =>
          closing
            ? changeStatus(closing, "closed", "Project closed", `"${closing.title}" no longer accepts proposals. You can reopen it any time.`)
            : undefined
        }
        description={`"${closing?.title ?? "This project"}" will disappear from the public board and stop accepting proposals. Existing proposals are kept.`}
      />
    </div>
  );
}
