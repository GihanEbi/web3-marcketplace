"use client";

import { useMemo, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  BadgeCheck,
  Building2,
  Globe,
  Layers,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { DiscordIcon, GithubIcon, LinkedinIcon, XIcon } from "@/components/brand/brand-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CompanyCard } from "@/components/shared/company-card";
import { CompanyLogo } from "@/components/shared/company-logo";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SelectField } from "@/components/shared/select-field";
import { SkillTag } from "@/components/shared/skill-tag";
import { appNow } from "@/lib/clock";
import { BLOCKCHAINS, SKILLS } from "@/lib/constants";
import { shortenAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import { updateCompanyProfile } from "@/services";
import { mockWalletAddress, useAppStore } from "@/store/app-store";
import { useCurrentCompany, useHydrated } from "@/store/hooks";
import type { Company, CompanySize } from "@/types";
import { requestCompanyVerification, verificationRequestTitle } from "./employer-services";
import { Field } from "./field";
import { TagInput } from "./tag-input";

const SIZES: CompanySize[] = ["1-10", "11-50", "51-200", "201-500", "500+"];
const INDUSTRIES = [
  "Layer 2 Infrastructure",
  "DeFi Lending",
  "DAO / Public Goods",
  "Wallets & Account Abstraction",
  "Smart Contract Auditing",
  "NFT & Digital Collectibles",
  "Web3 Gaming",
  "On-chain Analytics",
  "Developer Tooling",
  "Web3 / Blockchain",
];
const LOGO_PRESETS = [
  { name: "Indigo to violet", from: "#6366f1", to: "#a855f7" },
  { name: "Sky to blue", from: "#38bdf8", to: "#2563eb" },
  { name: "Emerald to teal", from: "#10b981", to: "#0d9488" },
  { name: "Amber to rose", from: "#f59e0b", to: "#e11d48" },
  { name: "Fuchsia to pink", from: "#d946ef", to: "#ec4899" },
  { name: "Slate to indigo", from: "#475569", to: "#4f46e5" },
];

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || isHttpUrl(v), { message: "Enter a valid URL, e.g. https://example.com" });

const HEX = /^#[0-9a-fA-F]{6}$/;

