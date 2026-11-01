"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatProjectBudget } from "@/components/shared/project-card";
import { submitProposal } from "@/services";
import type { FreelanceProject } from "@/types";

const schema = z.object({
  price: z
    .number({ error: "Enter your proposed price" })
    .positive("Price must be greater than 0")
    .max(10_000_000, "That looks too high"),
  deliveryWeeks: z
    .number({ error: "Enter the delivery time in weeks" })
    .int("Use whole weeks")
    .min(1, "At least 1 week")
    .max(104, "Maximum 104 weeks"),
  coverLetter: z.string().trim().min(50, "Tell the client a bit more — at least 50 characters"),
});
type FormValues = z.infer<typeof schema>;

interface SubmitProposalDialogProps {
  project: FreelanceProject;
  candidateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmitProposalDialog({ project, candidateId, open, onOpenChange }: SubmitProposalDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { coverLetter: "" },
  });
  const letterLength = useWatch({ control, name: "coverLetter" })?.length ?? 0;
  const unit = project.budgetType === "hourly" ? `${project.currency} / hr` : project.currency;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await submitProposal({
        projectId: project.id,
        freelancerId: candidateId,
        price: values.price,
        currency: project.currency,
        deliveryWeeks: values.deliveryWeeks,
        coverLetter: values.coverLetter.trim(),
      });
      toast.success("Proposal submitted", { description: `${project.title} — the client has been notified.` });
      reset({ coverLetter: "" });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't submit your proposal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!submitting ? onOpenChange(next) : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a proposal</DialogTitle>
          <DialogDescription>
            {project.title} · client budget {formatProjectBudget(project)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="proposal-price">Proposed price ({unit})</Label>
              <Input
                id="proposal-price"
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                placeholder={String(project.budgetMin)}
                aria-invalid={!!errors.price}
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proposal-weeks">Delivery time (weeks)</Label>
              <Input
                id="proposal-weeks"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder={String(project.durationWeeks)}
                aria-invalid={!!errors.deliveryWeeks}
                {...register("deliveryWeeks", { valueAsNumber: true })}
              />
              {errors.deliveryWeeks && <p className="text-xs text-destructive">{errors.deliveryWeeks.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proposal-letter">Cover letter</Label>
            <Textarea
              id="proposal-letter"
              rows={6}
              placeholder="Introduce yourself, relevant experience and how you would approach this project…"
              aria-invalid={!!errors.coverLetter}
              {...register("coverLetter")}
            />
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-destructive">{errors.coverLetter?.message}</p>
              <p className="shrink-0 text-xs text-muted-foreground tabular-nums">{letterLength} / 50 min</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              Submit proposal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
