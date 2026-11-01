"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { Loader2, CalendarPlus } from "lucide-react";
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
import { SelectField } from "@/components/shared/select-field";
import { appNow } from "@/lib/clock";
import { ATS_STAGE_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { scheduleInterview } from "@/services";
import { useCurrentCompany, useCurrentUser } from "@/store/hooks";
import type { InterviewType } from "@/types";
import {
  DURATION_OPTIONS,
  Field,
  INTERVIEW_TYPES,
  SCHEDULABLE_STATUSES,
  parseLocalDateTime,
  slugify,
  useApplicantRows,
  useCompanyApplications,
} from "./ats-utils";

const schema = z
  .object({
    applicationId: z.string().min(1, "Choose an application"),
    type: z.enum(INTERVIEW_TYPES),
    date: z.string().min(1, "Pick a date"),
    time: z.string().min(1, "Pick a time"),
    durationMin: z.string().min(1),
    meetingLink: z.url("Enter a valid link, e.g. https://meet.example.com/room"),
    interviewerName: z.string().trim().min(2, "Enter the interviewer's name"),
    notes: z.string().max(600, "Keep notes under 600 characters"),
  })
  .superRefine((value, ctx) => {
    const when = parseLocalDateTime(value.date, value.time);
    if (!when) return;
    if (when.getTime() <= appNow().getTime()) {
      ctx.addIssue({ code: "custom", path: ["time"], message: "Choose a date and time in the future" });
    }
  });

type FormValues = z.infer<typeof schema>;

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselect an application (it is always offered, whatever its status) */
  applicationId?: string | null;
}

export function ScheduleInterviewDialog({ open, onOpenChange, applicationId }: ScheduleInterviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Schedule interview</DialogTitle>
          <DialogDescription>
            The candidate is notified instantly and the application moves to the Interview stage.
          </DialogDescription>
        </DialogHeader>
        <ScheduleForm applicationId={applicationId ?? null} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ScheduleForm({ applicationId, onDone }: { applicationId: string | null; onDone: () => void }) {
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const applications = useCompanyApplications();
  const rows = useApplicantRows(applications);

  const options = useMemo(
    () =>
      rows
        .filter((r) => r.application.id === applicationId || SCHEDULABLE_STATUSES.includes(r.application.status))
        .map((r) => ({
          value: r.application.id,
          label: `${r.candidate.name} · ${r.job?.title ?? "Role"} (${ATS_STAGE_LABEL[r.application.status as keyof typeof ATS_STAGE_LABEL] ?? "Withdrawn"})`,
        })),
    [rows, applicationId],
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      applicationId: applicationId ?? "",
      type: "Technical",
      date: format(addDays(appNow(), 1), "yyyy-MM-dd"),
      time: "10:00",
      durationMin: "60",
      meetingLink: "",
      interviewerName: user?.name ?? "",
      notes: "",
    },
  });

  const watchedApp = useWatch({ control, name: "applicationId" });
  const watchedType = useWatch({ control, name: "type" });
  const meetingDirty = Boolean(dirtyFields.meetingLink);

  // Prefill a mock meeting link until the user types their own.
  useEffect(() => {
    if (meetingDirty) return;
    const row = rows.find((r) => r.application.id === watchedApp);
    const parts = [company?.name ?? "chainhire", row?.candidate.name.split(" ")[0] ?? "", watchedType];
    setValue("meetingLink", `https://meet.example.com/${slugify(parts.join(" "))}`, { shouldDirty: false });
  }, [watchedApp, watchedType, rows, company, meetingDirty, setValue]);

  async function onSubmit(values: FormValues) {
    const when = parseLocalDateTime(values.date, values.time);
    if (!when) return;
    const row = rows.find((r) => r.application.id === values.applicationId);
    try {
      const scheduledAt = when.toISOString();
      await scheduleInterview({
        applicationId: values.applicationId,
        type: values.type as InterviewType,
        scheduledAt,
        durationMin: Number(values.durationMin),
        meetingLink: values.meetingLink,
        notes: values.notes.trim(),
        interviewerName: values.interviewerName.trim(),
      });
      toast.success(`Interview scheduled${row ? ` with ${row.candidate.name}` : ""}`, {
        description: formatDateTime(scheduledAt),
      });
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule the interview");
    }
  }

  const today = format(appNow(), "yyyy-MM-dd");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <Field label="Application" htmlFor="si-application" error={errors.applicationId?.message}>
        <Controller
          control={control}
          name="applicationId"
          render={({ field }) => (
            <SelectField
              id="si-application"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={options}
              placeholder="Select a candidate…"
              aria-invalid={Boolean(errors.applicationId)}
            />
          )}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Interview type" htmlFor="si-type">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SelectField
                id="si-type"
                value={field.value}
                onChange={field.onChange}
                options={INTERVIEW_TYPES.map((t) => ({ value: t, label: t }))}
              />
            )}
          />
        </Field>
        <Field label="Duration" htmlFor="si-duration">
          <Controller
            control={control}
            name="durationMin"
            render={({ field }) => (
              <SelectField id="si-duration" value={field.value} onChange={field.onChange} options={DURATION_OPTIONS} />
            )}
          />
        </Field>
        <Field label="Date" htmlFor="si-date" error={errors.date?.message}>
          <Input id="si-date" type="date" min={today} aria-invalid={Boolean(errors.date)} {...register("date")} />
        </Field>
        <Field label="Time" htmlFor="si-time" error={errors.time?.message}>
          <Input id="si-time" type="time" aria-invalid={Boolean(errors.time)} {...register("time")} />
        </Field>
      </div>

      <Field label="Meeting link" htmlFor="si-link" error={errors.meetingLink?.message}>
        <Input
          id="si-link"
          type="url"
          inputMode="url"
          placeholder="https://meet.example.com/room"
          aria-invalid={Boolean(errors.meetingLink)}
          {...register("meetingLink")}
        />
      </Field>

      <Field label="Interviewer" htmlFor="si-interviewer" error={errors.interviewerName?.message}>
        <Input id="si-interviewer" aria-invalid={Boolean(errors.interviewerName)} {...register("interviewerName")} />
      </Field>

      <Field
        label="Notes for the candidate"
        htmlFor="si-notes"
        error={errors.notes?.message}
        hint="Optional. Shown to the candidate with the invitation."
      >
        <Textarea
          id="si-notes"
          rows={3}
          placeholder="What to prepare, who they will meet…"
          aria-invalid={Boolean(errors.notes)}
          {...register("notes")}
        />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <CalendarPlus aria-hidden />}
          {isSubmitting ? "Scheduling…" : "Schedule interview"}
        </Button>
      </DialogFooter>
    </form>
  );
}
