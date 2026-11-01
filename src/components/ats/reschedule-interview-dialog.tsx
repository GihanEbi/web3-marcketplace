"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { appNow } from "@/lib/clock";
import { formatDateTime } from "@/lib/format";
import { rescheduleInterview } from "@/services";
import { useCandidate } from "@/store/hooks";
import type { Interview } from "@/types";
import { Field, parseLocalDateTime, toDateInput, toTimeInput } from "./ats-utils";

const schema = z
  .object({
    date: z.string().min(1, "Pick a date"),
    time: z.string().min(1, "Pick a time"),
    notes: z.string().max(600, "Keep notes under 600 characters"),
  })
  .superRefine((value, ctx) => {
    const when = parseLocalDateTime(value.date, value.time);
    if (when && when.getTime() <= appNow().getTime()) {
      ctx.addIssue({ code: "custom", path: ["time"], message: "Choose a date and time in the future" });
    }
  });

type FormValues = z.infer<typeof schema>;

interface RescheduleInterviewDialogProps {
  interview: Interview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleInterviewDialog({ interview, open, onOpenChange }: RescheduleInterviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {interview && <RescheduleForm interview={interview} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RescheduleForm({ interview, onDone }: { interview: Interview; onDone: () => void }) {
  const candidate = useCandidate(interview.candidateId);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: toDateInput(interview.scheduledAt),
      time: toTimeInput(interview.scheduledAt),
      notes: interview.notes,
    },
  });

  async function onSubmit(values: FormValues) {
    const when = parseLocalDateTime(values.date, values.time);
    if (!when) return;
    try {
      const scheduledAt = when.toISOString();
      await rescheduleInterview(interview.id, scheduledAt, values.notes.trim());
      toast.success("Interview rescheduled", { description: formatDateTime(scheduledAt) });
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reschedule the interview");
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reschedule interview</DialogTitle>
        <DialogDescription>
          {candidate ? `${candidate.name} · ` : ""}
          currently {formatDateTime(interview.scheduledAt)}. The candidate is notified of the new time.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New date" htmlFor="ri-date" error={errors.date?.message}>
            <Input
              id="ri-date"
              type="date"
              min={format(appNow(), "yyyy-MM-dd")}
              aria-invalid={Boolean(errors.date)}
              {...register("date")}
            />
          </Field>
          <Field label="New time" htmlFor="ri-time" error={errors.time?.message}>
            <Input id="ri-time" type="time" aria-invalid={Boolean(errors.time)} {...register("time")} />
          </Field>
        </div>
        <Field label="Notes" htmlFor="ri-notes" error={errors.notes?.message} hint="Optional. Update the candidate on why the time changed.">
          <Textarea id="ri-notes" rows={3} aria-invalid={Boolean(errors.notes)} {...register("notes")} />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <CalendarClock aria-hidden />}
            {isSubmitting ? "Saving…" : "Reschedule"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
