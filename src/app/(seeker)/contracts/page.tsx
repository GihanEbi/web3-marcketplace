"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Award, Briefcase, CircleDollarSign, Clock, FileText, Handshake, Hourglass, Undo2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ContractCard } from "@/components/contracts/contract-card";
import { contractTotals } from "@/components/contracts/contract-utils";
import { formatProposalPrice } from "@/components/contracts/proposal-card";
import { StatusTabs } from "@/components/contracts/status-tabs";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { toUsd } from "@/components/wallet/token-rates";
import { formatCurrency, formatDate, formatNumber, formatRelative, pluralize } from "@/lib/format";
import { withdrawProposal } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useHydrated } from "@/store/hooks";
import type { Proposal } from "@/types";

type Tab = "contracts" | "proposals" | "bounties";

export default function SeekerContractsPage() {
  const hydrated = useHydrated();
  const candidate = useCurrentCandidate();
  const contracts = useAppStore((s) => s.contracts);
  const proposals = useAppStore((s) => s.proposals);
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const bounties = useAppStore((s) => s.bounties);
  const bountyInterests = useAppStore((s) => s.bountyInterests);

  const [tab, setTab] = useState<Tab>("contracts");
  const [withdrawing, setWithdrawing] = useState<Proposal | null>(null);

  const myContracts = useMemo(
    () =>
      candidate
        ? contracts.filter((c) => c.freelancerId === candidate.id).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
        : [],
    [contracts, candidate],
  );
  const myProposals = useMemo(
    () =>
      candidate
        ? proposals.filter((p) => p.freelancerId === candidate.id).sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
        : [],
    [proposals, candidate],
  );
  const myInterests = useMemo(
    () =>
      candidate
        ? bountyInterests.filter((b) => b.candidateId === candidate.id).sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
        : [],
    [bountyInterests, candidate],
  );

  const stats = useMemo(() => {
    let totalValue = 0;
    let released = 0;
    for (const c of myContracts) {
      totalValue += toUsd(c.totalAmount, c.token);
      released += toUsd(contractTotals(c).released, c.token);
    }
    return {
      active: myContracts.filter((c) => c.status === "active").length,
      totalValue,
      released,
      pendingProposals: myProposals.filter((p) => p.status === "pending").length,
    };
  }, [myContracts, myProposals]);

  async function handleWithdraw(proposal: Proposal) {
    try {
      await withdrawProposal(proposal.id);
      toast.success("Proposal withdrawn", { description: "The client will no longer see it as pending." });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not withdraw the proposal");
    }
  }

  const header = (
    <PageHeader
      title="Contracts & proposals"
      description="Track your freelance contracts, escrow milestones, proposals and DAO bounty interests."
      actions={
        <Link href="/projects" className={buttonVariants({ variant: "gradient" })}>
          Find projects
          <ArrowRight aria-hidden />
        </Link>
      }
    />
  );

  if (!hydrated) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingSkeleton variant="stats" count={4} />
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  const withdrawingProject = withdrawing ? projects.find((p) => p.id === withdrawing.projectId) : undefined;

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Active contracts" value={stats.active} icon={Handshake} accent="primary" />
        <StatsCard label="Total contract value" value={formatCurrency(stats.totalValue, "USD")} icon={Wallet} accent="info" hint="≈ USD, mock rates" />
        <StatsCard label="Released earnings" value={formatCurrency(stats.released, "USD")} icon={CircleDollarSign} accent="success" hint="Simulated payouts" />
        <StatsCard label="Pending proposals" value={stats.pendingProposals} icon={Hourglass} accent="warning" />
      </div>

      <StatusTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "contracts", label: "Contracts", count: myContracts.length },
          { value: "proposals", label: "My proposals", count: myProposals.length },
          { value: "bounties", label: "Bounty interests", count: myInterests.length },
        ]}
      />

      {tab === "contracts" &&
        (myContracts.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No contracts yet"
            description="Once a client accepts one of your proposals, the contract and its simulated escrow workspace appear here."
            action={
              <Link href="/projects" className={buttonVariants({ variant: "gradient" })}>
                Browse freelance projects
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {myContracts.map((contract) => (
              <ContractCard key={contract.id} contract={contract} viewer="seeker" />
            ))}
          </div>
        ))}

      {tab === "proposals" &&
        (myProposals.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="You have not sent any proposals"
            description="Find a project that matches your skills and pitch the client with your price and timeline."
            action={
              <Link href="/projects" className={buttonVariants({ variant: "gradient" })}>
                Browse freelance projects
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4">
            {myProposals.map((proposal) => {
              const project = projects.find((p) => p.id === proposal.projectId);
              const client = companies.find((c) => c.id === project?.clientCompanyId);
              const contract = contracts.find((c) => c.proposalId === proposal.id);
              return (
                <motion.li
                  key={proposal.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-3 rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-heading text-base font-semibold text-balance">
                        {project ? (
                          <Link href={`/projects/${project.id}`} className="hover:text-primary">
                            {project.title}
                          </Link>
                        ) : (
                          "Project no longer available"
                        )}
                      </h2>
                      {client && <p className="text-sm text-muted-foreground">{client.name}</p>}
                    </div>
                    <StatusBadge status={proposal.status} context="generic" />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-muted-foreground">{project?.budgetType === "hourly" ? "Your rate" : "Your price"}</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatProposalPrice(proposal.price, proposal.currency, project?.budgetType === "hourly")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Timeline</dt>
                      <dd className="flex items-center gap-1 font-medium">
                        <Clock className="size-3.5 text-muted-foreground" aria-hidden />
                        {pluralize(proposal.deliveryWeeks, "week")}
                      </dd>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <dt className="text-xs text-muted-foreground">Submitted</dt>
                      <dd className="font-medium">
                        {formatDate(proposal.submittedAt)} <span className="text-xs font-normal text-muted-foreground">· {formatRelative(proposal.submittedAt)}</span>
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                    {project && (
                      <Link href={`/projects/${project.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        View project
                      </Link>
                    )}
                    {proposal.status === "accepted" && contract && (
                      <Link href={`/contracts/${contract.id}`} className={buttonVariants({ variant: "gradient", size: "sm" })}>
                        Open contract
                      </Link>
                    )}
                    {proposal.status === "pending" && (
                      <Button variant="destructive" size="sm" onClick={() => setWithdrawing(proposal)}>
                        <Undo2 aria-hidden />
                        Withdraw
                      </Button>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        ))}

      {tab === "bounties" &&
        (myInterests.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No bounty interests yet"
            description="Express interest in a DAO bounty and track its status here. You can also browse paid freelance projects."
            action={
              <>
                <Link href="/bounties" className={buttonVariants({ variant: "gradient" })}>
                  Browse bounties
                </Link>
                <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
                  Browse projects
                </Link>
              </>
            }
          />
        ) : (
          <ul className="grid gap-4">
            {myInterests.map((interest) => {
              const bounty = bounties.find((b) => b.id === interest.bountyId);
              const dao = companies.find((c) => c.id === bounty?.daoId);
              return (
                <motion.li
                  key={interest.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-3 rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-heading text-base font-semibold text-balance">
                        {bounty ? (
                          <Link href={`/bounties/${bounty.id}`} className="hover:text-primary">
                            {bounty.title}
                          </Link>
                        ) : (
                          "Bounty no longer available"
                        )}
                      </h2>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Briefcase className="size-3.5" aria-hidden />
                        {dao?.name ?? "DAO"}
                        {bounty && (
                          <span>
                            {" "}
                            · Reward {formatNumber(bounty.rewardAmount)} {bounty.token}
                          </span>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={interest.status} />
                  </div>
                  {interest.note && <p className="line-clamp-2 text-sm text-pretty text-muted-foreground">&ldquo;{interest.note}&rdquo;</p>}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">Sent {formatRelative(interest.submittedAt)}</p>
                    {bounty && (
                      <Link href={`/bounties/${bounty.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        View bounty
                      </Link>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        ))}

      <ConfirmationDialog
        open={withdrawing !== null}
        onOpenChange={(o) => !o && setWithdrawing(null)}
        destructive
        title="Withdraw this proposal?"
        confirmLabel="Withdraw proposal"
        onConfirm={() => (withdrawing ? handleWithdraw(withdrawing) : undefined)}
        description={`The client will no longer be able to accept your proposal for "${withdrawingProject?.title ?? "this project"}". You can submit a new one while the project is open.`}
      />
    </div>
  );
}
