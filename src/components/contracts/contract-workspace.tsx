"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ExternalLink, FlaskConical, Loader2, MessageSquare, PartyPopper, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/shared/company-logo";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { NotFoundState } from "@/components/shared/empty-state";
import { EscrowSummaryCard, SimulatedBadge } from "@/components/shared/escrow-summary-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { GradientProgress, MilestoneTracker } from "@/components/shared/milestone-tracker";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { daysUntil, formatDate, formatNumber } from "@/lib/format";
import { fundEscrow, startConversation } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCandidate, useCompany, useCurrentCandidate, useCurrentCompany, useCurrentUser, useHydrated } from "@/store/hooks";
import type { Milestone } from "@/types";
import { ContractPaymentSummary } from "./contract-payment-summary";
import { contractTotals, finalDueDate, nextMilestone } from "./contract-utils";
import { EscrowActions, FundImpact } from "./escrow-actions";
import { TransactionHistory } from "./transaction-history";

interface ContractWorkspaceProps {
  contractId: string;
  viewer: "seeker" | "employer";
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-heading text-base font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Shared contract workspace – milestones, simulated escrow actions, payments and history. */
export function ContractWorkspace({ contractId, viewer }: ContractWorkspaceProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const candidate = useCurrentCandidate();
  const myCompany = useCurrentCompany();
  const contracts = useAppStore((s) => s.contracts);
  const transactions = useAppStore((s) => s.transactions);
  const users = useAppStore((s) => s.users);

  const contract = useMemo(() => contracts.find((c) => c.id === contractId), [contracts, contractId]);
  const client = useCompany(contract?.clientCompanyId);
  const freelancer = useCandidate(contract?.freelancerId);
  const contractTxs = useMemo(() => transactions.filter((t) => t.contractId === contractId), [transactions, contractId]);

  const [fundAllOpen, setFundAllOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [messaging, setMessaging] = useState(false);

  const backHref = viewer === "seeker" ? "/contracts" : "/employer/contracts";

  if (!hydrated) return <LoadingSkeleton variant="detail" />;

  const owned =
    contract !== undefined &&
    (viewer === "seeker" ? candidate?.id === contract.freelancerId : myCompany?.id === contract.clientCompanyId);

  if (!contract || !owned) {
    return <NotFoundState entity="contract" backHref={backHref} backLabel="Back to contracts" />;
  }

  const totals = contractTotals(contract);
  const next = nextMilestone(contract);
  const finalDue = finalDueDate(contract);
  const pendingMilestones: Milestone[] = contract.milestones.filter((m) => m.status === "pending");
  const pendingTotal = pendingMilestones.reduce((sum, m) => sum + m.amount, 0);
  const completed = contract.status === "completed";
  const canFundAll = viewer === "employer" && contract.status === "active" && pendingMilestones.length > 1;

  async function fundAll() {
    if (!contract) return;
    setBulkBusy(true);
    let done = 0;
    try {
      for (const m of pendingMilestones) {
        await fundEscrow(contract.id, m.id);
        done += 1;
      }
      toast.success(`${done} milestones funded (simulated)`, {
        description: `${formatNumber(pendingTotal, 2)} ${contract.token} locked in the simulated escrow. No real funds moved.`,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not fund all milestones", {
        description: done > 0 ? `${done} milestone(s) were funded before the error.` : undefined,
      });
    } finally {
      setBulkBusy(false);
    }
  }

  async function messageOtherParty() {
    if (!contract || !client || !freelancer) return;
    setMessaging(true);
    try {
      if (viewer === "employer") {
        if (!user) throw new Error("You need to be signed in to send messages");
        const conv = await startConversation({
          candidateId: freelancer.id,
          companyId: client.id,
          employerUserId: user.id,
          subject: `Contract: ${contract.title}`,
        });
        router.push(`/employer/messages?c=${conv.id}`);
      } else {
        const employerUser = users.find((u) => u.role === "employer" && u.companyId === client.id);
        if (!employerUser) throw new Error(`${client.name} has no contact available for messaging in this demo`);
        const conv = await startConversation({
          candidateId: freelancer.id,
          companyId: client.id,
          employerUserId: employerUser.id,
          subject: `Contract: ${contract.title}`,
        });
        router.push(`/messages?c=${conv.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the conversation");
      setMessaging(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        aria-label="Contract overview"
        className="relative overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 size-64 rounded-full bg-linear-to-br from-indigo-500/15 to-violet-500/10 blur-3xl"
        />
        <div className="relative space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={contract.status} context="generic" />
                <SimulatedBadge />
              </div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                <Link
                  href={`/projects/${contract.projectId}`}
                  className="inline-flex items-start gap-2 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  {contract.title}
                  <ExternalLink className="mt-2 size-4 shrink-0 text-muted-foreground" aria-label="Opens the public project page" />
                </Link>
              </h1>
            </div>
            <Button variant="outline" onClick={messageOtherParty} disabled={messaging || !client || !freelancer}>
              {messaging ? <Loader2 className="animate-spin" aria-hidden /> : <MessageSquare aria-hidden />}
              {viewer === "employer" ? "Message freelancer" : "Message client"}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              {client && <CompanyLogo company={client} size="md" />}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Client</p>
                {client ? (
                  <Link href={`/companies/${client.id}`} className="block truncate text-sm font-semibold hover:text-primary">
                    {client.name}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold">Unknown client</p>
                )}
                {client && <p className="truncate text-xs text-muted-foreground">{client.industry}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              {freelancer && <UserAvatar name={freelancer.name} src={freelancer.avatar} size="md" />}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Freelancer</p>
                <p className="truncate text-sm font-semibold">{freelancer?.name ?? "Unknown freelancer"}</p>
                {freelancer && <p className="truncate text-xs text-muted-foreground">{freelancer.headline}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Contract amount" value={`${formatNumber(contract.totalAmount, 2)} ${contract.token}`} sub={`on ${contract.network}`} />
            <Stat label="Started" value={formatDate(contract.startedAt)} />
            <Stat
              label="Delivery date"
              value={formatDate(finalDue)}
              sub={completed ? "Delivered" : finalDue ? (daysUntil(finalDue) < 0 ? "Past due" : `in ${daysUntil(finalDue)} days`) : undefined}
            />
            <Stat
              label="Next milestone"
              value={next ? formatDate(next.dueDate) : "All released"}
              sub={next?.title}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="font-medium">Project progress</span>
              <span className="text-muted-foreground tabular-nums">
                {totals.releasedCount} of {totals.milestoneCount} milestones released · {Math.round(totals.progress)}%
              </span>
            </div>
            <GradientProgress value={totals.progress} label="Project progress" />
          </div>
        </div>
      </motion.section>

      {completed && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-success"
        >
          <PartyPopper className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-heading text-sm font-semibold">Contract completed</p>
            <p className="text-sm text-pretty opacity-90">
              All {totals.milestoneCount} milestones were approved and released — {formatNumber(totals.released, 2)} {contract.token} paid out through
              the simulated escrow. No real funds were moved.
            </p>
          </div>
        </div>
      )}

      <div
        role="note"
        className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200"
      >
        <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <strong className="font-semibold">Simulated escrow.</strong> Every action here updates demo data only — no wallet signing, no smart contract, no
          blockchain network and no real money.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-label="Milestones" className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">Milestones</h2>
            {canFundAll && (
              <Button variant="outline" size="sm" onClick={() => setFundAllOpen(true)} disabled={bulkBusy}>
                {bulkBusy ? <Loader2 className="animate-spin" aria-hidden /> : <ShieldCheck aria-hidden />}
                Fund all remaining ({pendingMilestones.length})
              </Button>
            )}
          </div>
          <MilestoneTracker
            milestones={contract.milestones}
            token={contract.token}
            renderActions={(milestone) => (
              <EscrowActions contract={contract} milestone={milestone} viewer={viewer} locked={bulkBusy} />
            )}
          />
        </section>

        <aside className="min-w-0 space-y-6">
          <EscrowSummaryCard contract={contract} />
          <ContractPaymentSummary contract={contract} />
          <section aria-label="Transaction history" className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-base font-semibold">Transaction history</h3>
              <SimulatedBadge />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Select a row to view the mock transaction.</p>
            <TransactionHistory transactions={contractTxs} className="mt-2" />
          </section>
        </aside>
      </div>

      <ConfirmationDialog
        open={fundAllOpen}
        onOpenChange={setFundAllOpen}
        title={`Fund ${pendingMilestones.length} remaining milestones?`}
        confirmLabel="Fund all (simulated)"
        onConfirm={fundAll}
        description={
          <>
            <span className="block">
              {formatNumber(pendingTotal, 2)} {contract.token} will be deposited into the simulated escrow, one milestone at a time. No real funds
              move — this is a simulation.
            </span>
            <FundImpact amount={pendingTotal} token={contract.token} />
          </>
        }
      />
    </div>
  );
}
