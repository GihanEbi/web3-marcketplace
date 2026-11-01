"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, FolderKanban, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SelectField } from "@/components/shared/select-field";
import { StatsCard } from "@/components/shared/stats-card";
import { formatProjectBudget } from "@/components/shared/project-card";
import { ProposalCard } from "@/components/contracts/proposal-card";
import { StatusTabs } from "@/components/contracts/status-tabs";
import { createContract, rejectProposal, startConversation } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentCompany, useCurrentUser, useHydrated } from "@/store/hooks";
import type { Proposal, ProposalStatus } from "@/types";

type StatusTab = "all" | ProposalStatus;

const TAB_ORDER: ProposalStatus[] = ["pending", "accepted", "rejected", "withdrawn"];
const TAB_LABEL: Record<ProposalStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

type Confirm = { kind: "accept" | "reject"; proposal: Proposal } | null;

function ProposalsView() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const projects = useAppStore((s) => s.projects);
  const proposals = useAppStore((s) => s.proposals);
  const candidates = useAppStore((s) => s.candidates);
  const contracts = useAppStore((s) => s.contracts);

  const [tab, setTab] = useState<StatusTab>("pending");
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const projectParam = params.get("project");

  const myProjects = useMemo(
    () => (company ? projects.filter((p) => p.clientCompanyId === company.id) : []),
    [projects, company],
  );
  const myProposals = useMemo(() => {
    const ids = new Set(myProjects.map((p) => p.id));
    return proposals.filter((p) => ids.has(p.projectId));
  }, [proposals, myProjects]);

  const projectsWithProposals = useMemo(() => {
    const ids = new Set(myProposals.map((p) => p.projectId));
    return myProjects.filter((p) => ids.has(p.id));
  }, [myProjects, myProposals]);

  const selectedProjectId = projectParam && myProjects.some((p) => p.id === projectParam) ? projectParam : "all";

  const inScope = useMemo(
    () => (selectedProjectId === "all" ? myProposals : myProposals.filter((p) => p.projectId === selectedProjectId)),
    [myProposals, selectedProjectId],
  );

  const counts = useMemo(() => {
    const c: Record<ProposalStatus, number> = { pending: 0, accepted: 0, rejected: 0, withdrawn: 0 };
    for (const p of inScope) c[p.status] += 1;
    return c;
  }, [inScope]);

  const visible = useMemo(
    () =>
      inScope
        .filter((p) => tab === "all" || p.status === tab)
        .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt)),
    [inScope, tab],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Proposal[]>();
    for (const p of visible) map.set(p.projectId, [...(map.get(p.projectId) ?? []), p]);
    return [...map.entries()].map(([projectId, list]) => ({ project: myProjects.find((p) => p.id === projectId), list }));
  }, [visible, myProjects]);

  function setProjectFilter(projectId: string) {
    router.replace(projectId === "all" ? "/employer/proposals" : `/employer/proposals?project=${projectId}`);
  }

  async function handleAccept(proposal: Proposal) {
    try {
      const contract = await createContract(proposal.id);
      toast.success("Proposal accepted — escrow workspace created", {
        description: "Fund the first milestone to get the freelancer started (simulated escrow).",
        duration: 9000,
        action: { label: "Open contract", onClick: () => router.push(`/employer/contracts/${contract.id}`) },
      });
      setTab("accepted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept this proposal");
    }
  }

  async function handleReject(proposal: Proposal) {
    try {
      await rejectProposal(proposal.id);
      toast.success("Proposal rejected", { description: "The freelancer has been notified." });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reject this proposal");
    }
  }

  async function handleMessage(proposal: Proposal) {
    if (!user || !company) return;
    const project = myProjects.find((p) => p.id === proposal.projectId);
    setMessagingId(proposal.id);
    try {
      const conv = await startConversation({
        candidateId: proposal.freelancerId,
        companyId: company.id,
        employerUserId: user.id,
        subject: `Proposal: ${project?.title ?? "your project proposal"}`,
      });
      router.push(`/employer/messages?c=${conv.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the conversation");
      setMessagingId(null);
    }
  }

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="stats" count={3} />
        <LoadingSkeleton variant="list" count={3} />
      </div>
    );
  }

  if (myProjects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Post a freelance project and the proposals you receive will show up here."
        action={
          <Link href="/employer/projects/create" className={buttonVariants({ variant: "gradient" })}>
            Create a project
          </Link>
        }
      />
    );
  }

  const pendingOthers = confirm?.kind === "accept"
    ? myProposals.filter((p) => p.projectId === confirm.proposal.projectId && p.status === "pending" && p.id !== confirm.proposal.id).length
    : 0;
  const confirmFreelancer = confirm ? candidates.find((c) => c.id === confirm.proposal.freelancerId) : undefined;
  const confirmProject = confirm ? myProjects.find((p) => p.id === confirm.proposal.projectId) : undefined;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Pending review" value={counts.pending} icon={Hourglass} accent="warning" hint="Awaiting your decision" />
        <StatsCard label="Accepted" value={counts.accepted} icon={CheckCircle2} accent="success" hint="Contracts created" />
        <StatsCard label="Total received" value={inScope.length} icon={FileText} accent="primary" hint="Across selected projects" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <StatusTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "all", label: "All", count: inScope.length },
            ...TAB_ORDER.map((s) => ({ value: s, label: TAB_LABEL[s], count: counts[s] })),
          ]}
        />
        <div className="w-full lg:w-72">
          <label htmlFor="project-filter" className="sr-only">
            Filter by project
          </label>
          <SelectField
            id="project-filter"
            value={selectedProjectId}
            onChange={setProjectFilter}
            options={[
              { value: "all", label: "All projects" },
              ...projectsWithProposals.map((p) => ({ value: p.id, label: p.title })),
            ]}
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={tab === "all" ? "No proposals yet" : `No ${TAB_LABEL[tab].toLowerCase()} proposals`}
          description={
            tab === "pending"
              ? "You are all caught up. New proposals will appear here as freelancers respond to your open projects."
              : "Proposals matching this filter will appear here."
          }
          action={
            <Link href="/employer/projects" className={buttonVariants({ variant: "outline" })}>
              Manage projects
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map(({ project, list }) => (
            <section key={project?.id ?? list[0].projectId} aria-label={project?.title ?? "Project proposals"} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-heading text-lg font-semibold">
                  {project ? (
                    <Link href={`/projects/${project.id}`} className="hover:text-primary">
                      {project.title}
                    </Link>
                  ) : (
                    "Project"
                  )}
                </h2>
                {project && (
                  <p className="text-sm text-muted-foreground">
                    Budget {formatProjectBudget(project)} · {list.length} {list.length === 1 ? "proposal" : "proposals"}
                  </p>
                )}
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {list.map((proposal) => {
                  const contract = contracts.find((c) => c.proposalId === proposal.id);
                  return (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      project={project}
                      freelancer={candidates.find((c) => c.id === proposal.freelancerId)}
                      contractHref={contract ? `/employer/contracts/${contract.id}` : undefined}
                      acceptBlockedReason={
                        project && project.status !== "open"
                          ? `This project is ${project.status.replace("_", " ")}. Reopen it from your projects list to accept proposals.`
                          : null
                      }
                      busy={messagingId === proposal.id}
                      onAccept={() => setConfirm({ kind: "accept", proposal })}
                      onReject={() => setConfirm({ kind: "reject", proposal })}
                      onMessage={() => void handleMessage(proposal)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={confirm?.kind === "accept"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirmFreelancer ? `Accept ${confirmFreelancer.name}'s proposal?` : "Accept this proposal?"}
        confirmLabel="Accept & create contract"
        onConfirm={() => (confirm ? handleAccept(confirm.proposal) : undefined)}
        description={
          <>
            <span className="block">
              Accepting creates a contract for &quot;{confirmProject?.title}&quot; with a simulated smart-contract escrow workspace, moves the project to
              In progress{pendingOthers > 0 ? `, and rejects the other ${pendingOthers} pending ${pendingOthers === 1 ? "proposal" : "proposals"}` : ""}.
            </span>
            <span className="mt-2 block">No real funds move — escrow is a simulation and you fund each milestone yourself.</span>
          </>
        }
      />
      <ConfirmationDialog
        open={confirm?.kind === "reject"}
        onOpenChange={(o) => !o && setConfirm(null)}
        destructive
        title="Reject this proposal?"
        confirmLabel="Reject proposal"
        onConfirm={() => (confirm ? handleReject(confirm.proposal) : undefined)}
        description={`${confirmFreelancer?.name ?? "The freelancer"} will be notified that their proposal for "${confirmProject?.title ?? "this project"}" was not selected.`}
      />
    </div>
  );
}

export default function EmployerProposalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Proposals"
        description="Review freelancer proposals on your projects, compare price and timeline, and turn the best one into a contract."
      />
      <Suspense fallback={<LoadingSkeleton variant="list" count={3} />}>
        <ProposalsView />
      </Suspense>
    </div>
  );
}
