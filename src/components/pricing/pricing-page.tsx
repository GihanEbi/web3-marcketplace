"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Crown, Minus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { upgradePlan } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser, useHydrated } from "@/store/hooks";
import type { PlanConfig, PlanId } from "@/types";

type Cell = boolean | string;

const COMPARISON: { feature: string; free: Cell; professional: Cell; business: Cell }[] = [
  { feature: "Basic profile", free: true, professional: true, business: true },
  { feature: "Job search", free: true, professional: true, business: true },
  { feature: "Applications", free: true, professional: true, business: false },
  { feature: "Limited AI assistance", free: true, professional: true, business: true },
  { feature: "Advanced AI assistance", free: false, professional: true, business: false },
  { feature: "Resume analysis", free: false, professional: true, business: false },
  { feature: "Professional tools", free: false, professional: true, business: false },
  { feature: "Application insights", free: false, professional: true, business: false },
  { feature: "Job posting management", free: false, professional: false, business: true },
  { feature: "Recruitment dashboard", free: false, professional: false, business: true },
  { feature: "Applicant tracking", free: false, professional: false, business: true },
  { feature: "AI recruitment tools", free: false, professional: false, business: true },
  { feature: "Candidate discovery", free: false, professional: false, business: true },
];

const AUDIENCE: Record<PlanId, string> = {
  free: "For job seekers getting started",
  professional: "For serious job seekers & freelancers",
  business: "For employers & hiring teams",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is any real payment processed?",
    a: "No. Chainhire is a frontend demo. Upgrading opens a simulated checkout, no card, wallet or bank is ever charged, and nothing leaves your browser.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Yes. Upgrade, downgrade or return to the Free plan whenever you like. In this demo the change is applied instantly and stored locally.",
  },
  {
    q: "What does the annual discount include?",
    a: "Billing annually saves 20% compared with paying month to month. The toggle on this page shows the effective monthly price for illustration.",
  },
  {
    q: "Which plan do hiring teams need?",
    a: "Employers should choose the Business plan, which unlocks job posting management, the recruitment dashboard, applicant tracking, AI recruitment tools and candidate discovery.",
  },
  {
    q: "Can I get paid in crypto on the Free plan?",
    a: "Yes. Wallet connection, bounties, freelance projects and escrow-backed contracts are available to every account regardless of plan.",
  },
];

