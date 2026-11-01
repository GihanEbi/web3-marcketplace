"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, CircleCheck, FileUp, Hourglass, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { formatNumber } from "@/lib/format";
import { approveMilestone, fundEscrow, releasePayment, submitMilestone } from "@/services";
import { useAppStore } from "@/store/app-store";
import type { Contract, Milestone } from "@/types";

type Viewer = "seeker" | "employer";
type Kind = "fund" | "approve" | "release" | "submit";

const NO_FUNDS = "No real funds move — this is a simulation.";

/** Shows how funding changes the demo wallet balance (never blocks). */
export function FundImpact({ amount, token }: { amount: number; token: string }) {
  const wallet = useAppStore((s) => s.wallet);

  if (!wallet.connected) {
    return (
      <span className="mt-3 block rounded-lg border border-dashed border-border px-3 py-2 text-xs">
        Tip: connect a demo wallet from the top bar to see how its balance changes. You can continue without one.
      </span>
    );
  }
  const balance = wallet.balances[token];
  if (balance === undefined) {
    return (
      <span className="mt-3 block rounded-lg border border-dashed border-border px-3 py-2 text-xs">
        Your demo wallet holds no {token}, so its balances will not change.
      </span>
    );
  }
  const after = Math.max(0, balance - amount);
  return (
    <span className="mt-3 block rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
      <span className="block font-medium text-foreground">Demo wallet balance impact ({token})</span>
      <span className="mt-0.5 block tabular-nums">
        {formatNumber(balance, 2)} → {formatNumber(after, 2)} {token}
        {balance < amount && <span className="text-warning"> · below the amount, simulation continues anyway</span>}
      </span>
    </span>
  );
}

function Waiting({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Hourglass className="size-3.5" aria-hidden />
      {children}
    </span>
  );
}

function Done({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
      <BadgeCheck className="size-3.5" aria-hidden />
      {children}
    </span>
  );
}

function Guarded({ reason, children }: { reason: string | null; children: ReactNode }) {
  if (!reason) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}

const submitSchema = z.object({
  note: z
    .string()
    .trim()
    .min(10, "Describe what you delivered (at least 10 characters)")
    .max(600, "Keep the note under 600 characters"),
  link: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\/\S+\.\S+/.test(v), "Enter a valid link starting with http:// or https://"),
});
type SubmitValues = z.infer<typeof submitSchema>;

