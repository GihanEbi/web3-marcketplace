"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Award, GraduationCap, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { makeId } from "@/store/app-store";
import type { Candidate, Certification, Education } from "@/types";
import { Field, ProfileSection, saveCandidate } from "./profile-ui";

const THIS_YEAR_MAX = 2100;
const year = (label: string) =>
  z.number({ error: `Enter ${label}` }).int("Enter a whole year").min(1950, "Enter a year after 1950").max(THIS_YEAR_MAX, "Enter a valid year");

/* ------------------------------ education ------------------------------ */

const eduSchema = z
  .object({
    school: z.string().trim().min(2, "School is required"),
    degree: z.string().trim().min(1, "Degree is required"),
    field: z.string().trim().min(2, "Field of study is required"),
    startYear: year("a start year"),
    endYear: z.union([z.number().int().min(1950).max(THIS_YEAR_MAX), z.nan()]),
  })
  .superRefine((v, ctx) => {
    if (!Number.isNaN(v.endYear) && v.endYear < v.startYear) {
      ctx.addIssue({ code: "custom", path: ["endYear"], message: "End year must be after the start year" });
    }
  });
type EduValues = z.infer<typeof eduSchema>;

function EducationForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: Education;
  onCancel: () => void;
  onSubmit: (values: EduValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EduValues>({
    resolver: zodResolver(eduSchema),
    mode: "onTouched",
    defaultValues: {
      school: initial?.school ?? "",
      degree: initial?.degree ?? "",
      field: initial?.field ?? "",
      startYear: initial?.startYear ?? (undefined as unknown as number),
      endYear: initial?.endYear ?? Number.NaN,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="edu-school" label="School / university" error={errors.school?.message} className="sm:col-span-2">
          <Input id="edu-school" aria-invalid={!!errors.school} {...register("school")} />
        </Field>
        <Field id="edu-degree" label="Degree" error={errors.degree?.message}>
          <Input id="edu-degree" placeholder="BSc, MSc, PhD…" aria-invalid={!!errors.degree} {...register("degree")} />
        </Field>
        <Field id="edu-field" label="Field of study" error={errors.field?.message}>
          <Input id="edu-field" aria-invalid={!!errors.field} {...register("field")} />
        </Field>
        <Field id="edu-start" label="Start year" error={errors.startYear?.message}>
          <Input id="edu-start" type="number" inputMode="numeric" placeholder="2018" aria-invalid={!!errors.startYear} {...register("startYear", { valueAsNumber: true })} />
        </Field>
        <Field id="edu-end" label="End year" hint="Leave empty if still studying" error={errors.endYear?.message}>
          <Input id="edu-end" type="number" inputMode="numeric" placeholder="2022" aria-invalid={!!errors.endYear} {...register("endYear", { valueAsNumber: true })} />
        </Field>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {initial ? "Save changes" : "Add education"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ---------------------------- certifications --------------------------- */

const certSchema = z.object({
  name: z.string().trim().min(2, "Certification name is required"),
  issuer: z.string().trim().min(2, "Issuer is required"),
  year: year("the year earned"),
});
type CertValues = z.infer<typeof certSchema>;

function CertificationForm({ onAdd }: { onAdd: (values: CertValues) => Promise<boolean> }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CertValues>({
    resolver: zodResolver(certSchema),
    mode: "onTouched",
    defaultValues: { name: "", issuer: "", year: undefined as unknown as number },
  });

  const submit = handleSubmit(async (values) => {
    const ok = await onAdd(values);
    if (ok) reset();
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-[1.5fr_1fr_6rem_auto] sm:items-start">
      <Field id="cert-name" label="Certification" error={errors.name?.message}>
        <Input id="cert-name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field id="cert-issuer" label="Issuer" error={errors.issuer?.message}>
        <Input id="cert-issuer" aria-invalid={!!errors.issuer} {...register("issuer")} />
      </Field>
      <Field id="cert-year" label="Year" error={errors.year?.message}>
        <Input id="cert-year" type="number" inputMode="numeric" placeholder="2024" aria-invalid={!!errors.year} {...register("year", { valueAsNumber: true })} />
      </Field>
      <div className="sm:pt-[1.625rem]">
        <Button type="submit" variant="outline" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
          Add
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------- section ------------------------------- */

type DeleteTarget = { kind: "education"; item: Education } | { kind: "certification"; item: Certification };

export function ProfileEducation({ candidate }: { candidate: Candidate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Education | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function askDelete(target: DeleteTarget) {
    setDeleteTarget(target);
    setDeleteOpen(true);
  }

  async function submitEducation(values: EduValues) {
    const entry: Education = {
      id: editing?.id ?? makeId("edu"),
      school: values.school,
      degree: values.degree,
      field: values.field,
      startYear: values.startYear,
      endYear: Number.isNaN(values.endYear) ? null : values.endYear,
    };
    const next = editing ? candidate.education.map((e) => (e.id === editing.id ? entry : e)) : [entry, ...candidate.education];
    next.sort((a, b) => (b.endYear ?? 9999) - (a.endYear ?? 9999));
    const ok = await saveCandidate(candidate.id, { education: next }, editing ? "Education updated" : "Education added");
    if (ok) setDialogOpen(false);
  }

  async function addCertification(values: CertValues): Promise<boolean> {
    const entry: Certification = { id: makeId("cert"), name: values.name, issuer: values.issuer, year: values.year };
    return saveCandidate(candidate.id, { certifications: [entry, ...candidate.certifications] }, "Certification added");
  }

  return (
    <div className="space-y-6">
      <ProfileSection
        title="Education"
        description="Degrees, bootcamps and formal study."
        actions={
          <Button
            type="button"
            variant="gradient"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus aria-hidden />
            Add education
          </Button>
        }
      >
        {candidate.education.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No education added" description="Add a degree or course to strengthen your profile." />
        ) : (
          <ul className="space-y-3">
            {candidate.education.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <GraduationCap className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-heading font-semibold">{item.school}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.degree} · {item.field}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.startYear} – {item.endYear ?? "Present"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${item.degree} at ${item.school}`}
                    onClick={() => {
                      setEditing(item);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${item.degree} at ${item.school}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => askDelete({ kind: "education", item })}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ProfileSection>

      <ProfileSection title="Certifications" description="Audits, courses and credentials that back up your skills.">
        <div className="space-y-4">
          {candidate.certifications.length === 0 ? (
            <EmptyState icon={Award} title="No certifications yet" description="Add a credential below." className="py-8" />
          ) : (
            <ul className="space-y-2">
              {candidate.certifications.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Award className="size-4 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.issuer} · {item.year}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${item.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => askDelete({ kind: "certification", item })}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <CertificationForm onAdd={addCertification} />
        </div>
      </ProfileSection>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit education" : "Add education"}</DialogTitle>
            <DialogDescription>Where did you study, and what did you focus on?</DialogDescription>
          </DialogHeader>
          <EducationForm initial={editing} onCancel={() => setDialogOpen(false)} onSubmit={submitEducation} />
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={deleteTarget?.kind === "certification" ? "Remove this certification?" : "Remove this education entry?"}
        description={
          deleteTarget?.kind === "certification"
            ? `${deleteTarget.item.name} will be removed from your profile.`
            : `${deleteTarget?.item.school ?? "This entry"} will be removed from your profile.`
        }
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.kind === "certification") {
            const id = deleteTarget.item.id;
            await saveCandidate(candidate.id, { certifications: candidate.certifications.filter((c) => c.id !== id) }, "Certification removed");
          } else {
            const id = deleteTarget.item.id;
            await saveCandidate(candidate.id, { education: candidate.education.filter((e) => e.id !== id) }, "Education removed");
          }
        }}
      />
    </div>
  );
}