function CellValue({ value }: { value: Cell }) {
  if (typeof value === "string") return <span className="text-sm font-medium">{value}</span>;
  return value ? (
    <Check className="mx-auto size-4 text-success" aria-label="Included" />
  ) : (
    <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Not included" />
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <Collapsible className="rounded-xl border border-border bg-card">
      <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between gap-3 rounded-xl p-4 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:text-base">
        {q}
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-panel-open/trigger:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0">
        <p className="px-4 pb-4 text-sm text-pretty text-muted-foreground">{a}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PricingPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const plansRaw = useAppStore((s) => s.adminSettings.plans);
  const subscriptions = useAppStore((s) => s.subscriptions);

  const [annual, setAnnual] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanConfig | null>(null);

  const plans = useMemo(() => {
    const order: PlanId[] = ["free", "professional", "business"];
    return [...plansRaw].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [plansRaw]);
  const subscription = useMemo(() => subscriptions.find((s) => s.userId === user?.id), [subscriptions, user]);
  const currentPlan = user?.plan;

  function priceFor(plan: PlanConfig): number {
    return annual ? Math.round(plan.priceMonthly * 0.8 * 100) / 100 : plan.priceMonthly;
  }

  async function confirmCheckout() {
    if (!user || !checkoutPlan) return;
    const plan = checkoutPlan;
    try {
      await upgradePlan(user.id, plan.id);
      toast.success(plan.id === "free" ? "Switched to the Free plan" : `You're now on ${plan.name}`, {
        description: "Simulated checkout, no payment was processed.",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't change your plan");
    }
  }

  const recommended = plans.find((p) => p.highlighted)?.id ?? "professional";

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="relative container mx-auto px-4 py-14 text-center sm:py-20">
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">Pricing</p>
          <h1 className="mx-auto mt-2 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Simple plans for <span className="gradient-text">talent and teams</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            Start free, upgrade when you need advanced AI tools or a full recruitment suite. Every checkout on this page is simulated.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2">
            <span className={cn("text-sm font-medium", !annual ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
            <Switch aria-label="Bill annually" checked={annual} onCheckedChange={setAnnual} />
            <span className={cn("text-sm font-medium", annual ? "text-foreground" : "text-muted-foreground")}>Annual</span>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">Save 20%</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto space-y-16 px-4 py-12">
        {!hydrated ? (
          <LoadingSkeleton variant="card" count={3} />
        ) : (
          <>
            {user && (
              <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="size-5 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">
                      You&apos;re on the {plans.find((p) => p.id === currentPlan)?.name ?? currentPlan} plan
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subscription
                        ? `Renews ${formatDate(subscription.renewsAt)} · ${formatCurrency(subscription.amountMonthly)}/month`
                        : "No active paid subscription"}
                    </p>
                  </div>
                </div>
                {subscription && <StatusBadge status={subscription.status} />}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
              {plans.map((plan) => {
                const isCurrent = currentPlan === plan.id;
                const isRecommended = plan.id === recommended;
                const price = priceFor(plan);
                return (
                  <article
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-2xl border bg-card p-6",
                      isRecommended ? "border-primary/50 card-glow lg:-my-3 lg:py-9" : "border-border",
                    )}
                  >
                    {isRecommended && (
                      <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full gradient-brand px-3 py-1 text-xs font-semibold text-white shadow-lg">
                        <Sparkles className="size-3" aria-hidden />
                        Most popular
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-heading text-xl font-semibold">{plan.name}</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">{AUDIENCE[plan.id]}</p>
                      </div>
                      {isCurrent && (
                        <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">Current plan</span>
                      )}
                    </div>
                    <p className="mt-5 flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-bold tracking-tight tabular-nums">{formatCurrency(price, "USD", price % 1 ? 2 : 0)}</span>
                      <span className="text-sm text-muted-foreground">/ month</span>
                    </p>
                    <p className="h-5 text-xs text-muted-foreground">
                      {plan.priceMonthly === 0
                        ? "Free forever"
                        : annual
                          ? `Billed ${formatCurrency(price * 12, "USD", 0)} per year`
                          : "Billed monthly"}
                    </p>
                    <p className="mt-3 text-sm text-pretty text-muted-foreground">{plan.description}</p>

                    <div className="mt-6">
                      {!user ? (
                        <Link
                          href="/register"
                          className={cn(buttonVariants({ variant: isRecommended ? "gradient" : "outline", size: "lg" }), "w-full")}
                        >
                          {plan.priceMonthly === 0 ? "Get started free" : `Choose ${plan.name}`}
                        </Link>
                      ) : isCurrent ? (
                        <Button size="lg" variant="secondary" className="w-full" disabled>
                          <Check aria-hidden />
                          Current plan
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant={isRecommended ? "gradient" : "outline"}
                          className="w-full"
                          onClick={() => setCheckoutPlan(plan)}
                        >
                          {plan.priceMonthly === 0 ? "Switch to Free" : `Upgrade to ${plan.name}`}
                        </Button>
                      )}
                    </div>

                    <ul className="mt-6 flex-1 space-y-2.5 border-t border-border pt-6">
                      {plan.id !== "free" && <li className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Everything in Free, plus</li>}
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                          <span className="text-pretty">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>

            <section aria-labelledby="compare-plans" className="space-y-6">
              <div className="text-center">
                <h2 id="compare-plans" className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Compare every feature
                </h2>
                <p className="mt-2 text-muted-foreground">See exactly what each plan unlocks.</p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th scope="col" className="px-4 py-3 font-medium">
                        Feature
                      </th>
                      {plans.map((p) => (
                        <th key={p.id} scope="col" className={cn("px-4 py-3 text-center font-semibold", p.id === recommended && "text-primary")}>
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row) => (
                      <tr key={row.feature} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <th scope="row" className="px-4 py-3 font-medium">
                          {row.feature}
                        </th>
                        {plans.map((p) => (
                          <td key={p.id} className="px-4 py-3 text-center">
                            <CellValue value={row[p.id]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <section aria-labelledby="faq" className="mx-auto max-w-3xl space-y-6">
          <div className="text-center">
            <h2 id="faq" className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </section>
      </div>

      <ConfirmationDialog
        open={checkoutPlan !== null}
        onOpenChange={(open) => {
          if (!open) setCheckoutPlan(null);
        }}
        title="Simulated checkout"
        description={
          checkoutPlan ? (
            <>
              You&apos;re switching to <strong>{checkoutPlan.name}</strong> at{" "}
              <strong>
                {formatCurrency(priceFor(checkoutPlan), "USD", priceFor(checkoutPlan) % 1 ? 2 : 0)}/month
              </strong>
              {annual && checkoutPlan.priceMonthly > 0 ? " (billed annually)" : ""}. This is a demo: no payment is processed and no card or wallet is
              charged.
            </>
          ) : null
        }
        confirmLabel={checkoutPlan?.priceMonthly === 0 ? "Confirm switch" : "Confirm (no charge)"}
        onConfirm={confirmCheckout}
      />
    </div>
  );
}