function buildSchema(maxYear: number) {
  return z.object({
    name: z.string().trim().min(2, "Company name is required").max(60, "Keep the name under 60 characters"),
    initials: z.string().trim().min(1, "Add 1 to 3 initials for your logo").max(3, "Use at most 3 characters"),
    logoFrom: z.string().regex(HEX, "Pick a valid colour"),
    logoTo: z.string().regex(HEX, "Pick a valid colour"),
    tagline: z.string().trim().max(120, "Keep the tagline under 120 characters"),
    about: z.string().trim().max(1500, "Keep the description under 1,500 characters"),
    website: optionalUrl,
    industry: z.string().trim().min(2, "Enter your industry"),
    location: z.string().trim().min(2, "Enter your headquarters or “Remote”"),
    size: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]),
    founded: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Enter a four-digit year")
      .refine((v) => Number(v) >= 1990 && Number(v) <= maxYear, { message: `Enter a year between 1990 and ${maxYear}` }),
    techStack: z.array(z.string()),
    ecosystems: z.array(z.string()),
    isDao: z.boolean(),
    twitter: optionalUrl,
    github: optionalUrl,
    linkedin: optionalUrl,
    discord: optionalUrl,
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function toValues(company: Company): FormValues {
  return {
    name: company.name,
    initials: company.initials,
    logoFrom: company.logoFrom,
    logoTo: company.logoTo,
    tagline: company.tagline,
    about: company.about,
    website: company.website,
    industry: company.industry,
    location: company.location,
    size: company.size,
    founded: String(company.founded),
    techStack: company.techStack,
    ecosystems: company.ecosystems,
    isDao: company.isDao,
    twitter: company.social.twitter ?? "",
    github: company.social.github ?? "",
    linkedin: company.social.linkedin ?? "",
    discord: company.social.discord ?? "",
  };
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <div>
          <h2 className="font-heading text-base font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <Field label={label} htmlFor={id} error={error}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={HEX.test(value) ? value : "#6366f1"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-input bg-transparent p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Input
          aria-label={`${label} hex value`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          spellCheck={false}
          className="h-9 w-28 font-mono"
          aria-invalid={Boolean(error)}
        />
      </div>
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Side panels                                                         */
/* ------------------------------------------------------------------ */

function VerificationPanel({ company }: { company: Company }) {
  const notifications = useAppStore((s) => s.notifications);
  const [sending, setSending] = useState(false);
  const requested = useMemo(
    () => notifications.some((n) => n.role === "admin" && n.title === verificationRequestTitle(company)),
    [notifications, company],
  );

  async function request() {
    setSending(true);
    try {
      await requestCompanyVerification(company);
      toast.success("Verification requested", {
        description: "Our admins have been notified and will review your company profile.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="verification-heading">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            company.verified ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          {company.verified ? <BadgeCheck className="size-5" aria-hidden /> : <ShieldQuestion className="size-5" aria-hidden />}
        </span>
        <div className="min-w-0">
          <h2 id="verification-heading" className="font-heading text-base font-semibold">
            Verification status
          </h2>
          <p className={cn("text-sm font-medium", company.verified ? "text-success" : "text-muted-foreground")}>
            {company.verified ? "Verified company" : "Not verified yet"}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-pretty text-muted-foreground">
        {company.verified
          ? "Platform admins verified this company. A verified badge appears on your profile and job postings."
          : "Only platform admins can verify companies. Complete your profile, then request a review to earn the verified badge and build candidate trust."}
      </p>
      {!company.verified && (
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full"
          onClick={request}
          disabled={sending || requested}
        >
          {sending ? <Loader2 className="animate-spin" aria-hidden /> : <ShieldCheck aria-hidden />}
          {requested ? "Request sent, awaiting review" : "Request verification"}
        </Button>
      )}
    </section>
  );
}

function WalletPanel({ company }: { company: Company }) {
  const [busy, setBusy] = useState(false);

  async function setAddress(address: string | undefined) {
    setBusy(true);
    try {
      await updateCompanyProfile(company.id, { walletAddress: address });
      toast.success(address ? "Demo wallet connected" : "Wallet disconnected", {
        description: address ? "This is a generated demo address. No real wallet is involved." : undefined,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the wallet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="wallet-heading">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wallet className="size-4.5" aria-hidden />
        </span>
        <div>
          <h2 id="wallet-heading" className="font-heading text-base font-semibold">
            Connected wallet
          </h2>
          <p className="text-sm text-muted-foreground">Used for escrow and on-chain payments (simulated).</p>
        </div>
      </div>
      {company.walletAddress ? (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <code className="min-w-0 truncate text-sm" title={company.walletAddress}>
            {shortenAddress(company.walletAddress, 6)}
          </code>
          <CopyButton value={company.walletAddress} label="Wallet address" />
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
          No wallet connected yet.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAddress(mockWalletAddress())}
          disabled={busy}
        >
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {company.walletAddress ? "Generate new demo address" : "Connect demo wallet"}
        </Button>
        {company.walletAddress && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setAddress(undefined)} disabled={busy}>
            Disconnect
          </Button>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

function CompanyProfileForm({ company }: { company: Company }) {
  const schema = useMemo(() => buildSchema(appNow().getFullYear()), []);
  const initial = useMemo(() => toValues(company), [company]);
  const [initialsEdited, setInitialsEdited] = useState(company.initials !== deriveInitials(company.name));

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initial, mode: "onTouched" });

  const watched = useWatch({ control });

  const previewCompany = useMemo<Company>(
    () => ({
      ...company,
      name: watched.name?.trim() || "Your company",
      initials: (watched.initials ?? company.initials).toUpperCase(),
      logoFrom: watched.logoFrom && HEX.test(watched.logoFrom) ? watched.logoFrom : company.logoFrom,
      logoTo: watched.logoTo && HEX.test(watched.logoTo) ? watched.logoTo : company.logoTo,
      tagline: watched.tagline ?? "",
      industry: watched.industry ?? "",
      location: watched.location ?? "",
      techStack: (watched.techStack ?? []) as string[],
      isDao: watched.isDao ?? false,
    }),
    [company, watched],
  );

  const err = (key: keyof FormValues): string | undefined => {
    const e = errors[key];
    return e && typeof e.message === "string" ? e.message : undefined;
  };

  async function onSubmit(values: FormValues) {
    try {
      const social: Company["social"] = {};
      if (values.twitter) social.twitter = values.twitter;
      if (values.github) social.github = values.github;
      if (values.linkedin) social.linkedin = values.linkedin;
      if (values.discord) social.discord = values.discord;
      await updateCompanyProfile(company.id, {
        name: values.name.trim(),
        initials: values.initials.trim().toUpperCase(),
        logoFrom: values.logoFrom,
        logoTo: values.logoTo,
        tagline: values.tagline.trim(),
        about: values.about.trim(),
        website: values.website.trim(),
        industry: values.industry.trim(),
        location: values.location.trim(),
        size: values.size,
        founded: Number(values.founded),
        techStack: values.techStack,
        ecosystems: BLOCKCHAINS.filter((b) => values.ecosystems.includes(b)),
        isDao: values.isDao,
        social,
      });
      reset(values);
      toast.success("Company profile saved", { description: "Your changes are live on your public company page." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the company profile.");
    }
  }

  function onInvalid() {
    toast.error("Please fix the highlighted fields", { description: "Some profile fields need your attention." });
  }

  const nameField = register("name", {
    onChange: (e) => {
      if (!initialsEdited) setValue("initials", deriveInitials(e.target.value), { shouldDirty: true });
    },
  });
  const initialsField = register("initials", {
    onChange: () => {
      setInitialsEdited(true);
    },
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-6" aria-label="Company profile">
        <Section icon={Building2} title="Company basics" description="The essentials candidates see first.">
          <Field label="Company name" htmlFor="co-name" required error={err("name")}>
            <Input
              id="co-name"
              autoComplete="organization"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "co-name-error" : undefined}
              {...nameField}
            />
          </Field>
          <Field
            label="Tagline"
            htmlFor="co-tagline"
            error={err("tagline")}
            hint="One sentence that sums up what you build (max 120 characters)."
          >
            <Input
              id="co-tagline"
              placeholder="Building the rails for on-chain finance"
              aria-invalid={Boolean(errors.tagline)}
              aria-describedby={errors.tagline ? "co-tagline-error" : "co-tagline-hint"}
              {...register("tagline")}
            />
          </Field>
          <Field label="About the company" htmlFor="co-about" error={err("about")}>
            <Textarea
              id="co-about"
              rows={6}
              placeholder="Tell candidates about your mission, product, team culture and how you work."
              aria-invalid={Boolean(errors.about)}
              aria-describedby={errors.about ? "co-about-error" : undefined}
              {...register("about")}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Website" htmlFor="co-website" error={err("website")}>
              <div className="relative">
                <Globe aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="co-website"
                  type="url"
                  inputMode="url"
                  placeholder="https://yourcompany.xyz"
                  className="h-9 pl-8"
                  aria-invalid={Boolean(errors.website)}
                  aria-describedby={errors.website ? "co-website-error" : undefined}
                  {...register("website")}
                />
              </div>
            </Field>
            <Field label="Industry" htmlFor="co-industry" required error={err("industry")}>
              <Input
                id="co-industry"
                list="co-industry-list"
                className="h-9"
                aria-invalid={Boolean(errors.industry)}
                aria-describedby={errors.industry ? "co-industry-error" : undefined}
                {...register("industry")}
              />
              <datalist id="co-industry-list">
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </Field>
            <Field label="Location" htmlFor="co-location" required error={err("location")}>
              <Input
                id="co-location"
                placeholder="Remote, or e.g. Berlin, Germany"
                className="h-9"
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? "co-location-error" : undefined}
                {...register("location")}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Company size" htmlFor="co-size" required>
                <Controller
                  control={control}
                  name="size"
                  render={({ field }) => (
                    <SelectField
                      id="co-size"
                      ref={field.ref}
                      value={field.value}
                      onChange={field.onChange}
                      options={SIZES.map((s) => ({ value: s, label: `${s} people` }))}
                    />
                  )}
                />
              </Field>
              <Field label="Founded" htmlFor="co-founded" required error={err("founded")}>
                <Input
                  id="co-founded"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="2021"
                  className="h-9"
                  aria-invalid={Boolean(errors.founded)}
                  aria-describedby={errors.founded ? "co-founded-error" : undefined}
                  {...register("founded")}
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section icon={Palette} title="Logo" description="A generated logo built from your initials and brand colours.">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <CompanyLogo company={previewCompany} size="xl" />
            <div className="min-w-0 flex-1 space-y-4">
              <Field label="Initials" htmlFor="co-initials" required error={err("initials")} className="max-w-32">
                <Input
                  id="co-initials"
                  maxLength={3}
                  className="h-9 uppercase"
                  aria-invalid={Boolean(errors.initials)}
                  aria-describedby={errors.initials ? "co-initials-error" : undefined}
                  {...initialsField}
                />
              </Field>
              <div className="flex flex-wrap gap-5">
                <Controller
                  control={control}
                  name="logoFrom"
                  render={({ field }) => (
                    <ColorField id="co-logo-from" label="Gradient start" value={field.value} onChange={field.onChange} error={err("logoFrom")} />
                  )}
                />
                <Controller
                  control={control}
                  name="logoTo"
                  render={({ field }) => (
                    <ColorField id="co-logo-to" label="Gradient end" value={field.value} onChange={field.onChange} error={err("logoTo")} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <p id="co-presets-label" className="text-sm font-medium">
                  Presets
                </p>
                <ul className="flex flex-wrap gap-2" aria-labelledby="co-presets-label">
                  {LOGO_PRESETS.map((preset) => (
                    <li key={preset.name}>
                      <button
                        type="button"
                        title={preset.name}
                        aria-label={`Use ${preset.name} gradient`}
                        onClick={() => {
                          setValue("logoFrom", preset.from, { shouldDirty: true, shouldValidate: true });
                          setValue("logoTo", preset.to, { shouldDirty: true, shouldValidate: true });
                        }}
                        style={{ backgroundImage: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
                        className="size-8 rounded-lg ring-1 ring-inset ring-white/20 transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>

        <Section icon={Layers} title="Technology & ecosystems" description="Helps the AI match you with the right candidates.">
          <Field label="Technology stack" htmlFor="co-tech">
            <Controller
              control={control}
              name="techStack"
              render={({ field }) => (
                <TagInput
                  id="co-tech"
                  value={field.value}
                  onChange={field.onChange}
                  suggestions={SKILLS}
                  placeholder="Add a technology, e.g. Solidity"
                />
              )}
            />
          </Field>
          <div className="space-y-2">
            <p id="co-ecosystems-label" className="text-sm font-medium">
              Blockchain ecosystems
            </p>
            <Controller
              control={control}
              name="ecosystems"
              render={({ field }) => (
                <ul className="flex flex-wrap gap-2" aria-labelledby="co-ecosystems-label">
                  {BLOCKCHAINS.map((chain) => {
                    const active = field.value.includes(chain);
                    return (
                      <li key={chain}>
                        <SkillTag
                          skill={chain}
                          size="md"
                          variant="outline"
                          active={active}
                          onClick={() =>
                            field.onChange(active ? field.value.filter((c) => c !== chain) : [...field.value, chain])
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            />
          </div>
        </Section>

        <Section icon={Globe} title="Social links" description="Optional. Shown on your public company page.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="X (Twitter)" htmlFor="co-twitter" error={err("twitter")}>
              <div className="relative">
                <XIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
                <Input id="co-twitter" type="url" placeholder="https://x.com/yourcompany" className="h-9 pl-8" aria-invalid={Boolean(errors.twitter)} aria-describedby={errors.twitter ? "co-twitter-error" : undefined} {...register("twitter")} />
              </div>
            </Field>
            <Field label="GitHub" htmlFor="co-github" error={err("github")}>
              <div className="relative">
                <GithubIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
                <Input id="co-github" type="url" placeholder="https://github.com/yourcompany" className="h-9 pl-8" aria-invalid={Boolean(errors.github)} aria-describedby={errors.github ? "co-github-error" : undefined} {...register("github")} />
              </div>
            </Field>
            <Field label="LinkedIn" htmlFor="co-linkedin" error={err("linkedin")}>
              <div className="relative">
                <LinkedinIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
                <Input id="co-linkedin" type="url" placeholder="https://linkedin.com/company/yourcompany" className="h-9 pl-8" aria-invalid={Boolean(errors.linkedin)} aria-describedby={errors.linkedin ? "co-linkedin-error" : undefined} {...register("linkedin")} />
              </div>
            </Field>
            <Field label="Discord" htmlFor="co-discord" error={err("discord")}>
              <div className="relative">
                <DiscordIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
                <Input id="co-discord" type="url" placeholder="https://discord.gg/yourcommunity" className="h-9 pl-8" aria-invalid={Boolean(errors.discord)} aria-describedby={errors.discord ? "co-discord-error" : undefined} {...register("discord")} />
              </div>
            </Field>
          </div>
        </Section>

        <Section icon={Users} title="DAO" description="Operate as a decentralised organisation?">
          <Controller
            control={control}
            name="isDao"
            render={({ field }) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
                  <div>
                    <label htmlFor="co-dao" className="text-sm font-medium">
                      This company is a DAO
                    </label>
                    <p id="co-dao-hint" className="text-xs text-muted-foreground">
                      Adds a DAO badge to your profile and unlocks DAO-specific job fields.
                    </p>
                  </div>
                  <Switch id="co-dao" checked={field.value} onCheckedChange={(c) => field.onChange(c)} aria-describedby="co-dao-hint" />
                </div>
                {field.value && (
                  <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                    DAO mode adds a <span className="font-medium text-foreground">DAO name</span> and{" "}
                    <span className="font-medium text-foreground">contributor type</span> (core, part-time or grant-funded) to
                    your job postings, and lets you publish Web3 bounties.
                  </p>
                )}
              </div>
            )}
          />
        </Section>

        <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="px-1 text-xs text-muted-foreground" aria-live="polite">
            {isDirty ? "You have unsaved changes." : "All changes saved."}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset(initial);
                setInitialsEdited(company.initials !== deriveInitials(company.name));
              }}
              disabled={!isDirty || isSubmitting}
            >
              <RotateCcw aria-hidden />
              Discard
            </Button>
            <Button type="submit" variant="gradient" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
              Save profile
            </Button>
          </div>
        </div>
      </form>

      <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <div className="space-y-3">
          <h2 className="font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">Live preview</h2>
          <CompanyCard company={previewCompany} />
        </div>
        <VerificationPanel company={company} />
        <WalletPanel company={company} />
      </aside>
    </div>
  );
}

export function CompanyProfile() {
  const hydrated = useHydrated();
  const company = useCurrentCompany();

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <PageHeader title="Company profile" description="Tell candidates who you are." />
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }
  if (!company) {
    return <EmptyState icon={Building2} title="No company found" description="Sign in with an employer account to edit a company profile." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company profile"
        description="Keep your profile polished: candidates and the AI matching engine use it to decide if you're a fit."
      />
      <CompanyProfileForm key={company.id} company={company} />
    </div>
  );
}
