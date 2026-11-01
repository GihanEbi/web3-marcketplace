"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { makeId } from "@/store/app-store";
import type { Candidate, WorkExperience } from "@/types";
import { Field, formatMonth, ProfileSection, saveCandidate } from "./profile-ui";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

const schema = z
  .object({
    company: z.string().trim().min(2, "Company is required"),
    title: z.string().trim().min(2, "Job title is required"),
    location: z.string().trim().max(80, "Keep the location under 80 characters"),
    startDate: z.string().regex(MONTH, "Choose a start month"),
    current: z.boolean(),
    endDate: z.string(),
    description: z.string().trim().min(10, "Describe your impact in at least 10 characters").max(800, "Keep it under 800 characters"),
  })
  .superRefine((v, ctx) => {
    if (v.current) return;
    if (!MONTH.test(v.endDate)) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "Choose an end month, or tick “I currently work here”" });
    } else if (MONTH.test(v.startDate) && v.endDate < v.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be after the start date" });
    }
  });
type FormValues = z.infer<typeof schema>;

function ExperienceForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: WorkExperience;
  onCancel: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      company: initial?.company ?? "",
      title: initial?.title ?? "",
      location: initial?.location ?? "",
      startDate: initial?.startDate ?? "",
      current: initial ? initial.endDate === null : false,
      endDate: initial?.endDate ?? "",
      description: initial?.description ?? "",
    },
  });
  const current = useWatch({ control, name: "current" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="exp-company" label="Company" error={errors.company?.message}>
          <Input id="exp-company" aria-invalid={!!errors.company} {...register("company")} />
        </Field>
        <Field id="exp-title" label="Job title" error={errors.title?.message}>
          <Input id="exp-title" aria-invalid={!!errors.title} {...register("title")} />
        </Field>
        <Field id="exp-location" label="Location" error={errors.location?.message} className="sm:col-span-2">
          <Input id="exp-location" placeholder="City, Country or Remote" aria-invalid={!!errors.location} {...register("location")} />
        </Field>
        <Field id="exp-start" label="Start date" error={errors.startDate?.message}>
          <Input id="exp-start" type="month" aria-invalid={!!errors.startDate} {...register("startDate")} />
        </Field>
        <Field id="exp-end" label="End date" error={errors.endDate?.message}>
          <Input id="exp-end" type="month" disabled={current} aria-invalid={!!errors.endDate} {...register("endDate")} />
        </Field>
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 rounded border-input accent-primary" {...register("current")} />
        I currently work here
      </label>
      <Field id="exp-desc" label="What did you do and achieve?" error={errors.description?.message}>
        <Textarea id="exp-desc" rows={5} aria-invalid={!!errors.description} {...register("description")} />
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {initial ? "Save changes" : "Add experience"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProfileExperience({ candidate }: { candidate: Candidate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkExperience | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<WorkExperience | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const list = candidate.experience;

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function openEdit(item: WorkExperience) {
    setEditing(item);
    setDialogOpen(true);
  }

  async function submit(values: FormValues) {
    const entry: WorkExperience = {
      id: editing?.id ?? makeId("exp"),
      company: values.company,
      title: values.title,
      location: values.location,
      startDate: values.startDate,
      endDate: values.current ? null : values.endDate,
      description: values.description,
    };
    const next = editing ? list.map((e) => (e.id === editing.id ? entry : e)) : [entry, ...list];
    next.sort((a, b) => b.startDate.localeCompare(a.startDate));
    const ok = await saveCandidate(candidate.id, { experience: next }, editing ? "Experience updated" : "Experience added");
    if (ok) setDialogOpen(false);
  }

  return (
    <>
      <ProfileSection
        title="Work experience"
        description="Most recent first. Quantify your impact wherever you can."
        actions={
          <Button type="button" variant="gradient" onClick={openAdd}>
            <Plus aria-hidden />
            Add experience
          </Button>
        }
      >
        {list.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No work experience yet"
            description="Add your roles so employers can see your track record."
            action={
              <Button type="button" variant="gradient" onClick={openAdd}>
                <Plus aria-hidden />
                Add your first role
              </Button>
            }
          />
        ) : (
          <ol className="space-y-4">
            {list.map((item) => (
              <li key={item.id} className="relative rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading text-base font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.company}
                      {item.location && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden />
                          {item.location}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatMonth(item.startDate)} – {item.endDate ? formatMonth(item.endDate) : "Present"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${item.title} at ${item.company}`} onClick={() => openEdit(item)}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.title} at ${item.company}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setDeleteTarget(item);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
                {item.description && <p className="mt-3 text-sm text-pretty text-muted-foreground">{item.description}</p>}
              </li>
            ))}
          </ol>
        )}
      </ProfileSection>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit experience" : "Add work experience"}</DialogTitle>
            <DialogDescription>Tell employers where you have worked and what you accomplished.</DialogDescription>
          </DialogHeader>
          <ExperienceForm initial={editing} onCancel={() => setDialogOpen(false)} onSubmit={submit} />
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove this experience?"
        description={`${deleteTarget?.title ?? "This role"} at ${deleteTarget?.company ?? "this company"} will be removed from your profile.`}
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return;
          await saveCandidate(
            candidate.id,
            { experience: list.filter((e) => e.id !== deleteTarget.id) },
            "Experience removed",
          );
        }}
      />
    </>
  );
}
