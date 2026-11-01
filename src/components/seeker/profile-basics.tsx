"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/shared/select-field";
import { GithubIcon, LinkedinIcon } from "@/components/brand/brand-icons";
import { EXPERIENCE_LEVELS } from "@/lib/constants";
import type { Candidate } from "@/types";
import { Field, ProfileSection, saveCandidate } from "./profile-ui";

const optionalUrl = z.union([z.literal(""), z.url("Enter a valid URL, e.g. https://example.com")]);

export const AVAILABILITY_CHOICES = [
  { value: "Immediately", label: "Available immediately" },
  { value: "2 weeks", label: "Available in 2 weeks" },
  { value: "1 month", label: "Available in 1 month" },
  { value: "Not looking", label: "Not actively looking" },
];

const schema = z.object({
  name: z.string().trim().min(2, "Full name is required"),
  headline: z.string().trim().min(5, "Add a headline of at least 5 characters").max(100, "Keep your headline under 100 characters"),
  location: z.string().trim().min(2, "Location is required"),
  email: z.email("Enter a valid e-mail address"),
  phone: z.string().trim().max(30, "Phone number is too long").regex(/^[+\d\s().-]*$/, "Use digits, spaces and + ( ) - only"),
  summary: z.string().trim().max(1200, "Keep your summary under 1,200 characters"),
  yearsOfExperience: z.number({ error: "Enter your years of experience" }).min(0, "Cannot be negative").max(50, "Enter a value of 50 or less"),
  experienceLevel: z.enum(["Entry", "Mid", "Senior", "Lead"]),
  availability: z.enum(["Immediately", "2 weeks", "1 month", "Not looking"]),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  website: optionalUrl,
});
type FormValues = z.infer<typeof schema>;

export function ProfileBasics({ candidate }: { candidate: Candidate }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: candidate.name,
      headline: candidate.headline,
      location: candidate.location,
      email: candidate.email,
      phone: candidate.phone,
      summary: candidate.summary,
      yearsOfExperience: candidate.yearsOfExperience,
      experienceLevel: candidate.experienceLevel,
      availability: candidate.availability,
      githubUrl: candidate.githubUrl,
      linkedinUrl: candidate.linkedinUrl,
      website: candidate.website,
    },
  });

  const summaryLength = useWatch({ control, name: "summary" })?.length ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    const ok = await saveCandidate(candidate.id, { ...values }, "Basic information saved");
    if (ok) reset(values);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ProfileSection title="Basic information" description="How employers see you at a glance.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Full name" error={errors.name?.message}>
            <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field id="location" label="Location" error={errors.location?.message}>
            <Input id="location" autoComplete="address-level2" placeholder="City, Country" aria-invalid={!!errors.location} {...register("location")} />
          </Field>
          <Field id="headline" label="Professional headline" error={errors.headline?.message} className="sm:col-span-2">
            <Input id="headline" placeholder="e.g. Senior Solidity & Web3 Engineer" aria-invalid={!!errors.headline} {...register("headline")} />
          </Field>
          <Field id="availability" label="Availability status" error={errors.availability?.message}>
            <Controller
              control={control}
              name="availability"
              render={({ field }) => (
                <SelectField id="availability" name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} options={AVAILABILITY_CHOICES} />
              )}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id="yearsOfExperience" label="Years of experience" error={errors.yearsOfExperience?.message}>
              <Input
                id="yearsOfExperience"
                type="number"
                inputMode="numeric"
                min={0}
                max={50}
                aria-invalid={!!errors.yearsOfExperience}
                {...register("yearsOfExperience", { valueAsNumber: true })}
              />
            </Field>
            <Field id="experienceLevel" label="Level" error={errors.experienceLevel?.message}>
              <Controller
                control={control}
                name="experienceLevel"
                render={({ field }) => (
                  <SelectField
                    id="experienceLevel"
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: l }))}
                  />
                )}
              />
            </Field>
          </div>
        </div>
      </ProfileSection>

      <ProfileSection title="Contact" description="Shared with employers only when you apply or reply to a message.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="email" label="E-mail" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field id="phone" label="Phone" error={errors.phone?.message}>
            <Input id="phone" type="tel" autoComplete="tel" placeholder="+1 555 0100" aria-invalid={!!errors.phone} {...register("phone")} />
          </Field>
        </div>
      </ProfileSection>

      <ProfileSection title="Professional summary" description="Two or three sentences on what you build and what you are looking for.">
        <Field id="summary" label="Summary" error={errors.summary?.message} hint={`${summaryLength} / 1200 characters`}>
          <Textarea id="summary" rows={6} aria-invalid={!!errors.summary} {...register("summary")} />
        </Field>
      </ProfileSection>

      <ProfileSection title="Links" description="Point employers to your work.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="githubUrl" label="GitHub" error={errors.githubUrl?.message}>
            <div className="relative">
              <GithubIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="githubUrl" type="url" inputMode="url" placeholder="https://github.com/you" className="pl-8" aria-invalid={!!errors.githubUrl} {...register("githubUrl")} />
            </div>
          </Field>
          <Field id="linkedinUrl" label="LinkedIn" error={errors.linkedinUrl?.message}>
            <div className="relative">
              <LinkedinIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="linkedinUrl" type="url" inputMode="url" placeholder="https://linkedin.com/in/you" className="pl-8" aria-invalid={!!errors.linkedinUrl} {...register("linkedinUrl")} />
            </div>
          </Field>
          <Field id="website" label="Website" error={errors.website?.message} className="sm:col-span-2">
            <Input id="website" type="url" inputMode="url" placeholder="https://your-site.com" aria-invalid={!!errors.website} {...register("website")} />
          </Field>
        </div>
      </ProfileSection>

      <div className="flex items-center justify-end gap-3">
        {isDirty && <span className="text-xs text-muted-foreground">You have unsaved changes</span>}
        <Button type="submit" variant="gradient" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
