"use client";

import type { ReactNode } from "react";
import { format, isValid, parseISO } from "date-fns";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateCandidateProfile } from "@/services";
import type { Candidate } from "@/types";

/** Persist a profile patch through the service layer with toast feedback. Resolves to true on success. */
export async function saveCandidate(candidateId: string, patch: Partial<Candidate>, success = "Profile saved"): Promise<boolean> {
  try {
    await updateCandidateProfile(candidateId, patch);
    toast.success(success);
    return true;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Could not save your profile");
    return false;
  }
}

/** "2023-03" -> "Mar 2023" */
export function formatMonth(value: string | null | undefined): string {
  if (!value) return "Present";
  const d = parseISO(`${value}-01`);
  return isValid(d) ? format(d, "MMM yyyy") : value;
}

interface ProfileSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ProfileSection({ title, description, actions, children, className }: ProfileSectionProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ id, label, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
