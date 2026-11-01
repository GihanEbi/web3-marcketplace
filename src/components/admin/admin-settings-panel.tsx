"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bot,
  Check,
  Coins,
  Database,
  FolderKanban,
  Info,
  Layers,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Tags,
  Trash2,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { resetDemoData, updateAdminSettings } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import type { AdminSettings } from "@/types";
import { PlanEditor } from "./plan-editor";

type FeatureKey = keyof AdminSettings["features"];

const FEATURES: { key: FeatureKey; label: string; description: string; icon: LucideIcon }[] = [
  {
    key: "aiAssistant",
    label: "AI assistant",
    description: "Career chat, cover-letter drafting, resume analysis and recruiter insights for all roles.",
    icon: Bot,
  },
  {
    key: "cryptoPayments",
    label: "Crypto payments",
    description: "Let employers pay in stablecoins and tokens, and show wallet balances to seekers.",
    icon: Coins,
  },
  {
    key: "freelanceProjects",
    label: "Freelance projects",
    description: "Project listings, proposals, contracts and milestone-based escrow.",
    icon: FolderKanban,
  },
  {
    key: "web3Bounties",
    label: "Web3 bounties",
    description: "DAO-funded bounties that contributors can express interest in.",
    icon: Trophy,
  },
  {
    key: "requireJobApproval",
    label: "Require job approval",
    description: "New and re-published jobs wait as Pending until an administrator approves them.",
    icon: ShieldCheck,
  },
  {
    key: "messaging",
    label: "Messaging",
    description: "Direct conversations between employers and candidates.",
    icon: MessageSquare,
  },
];

const NAV_LINKS = [
  { href: "#categories", label: "Categories" },
  { href: "#networks", label: "Networks" },
  { href: "#plans", label: "Plans" },
  { href: "#features", label: "Feature toggles" },
  { href: "#demo-data", label: "Demo data" },
];

/** Reads the freshest settings at call time so rapid consecutive edits never overwrite each other. */
function latestSettings(): AdminSettings {
  return useAppStore.getState().adminSettings;
}

async function save(patch: Partial<AdminSettings>, success: string, description?: string): Promise<boolean> {
  try {
    await updateAdminSettings(patch);
    toast.success(success, description ? { description } : undefined);
    return true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not save settings.");
    return false;
  }
}

