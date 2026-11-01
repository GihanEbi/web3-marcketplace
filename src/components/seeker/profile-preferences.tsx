"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Wallet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/shared/copy-button";
import { SelectField } from "@/components/shared/select-field";
import { BLOCKCHAINS, EMPLOYMENT_TYPES } from "@/lib/constants";
import { shortenAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Blockchain, Candidate, EmploymentType } from "@/types";
import { AVAILABILITY_CHOICES } from "./profile-basics";
import { Field, ProfileSection, saveCandidate } from "./profile-ui";

const REMOTE_OPTIONS = ["Remote only", "Hybrid", "Onsite", "Flexible"] as const;
const CURRENCIES = ["USD", "USDC", "DAI", "ETH", "SOL"] as const;

const salary = (label: string) => z.number({ error: `Enter ${label}` }).min(0, "Cannot be negative").max(100_000_000, "Value is too large");

const schema = z
  .object({
    preferredJobTypes: z.array(z.enum(["Full-time", "Part-time", "Contract", "Freelance", "Internship"])).min(1, "Pick at least one job type"),
    preferredEcosystems: z.array(z.enum(BLOCKCHAINS as [Blockchain, ...Blockchain[]])),
    expectedSalaryMin: salary("a minimum salary"),
    expectedSalaryMax: salary("a maximum salary"),
    salaryCurrency: z.enum(["USD", "USDC", "DAI", "ETH", "SOL"]),
    remotePreference: z.enum(REMOTE_OPTIONS),
    availability: z.enum(["Immediately", "2 weeks", "1 month", "Not looking"]),
  })
  .refine((v) => v.expectedSalaryMin <= v.expectedSalaryMax, {
    path: ["expectedSalaryMax"],
    message: "Maximum must be greater than or equal to the minimum",
  });
type FormValues = z.infer<typeof schema>;

function ToggleChip({ label, pressed, onToggle }: { label: string; pressed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        pressed ? "border-primary/50 bg-primary/15 font-medium text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ProfilePreferences({ candidate }: { candidate: Candidate }) {
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
      preferredJobTypes: candidate.preferredJobTypes,
      preferredEcosystems: candidate.preferredEcosystems,
      expectedSalaryMin: candidate.expectedSalaryMin,
      expectedSalaryMax: candidate.expectedSalaryMax,
      salaryCurrency: candidate.salaryCurrency,
      remotePreference: candidate.remotePreference,
      availability: candidate.availability,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const ok = await saveCandidate(
      candidate.id,
      {
        preferredJobTypes: values.preferredJobTypes,
        preferredEcosystems: values.preferredEcosystems,
        expectedSalaryMin: values.expectedSalaryMin,
        expectedSalaryMax: values.expectedSalaryMax,
        salaryCurrency: values.salaryCurrency,
        remotePreference: values.remotePreference,
        availability: values.availability,
      },
      "Job preferences saved",
    );
    if (ok) reset(values);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ProfileSection title="Job preferences" description="Used to rank recommendations and score your matches.">
        <div className="space-y-6">
          <Controller
            control={control}
            name="preferredJobTypes"
            render={({ field }) => (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Preferred job types</legend>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYMENT_TYPES.map((type: EmploymentType) => (
                    <ToggleChip key={type} label={type} pressed={field.value.includes(type)} onToggle={() => field.onChange(toggle(field.value, type))} />
                  ))}
                </div>
                {errors.preferredJobTypes && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.preferredJobTypes.message}
                  </p>
                )}
              </fieldset>
            )}
          />

          <Controller
            control={control}
            name="preferredEcosystems"
            render={({ field }) => (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Preferred ecosystems</legend>
                <div className="flex flex-wrap gap-2">
                  {BLOCKCHAINS.map((chain) => (
                    <ToggleChip key={chain} label={chain} pressed={field.value.includes(chain)} onToggle={() => field.onChange(toggle(field.value, chain))} />
                  ))}
                </div>
              </fieldset>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field id="salary-min" label="Expected salary (min / year)" error={errors.expectedSalaryMin?.message}>
              <Input id="salary-min" type="number" inputMode="numeric" min={0} step={1000} aria-invalid={!!errors.expectedSalaryMin} {...register("expectedSalaryMin", { valueAsNumber: true })} />
            </Field>
            <Field id="salary-max" label="Expected salary (max / year)" error={errors.expectedSalaryMax?.message}>
              <Input id="salary-max" type="number" inputMode="numeric" min={0} step={1000} aria-invalid={!!errors.expectedSalaryMax} {...register("expectedSalaryMax", { valueAsNumber: true })} />
            </Field>
            <Field id="salary-currency" label="Currency" error={errors.salaryCurrency?.message}>
              <Controller
                control={control}
                name="salaryCurrency"
                render={({ field }) => (
                  <SelectField id="salary-currency" name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
                )}
              />
            </Field>
            <Field id="remote-pref" label="Remote-work preference" error={errors.remotePreference?.message}>
              <Controller
                control={control}
                name="remotePreference"
                render={({ field }) => (
                  <SelectField id="remote-pref" name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} options={REMOTE_OPTIONS.map((r) => ({ value: r, label: r }))} />
                )}
              />
            </Field>
          </div>

          <Field id="pref-availability" label="Availability" error={errors.availability?.message} className="sm:max-w-xs">
            <Controller
              control={control}
              name="availability"
              render={({ field }) => (
                <SelectField id="pref-availability" name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} options={AVAILABILITY_CHOICES} />
              )}
            />
          </Field>
        </div>
      </ProfileSection>

      <ProfileSection title="Wallet" description="Your linked wallet address is used for crypto payments and on-chain contracts.">
        {candidate.walletAddress ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm break-all" title={candidate.walletAddress}>
                <span className="sm:hidden">{shortenAddress(candidate.walletAddress, 6)}</span>
                <span className="hidden sm:inline">{candidate.walletAddress}</span>
              </p>
              <p className="text-xs text-muted-foreground">Display only — manage connections from the Wallet page.</p>
            </div>
            <CopyButton value={candidate.walletAddress} label="Wallet address" />
            <Link href="/wallet" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open wallet
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4">
            <p className="text-sm text-muted-foreground">No wallet linked to your profile yet.</p>
            <Link href="/wallet" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Wallet aria-hidden />
              Connect a wallet
            </Link>
          </div>
        )}
      </ProfileSection>

      <div className="flex items-center justify-end gap-3">
        {isDirty && <span className="text-xs text-muted-foreground">You have unsaved changes</span>}
        <Button type="submit" variant="gradient" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {isSubmitting ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </form>
  );
}
