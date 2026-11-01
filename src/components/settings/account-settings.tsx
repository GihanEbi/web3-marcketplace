"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { Bell, CreditCard, Database, Monitor, Moon, Palette, RotateCcw, Sun, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { ROLE_HOME, ROLE_LABEL } from "@/config/nav";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { resetDemoData } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser, useHydrated } from "@/store/hooks";

const PREFS_KEY = "chainhire-notification-prefs";
const PREF_OPTIONS = [
  { key: "applications", label: "Application updates", hint: "Status changes, new applicants and withdrawals" },
  { key: "messages", label: "New messages", hint: "When someone replies to a conversation" },
  { key: "interviews", label: "Interview reminders", hint: "Invitations, reschedules and cancellations" },
  { key: "ai", label: "AI recommendations", hint: "Personalised job matches and insights" },
  { key: "payments", label: "Payment & escrow updates", hint: "Simulated milestone and payment events" },
] as const;
type PrefKey = (typeof PREF_OPTIONS)[number]["key"];
const DEFAULT_PREFS: Record<PrefKey, boolean> = { applications: true, messages: true, interviews: true, ai: true, payments: true };

const prefListeners = new Set<() => void>();
const subscribePrefs = (cb: () => void) => {
  prefListeners.add(cb);
  return () => {
    prefListeners.delete(cb);
  };
};
const readPrefsRaw = (): string => {
  try {
    return window.localStorage.getItem(PREFS_KEY) ?? "";
  } catch {
    return "";
  }
};

function usePrefs() {
  const raw = useSyncExternalStore(subscribePrefs, readPrefsRaw, () => "");
  const prefs = useMemo<Record<PrefKey, boolean>>(() => {
    if (!raw) return DEFAULT_PREFS;
    try {
      return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Record<PrefKey, boolean>>) };
    } catch {
      return DEFAULT_PREFS;
    }
  }, [raw]);
  function update(key: PrefKey, value: boolean) {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prefs, [key]: value }));
    } catch {
      /* storage unavailable */
    }
    prefListeners.forEach((cb) => cb());
  }
  return { prefs, update };
}

const THEMES = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AccountSettings() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const subscriptions = useAppStore((s) => s.subscriptions);
  const { prefs, update } = usePrefs();
  const [confirmReset, setConfirmReset] = useState(false);
  const mounted = useMounted();

  if (!hydrated || !user) return <LoadingSkeleton variant="page" />;

  const subscription = subscriptions.find((s) => s.userId === user.id);
  const profileHref = user.role === "seeker" ? "/profile" : user.role === "employer" ? "/employer/company" : ROLE_HOME.admin;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account, appearance, notifications and demo data." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="size-5 text-primary" /> Account
            </CardTitle>
            <CardDescription>Your demo account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="grid grid-cols-[8rem_1fr] gap-y-3">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{user.name}</dd>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="font-medium">{user.email}</dd>
              <dt className="text-muted-foreground">Role</dt>
              <dd>
                <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
              </dd>
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="font-medium">{formatDate(user.joinedAt)}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium capitalize">{user.status}</dd>
            </dl>
            <Link href={profileHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {user.role === "employer" ? "Edit company profile" : user.role === "seeker" ? "Edit profile" : "Go to overview"}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-primary" /> Subscription
            </CardTitle>
            <CardDescription>Plans are simulated — no payment is ever taken.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Current plan</p>
                <p className="text-lg font-semibold capitalize">{user.plan}</p>
              </div>
              <Badge className="bg-success/15 text-success">{subscription?.status ?? "active"}</Badge>
            </div>
            {subscription && subscription.amountMonthly > 0 && (
              <p className="text-muted-foreground">
                ${subscription.amountMonthly}/month · renews {formatDate(subscription.renewsAt)}
              </p>
            )}
            <Link href="/pricing" className={buttonVariants({ variant: "gradient", size: "sm" })}>
              Compare & change plan
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>Choose how Chainhire looks on your device.</CardDescription>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
              {THEMES.map(({ value, label, icon: Icon }) => {
                const active = mounted && theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all focus-visible:ring-3 focus-visible:ring-ring/50",
                      active ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-primary" /> Notifications
            </CardTitle>
            <CardDescription>Preferences are saved in this browser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PREF_OPTIONS.map(({ key, label, hint }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor={`pref-${key}`}>{label}</Label>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <Switch
                  id={`pref-${key}`}
                  checked={prefs[key]}
                  onCheckedChange={(v) => {
                    update(key, Boolean(v));
                    toast.success(`${label} ${v ? "enabled" : "disabled"}`);
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-warning/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5 text-warning" /> Demo data
          </CardTitle>
          <CardDescription>
            All data in this demo (jobs, applications, messages, contracts…) is stored in your browser&apos;s localStorage.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Resetting restores the original seeded marketplace and removes anything you created. You&apos;ll stay signed in.
          </p>
          <Button variant="destructive" onClick={() => setConfirmReset(true)}>
            <RotateCcw /> Reset demo data
          </Button>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset all demo data?"
        description="This restores the original seed data and deletes every job, application, message and contract you created in this browser."
        confirmLabel="Reset demo data"
        destructive
        onConfirm={async () => {
          try {
            await resetDemoData();
            toast.success("Demo data reset to defaults");
            router.refresh();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not reset demo data");
          }
        }}
      />
    </div>
  );
}