function SubmitMilestoneDialog({
  open,
  onOpenChange,
  contract,
  milestone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  milestone: Milestone;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitValues>({ resolver: zodResolver(submitSchema), defaultValues: { note: "", link: "" } });

  async function onSubmit(values: SubmitValues) {
    setSubmitting(true);
    try {
      const note = values.link ? `${values.note} Link: ${values.link}` : values.note;
      await submitMilestone(contract.id, milestone.id, note);
      toast.success("Milestone submitted (simulated)", {
        description: `"${milestone.title}" is now waiting for client approval. No on-chain activity.`,
      });
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit milestone");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (submitting ? undefined : onOpenChange(next))}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>Submit milestone</DialogTitle>
            <DialogDescription>
              Send &quot;{milestone.title}&quot; to the client for review. {NO_FUNDS} The client can then approve it and release{" "}
              {formatNumber(milestone.amount, 2)} {contract.token} from the simulated escrow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor={`note-${milestone.id}`}>Work note</Label>
            <Textarea
              id={`note-${milestone.id}`}
              rows={4}
              placeholder="Summarise what you delivered, how to verify it, and anything the client should check."
              aria-invalid={Boolean(errors.note)}
              {...register("note")}
            />
            {errors.note && <p className="text-xs text-destructive">{errors.note.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`link-${milestone.id}`}>
              Deliverable link <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={`link-${milestone.id}`}
              type="url"
              inputMode="url"
              placeholder="https://github.com/your-org/repo/pull/42"
              aria-invalid={Boolean(errors.link)}
              {...register("link")}
            />
            {errors.link && <p className="text-xs text-destructive">{errors.link.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <FileUp aria-hidden />}
              Submit milestone (simulated)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EscrowActionsProps {
  contract: Contract;
  milestone: Milestone;
  viewer: Viewer;
  /** set while a bulk action (e.g. fund all) is running */
  locked?: boolean;
}

/** Per-milestone simulated escrow actions for either side of a contract. */
export function EscrowActions({ contract, milestone, viewer, locked = false }: EscrowActionsProps) {
  const [dialog, setDialog] = useState<Kind | null>(null);
  const amount = `${formatNumber(milestone.amount, 2)} ${contract.token}`;

  const reason: string | null =
    contract.status === "cancelled"
      ? "This contract was cancelled, so no further actions are available."
      : locked
        ? "A bulk action is running — please wait a moment."
        : null;

  async function run(kind: Kind) {
    try {
      if (kind === "fund") {
        await fundEscrow(contract.id, milestone.id);
        toast.success("Escrow funded (simulated)", {
          description: `${amount} locked in the simulated escrow for "${milestone.title}". No real funds moved.`,
        });
      } else if (kind === "approve") {
        await approveMilestone(contract.id, milestone.id);
        toast.success("Milestone approved (simulated)", {
          description: `"${milestone.title}" approved. You can now release ${amount}.`,
        });
      } else if (kind === "release") {
        await releasePayment(contract.id, milestone.id);
        toast.success("Payment released (simulated)", {
          description: `${amount} released from escrow to the freelancer. No real funds moved.`,
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }

  if (milestone.status === "released") {
    return <Done>{viewer === "employer" ? "Paid" : "Payment received"}</Done>;
  }

  if (viewer === "employer") {
    return (
      <>
        {milestone.status === "pending" && (
          <Guarded reason={reason}>
            <Button size="sm" variant="gradient" disabled={reason !== null} onClick={() => setDialog("fund")}>
              <ShieldCheck aria-hidden />
              Fund escrow
            </Button>
          </Guarded>
        )}
        {milestone.status === "funded" && <Waiting>Escrow funded — waiting for freelancer to submit work</Waiting>}
        {milestone.status === "submitted" && (
          <Guarded reason={reason}>
            <Button size="sm" variant="gradient" disabled={reason !== null} onClick={() => setDialog("approve")}>
              <CircleCheck aria-hidden />
              Approve milestone
            </Button>
          </Guarded>
        )}
        {milestone.status === "approved" && (
          <Guarded reason={reason}>
            <Button size="sm" variant="gradient" disabled={reason !== null} onClick={() => setDialog("release")}>
              <Send aria-hidden />
              Release payment
            </Button>
          </Guarded>
        )}

        <ConfirmationDialog
          open={dialog === "fund"}
          onOpenChange={(o) => !o && setDialog(null)}
          title="Fund this milestone?"
          confirmLabel="Fund escrow (simulated)"
          onConfirm={() => run("fund")}
          description={
            <>
              <span className="block">
                {amount} will be deposited into the simulated smart-contract escrow for &quot;{milestone.title}&quot; on{" "}
                {contract.network}. {NO_FUNDS}
              </span>
              <FundImpact amount={milestone.amount} token={contract.token} />
            </>
          }
        />
        <ConfirmationDialog
          open={dialog === "approve"}
          onOpenChange={(o) => !o && setDialog(null)}
          title="Approve this milestone?"
          confirmLabel="Approve (simulated)"
          onConfirm={() => run("approve")}
          description={`You confirm "${milestone.title}" meets the agreed scope. The freelancer is notified and you can release ${amount} next. ${NO_FUNDS}`}
        />
        <ConfirmationDialog
          open={dialog === "release"}
          onOpenChange={(o) => !o && setDialog(null)}
          title="Release payment?"
          confirmLabel="Release payment (simulated)"
          onConfirm={() => run("release")}
          description={`${amount} will be released from the simulated escrow to the freelancer's address and the milestone is marked as paid. ${NO_FUNDS}`}
        />
      </>
    );
  }

  return (
    <>
      {milestone.status === "pending" && <Waiting>Waiting for client to fund escrow</Waiting>}
      {milestone.status === "funded" && (
        <Guarded reason={reason}>
          <Button size="sm" variant="gradient" disabled={reason !== null} onClick={() => setDialog("submit")}>
            <FileUp aria-hidden />
            Submit milestone
          </Button>
        </Guarded>
      )}
      {milestone.status === "submitted" && <Waiting>Submitted — waiting for client approval</Waiting>}
      {milestone.status === "approved" && <Waiting>Approved — waiting for client to release payment</Waiting>}

      <SubmitMilestoneDialog
        open={dialog === "submit"}
        onOpenChange={(o) => !o && setDialog(null)}
        contract={contract}
        milestone={milestone}
      />
    </>
  );
}