export function AdminSettingsPanel() {
  const hydrated = useHydrated();
  const settings = useAppStore((s) => s.adminSettings);
  const jobs = useAppStore((s) => s.jobs);
  const [resetOpen, setResetOpen] = useState(false);

  // Scroll to a #hash target once the skeleton has been replaced by real content.
  useEffect(() => {
    if (!hydrated) return;
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [hydrated]);

  const pendingJobs = useMemo(() => jobs.filter((j) => j.status === "pending").length, [jobs]);
  const jobCategories = useMemo(() => jobs.map((j) => j.category), [jobs]);

  if (!hydrated) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Platform settings"
        description="Configure categories, networks, pricing plans and marketplace features. Changes save instantly."
      />

      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info"
      >
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold">Demo only:</span> settings affect this browser&apos;s demo data. Nothing is
          sent to a server.
        </p>
      </div>

      <nav aria-label="Settings sections" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="inline-flex h-8 shrink-0 items-center rounded-full border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:border-primary/30 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-2">
        <CategoriesCard categories={settings.categories} jobs={jobCategories} />
        <NetworksCard networks={settings.networks} />
      </div>

      <section id="plans" aria-labelledby="plans-title" className="scroll-mt-24 space-y-3">
        <div>
          <h2 id="plans-title" className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Layers className="size-5 text-primary" aria-hidden /> Subscription plans
          </h2>
          <p className="text-sm text-muted-foreground">
            Edit plan names, prices, descriptions and feature lists. Each plan is saved separately.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {settings.plans.map((plan) => (
            <PlanEditor key={`${plan.id}:${JSON.stringify(plan)}`} plan={plan} />
          ))}
        </div>
      </section>

      <FeatureTogglesCard features={settings.features} pendingJobs={pendingJobs} />

      <Card id="demo-data" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5 text-primary" aria-hidden /> Demo data
          </CardTitle>
          <CardDescription>
            Restore users, companies, jobs, applications, reports, settings and the virtual clock to the original seed
            data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted-foreground">
            Useful after trying moderation actions or suspending demo accounts. You stay signed in as the administrator.
          </p>
          <Button variant="destructive" onClick={() => setResetOpen(true)}>
            <RotateCcw aria-hidden /> Reset demo data
          </Button>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        destructive
        title="Reset all demo data?"
        confirmLabel="Reset demo data"
        description="Every change made in this browser (moderation decisions, new jobs, applications, messages, settings) will be discarded and the original seed data restored. This cannot be undone."
        onConfirm={async () => {
          try {
            await resetDemoData();
            toast.success("Demo data reset to the original seed.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not reset demo data.");
          }
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

function validateCategoryName(raw: string, existing: string[], ignore?: string): string | null {
  const name = raw.trim();
  if (name.length < 2) return "Category name must be at least 2 characters.";
  if (name.length > 40) return "Keep category names under 40 characters.";
  const clash = existing.some((c) => c.toLowerCase() === name.toLowerCase() && c !== ignore);
  return clash ? `"${name}" already exists.` : null;
}

function CategoriesCard({ categories, jobs }: { categories: string[]; jobs: string[] }) {
  const addSchema = useMemo(
    () =>
      z.object({
        name: z.string().superRefine((value, ctx) => {
          const problem = validateCategoryName(value, categories);
          if (problem) ctx.addIssue({ code: "custom", message: problem });
        }),
      }),
    [categories],
  );
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string }>({ resolver: zodResolver(addSchema), defaultValues: { name: "" } });

  const [editing, setEditing] = useState<{ original: string; value: string } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((c) => map.set(c, (map.get(c) ?? 0) + 1));
    return map;
  }, [jobs]);

  async function onAdd(values: { name: string }) {
    const name = values.name.trim();
    const ok = await save({ categories: [...latestSettings().categories, name] }, `Category "${name}" added.`);
    if (ok) {
      reset({ name: "" });
      setFocus("name");
    }
  }

  async function commitRename() {
    if (!editing) return;
    const problem = validateCategoryName(editing.value, categories, editing.original);
    if (problem) {
      setEditError(problem);
      return;
    }
    const name = editing.value.trim();
    if (name === editing.original) {
      setEditing(null);
      return;
    }
    const ok = await save(
      { categories: latestSettings().categories.map((c) => (c === editing.original ? name : c)) },
      `Category renamed to "${name}".`,
      "Existing jobs keep their current category label.",
    );
    if (ok) {
      setEditing(null);
      setEditError(null);
    }
  }

  function onEditKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commitRename();
    } else if (e.key === "Escape") {
      setEditing(null);
      setEditError(null);
    }
  }

  const removeUsage = removeTarget ? (usage.get(removeTarget) ?? 0) : 0;

  return (
    <Card id="categories" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="size-5 text-primary" aria-hidden /> Job categories
        </CardTitle>
        <CardDescription>Categories employers can choose when posting a job and seekers can filter by.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onAdd)} noValidate className="space-y-1.5">
          <Label htmlFor="new-category">Add a category</Label>
          <div className="flex gap-2">
            <Input
              id="new-category"
              placeholder="e.g. Legal & Compliance"
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "new-category-error" : undefined}
              {...register("name")}
            />
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              <Plus aria-hidden /> Add
            </Button>
          </div>
          {errors.name && (
            <p id="new-category-error" className="text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </form>

        <ul className="divide-y divide-border rounded-lg border border-border" aria-label="Job categories">
          {categories.map((category) => {
            const isEditing = editing?.original === category;
            const count = usage.get(category) ?? 0;
            return (
              <li key={category} className="flex items-center gap-2 px-3 py-2">
                {isEditing ? (
                  <div className="min-w-0 flex-1 space-y-1">
                    <Input
                      autoFocus
                      value={editing.value}
                      onChange={(e) => {
                        setEditing({ original: category, value: e.target.value });
                        setEditError(null);
                      }}
                      onKeyDown={onEditKey}
                      aria-label={`Rename ${category}`}
                      aria-invalid={Boolean(editError)}
                    />
                    {editError && <p className="text-xs text-destructive">{editError}</p>}
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{category}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} {count === 1 ? "job" : "jobs"}
                    </p>
                  </div>
                )}
                {isEditing ? (
                  <>
                    <Button
                      size="icon-sm"
                      variant="default"
                      aria-label="Save category name"
                      onClick={() => void commitRename()}
                    >
                      <Check aria-hidden />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Cancel renaming"
                      onClick={() => {
                        setEditing(null);
                        setEditError(null);
                      }}
                    >
                      <X aria-hidden />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Rename ${category}`}
                      onClick={() => {
                        setEditing({ original: category, value: category });
                        setEditError(null);
                      }}
                    >
                      <Pencil aria-hidden />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Remove ${category}`}
                      disabled={categories.length <= 1}
                      onClick={() => setRemoveTarget(category)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          Renaming or removing a category does not change jobs that already use it. At least one category must remain.
        </p>
      </CardContent>

      <ConfirmationDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        destructive
        title={removeTarget ? `Remove "${removeTarget}"?` : "Remove category?"}
        confirmLabel="Remove category"
        description={
          removeUsage > 0
            ? `${removeUsage} ${removeUsage === 1 ? "job uses" : "jobs use"} this category. They keep their label, but it will no longer be offered for new listings.`
            : "No jobs use this category. It will no longer be offered for new listings."
        }
        onConfirm={async () => {
          if (!removeTarget) return;
          await save(
            { categories: latestSettings().categories.filter((c) => c !== removeTarget) },
            `Category "${removeTarget}" removed.`,
          );
        }}
      />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Networks                                                            */
/* ------------------------------------------------------------------ */

function NetworksCard({ networks }: { networks: AdminSettings["networks"] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const enabledCount = networks.filter((n) => n.enabled).length;

  async function toggle(name: string, enabled: boolean) {
    const current = latestSettings().networks;
    if (!enabled && current.filter((n) => n.enabled).length <= 1) {
      toast.error("At least one blockchain network must stay enabled.");
      return;
    }
    setBusy(name);
    await save(
      { networks: current.map((n) => (n.name === name ? { ...n, enabled } : n)) },
      `${name} ${enabled ? "enabled" : "disabled"}.`,
    );
    setBusy(null);
  }

  return (
    <Card id="networks" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="size-5 text-primary" aria-hidden /> Supported blockchain networks
        </CardTitle>
        <CardDescription>
          Networks available for escrow contracts and wallet connections. {enabledCount} of {networks.length} enabled.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {networks.map((network) => (
            <li key={network.name} className="flex items-center justify-between gap-3 px-3 py-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={cn("size-2.5 rounded-full", network.enabled ? "bg-success" : "bg-muted-foreground/40")}
                />
                <div>
                  <p className="text-sm font-medium">{network.name}</p>
                  <p className="text-xs text-muted-foreground">{network.enabled ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
              <Switch
                aria-label={`${network.name} network`}
                checked={network.enabled}
                disabled={busy === network.name}
                onCheckedChange={(checked) => void toggle(network.name, checked)}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Feature toggles                                                     */
/* ------------------------------------------------------------------ */

function FeatureTogglesCard({ features, pendingJobs }: { features: AdminSettings["features"]; pendingJobs: number }) {
  const [busy, setBusy] = useState<FeatureKey | null>(null);

  async function toggle(key: FeatureKey, label: string, enabled: boolean) {
    setBusy(key);
    let description: string | undefined;
    if (key === "requireJobApproval") {
      description = enabled
        ? "New jobs will be Pending until an administrator approves them."
        : pendingJobs > 0
          ? `New jobs publish immediately. ${pendingJobs} pending ${pendingJobs === 1 ? "job still needs" : "jobs still need"} a decision.`
          : "New jobs publish immediately.";
    }
    await save(
      { features: { ...latestSettings().features, [key]: enabled } },
      `${label} ${enabled ? "enabled" : "disabled"}.`,
      description,
    );
    setBusy(null);
  }

  return (
    <Card id="features" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" aria-hidden /> Marketplace features
        </CardTitle>
        <CardDescription>Turn product areas on or off for the whole demo marketplace.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {FEATURES.map(({ key, label, description, icon: Icon }) => (
            <li key={key} className="flex items-start justify-between gap-4 px-4 py-3.5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-sm text-pretty text-muted-foreground">{description}</p>
                  {key === "requireJobApproval" && features.requireJobApproval && pendingJobs > 0 && (
                    <p className="mt-1 text-xs text-warning">{pendingJobs} jobs currently waiting for approval.</p>
                  )}
                </div>
              </div>
              <Switch
                aria-label={label}
                checked={features[key]}
                disabled={busy === key}
                onCheckedChange={(checked) => void toggle(key, label, checked)}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
