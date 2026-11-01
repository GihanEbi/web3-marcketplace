"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HandHeart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber } from "@/lib/format";
import { submitBountyInterest } from "@/services";
import type { Bounty } from "@/types";

const schema = z.object({
  note: z.string().trim().min(20, "Share a little more — at least 20 characters"),
});
type FormValues = z.infer<typeof schema>;

interface BountyInterestDialogProps {
  bounty: Bounty;
  candidateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BountyInterestDialog({ bounty, candidateId, open, onOpenChange }: BountyInterestDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { note: "" } });
  const length = useWatch({ control, name: "note" })?.length ?? 0;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await submitBountyInterest(bounty.id, candidateId, values.note.trim());
      toast.success("Interest submitted", { description: "The DAO contributors will review your note." });
      reset({ note: "" });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't submit your interest");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!submitting ? onOpenChange(next) : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit your interest</DialogTitle>
          <DialogDescription>
            {bounty.title} · {formatNumber(bounty.rewardAmount)} {bounty.token} reward
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="bounty-note">Why are you a good fit?</Label>
            <Textarea
              id="bounty-note"
              rows={5}
              placeholder="Relevant experience, links to previous work and your planned approach…"
              aria-invalid={!!errors.note}
              {...register("note")}
            />
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-destructive">{errors.note?.message}</p>
              <p className="shrink-0 text-xs text-muted-foreground tabular-nums">{length} / 20 min</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <HandHeart aria-hidden />}
              Submit interest
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
