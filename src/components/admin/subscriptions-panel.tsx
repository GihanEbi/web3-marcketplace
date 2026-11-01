"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleDollarSign, CreditCard, Repeat, Settings, TrendingDown, Users, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SelectField } from "@/components/shared/select-field";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import type { PlanId, Subscription, User } from "@/types";
import { PlanBadge } from "./admin-badges";
import { PlanDistributionChart, RevenueChart } from "./admin-charts";

/** Mock monthly churn shown in the stat card (the demo has no cancellation history). */
const MOCK_MONTHLY_CHURN_PCT = 2.4;

interface SubRow {
  subscription: Subscription;
  user: User | undefined;
}

export function SubscriptionsPanel() {
  const hydrated = useHydrated();
  const analytics = useAppStore((s) => s.adminAnalytics);
  const plans = useAppStore((s) => s.adminSettings.plans);
  const subscriptions = useAppStore((s) => s.subscriptions);
  const users = useAppStore((s) => s.users);
  const [planFilter, setPlanFilter] = useState<"all" | PlanId>("all");

  const metrics = useMemo(() => {
    const paying = analytics.planDistribution
      .filter((p) => p.plan.toLowerCase() !== "free")
      .reduce((n, p) => n + p.users, 0);
    const revenue = analytics.revenue;
    const last = revenue[revenue.length - 1];
    const prev = revenue[revenue.length - 2];
    const growth =
      last && prev && prev.subscriptions > 0
        ? ((last.subscriptions - prev.subscriptions) / prev.subscriptions) * 100
        : 0;
    return {
      mrr: analytics.mrr,
      arr: analytics.mrr * 12,
      paying,
      arpu: paying > 0 ? analytics.mrr / paying : 0,
      growth,
    };
  }, [analytics]);

  const rows = useMemo<SubRow[]>(() => {
    const userById = new Map(users.map((u) => [u.id, u]));
    return subscriptions.map((subscription) => ({ subscription, user: userById.get(subscription.userId) }));
  }, [subscriptions, users]);

  const planStats = useMemo(
    () =>
      plans.map((plan) => {
        const modelled = analytics.planDistribution.find(
          (p) => p.plan.toLowerCase() === plan.name.toLowerCase() || p.plan.toLowerCase() === plan.id,
        );
        const demoAccounts = users.filter((u) => u.plan === plan.id).length;
        const subscribers = modelled?.users ?? demoAccounts;
        return { plan, subscribers, demoAccounts, monthly: subscribers * plan.priceMonthly };
      }),
    [plans, analytics, users],
  );

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => planFilter === "all" || r.subscription.plan === planFilter)
        .sort((a, b) => Date.parse(a.subscription.renewsAt) - Date.parse(b.subscription.renewsAt)),
    [rows, planFilter],
  );

  const columns: DataTableColumn<SubRow>[] = [
    {
      key: "user",
      header: "Subscriber",
      sortValue: (r) => r.user?.name ?? r.subscription.userId,
      cell: ({ user, subscription }) => (
        <div className="flex min-w-48 items-center gap-3">
          <UserAvatar name={user?.name ?? "Unknown"} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{user?.name ?? subscription.userId}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? "Account removed"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      sortValue: (r) => r.subscription.plan,
      cell: (r) => <PlanBadge plan={r.subscription.plan} />,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.subscription.status,
      cell: (r) => <StatusBadge status={r.subscription.status} />,
    },
    {
      key: "amount",
      header: "Amount",
      sortValue: (r) => r.subscription.amountMonthly,
      className: "tabular-nums whitespace-nowrap",
      cell: (r) => (r.subscription.amountMonthly > 0 ? `${formatCurrency(r.subscription.amountMonthly)} / mo` : "Free"),
    },
    {
      key: "renews",
      header: "Renews",
      sortValue: (r) => Date.parse(r.subscription.renewsAt),
      cell: (r) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {r.subscription.status === "cancelled" ? "Ends " : ""}
          {formatDate(r.subscription.renewsAt)}
        </span>
      ),
    },
  ];

  if (!hydrated) return <LoadingSkeleton variant="page" />;

  const planOptions = [
    { value: "all", label: `All plans (${subscriptions.length})` },
    ...plans.map((p) => ({
      value: p.id,
      label: `${p.name} (${subscriptions.filter((s) => s.plan === p.id).length})`,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Subscriptions & revenue"
        description="Recurring revenue, plan mix and demo subscribers. Financial figures are mock analytics."
        actions={
          <Link href="/admin/settings#plans" className={buttonVariants({ variant: "gradient", size: "sm" })}>
            <Settings aria-hidden />
            Configure plans
          </Link>
        }
      />

      <section aria-label="Revenue metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard
          label="MRR"
          value={formatCurrency(metrics.mrr)}
          icon={CircleDollarSign}
          accent="success"
          trend={{
            value: `${metrics.growth >= 0 ? "+" : ""}${metrics.growth.toFixed(1)}%`,
            positive: metrics.growth >= 0,
          }}
          hint="vs last month"
        />
        <StatsCard label="ARR" value={formatCurrency(metrics.arr)} icon={Wallet} accent="primary" hint="MRR × 12" />
        <StatsCard
          label="Paying subscribers"
          value={formatNumber(metrics.paying)}
          icon={Users}
          accent="info"
          hint="Professional + Business"
        />
        <StatsCard
          label="Monthly churn"
          value={`${MOCK_MONTHLY_CHURN_PCT}%`}
          icon={TrendingDown}
          accent="warning"
          hint="Mock figure"
        />
        <StatsCard
          label="ARPU"
          value={formatCurrency(metrics.arpu, "USD", 2)}
          icon={Repeat}
          accent="primary"
          hint="Per paying subscriber"
        />
      </section>

      <section aria-label="Revenue charts" className="grid gap-6 lg:grid-cols-3">
        <RevenueChart data={analytics.revenue} className="lg:col-span-2" />
        <PlanDistributionChart data={analytics.planDistribution} />
      </section>

      <section aria-labelledby="plans-heading" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="plans-heading" className="font-heading text-lg font-semibold">
              Plans
            </h2>
            <p className="text-sm text-muted-foreground">Pricing and subscriber counts per plan.</p>
          </div>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {planStats.map(({ plan, subscribers, demoAccounts, monthly }, index) => (
            <motion.li
              key={plan.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
            >
              <Card className={cn("h-full", plan.highlighted && "ring-2 ring-primary/50")}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <CreditCard className="size-4 text-primary" aria-hidden />
                      {plan.name}
                    </span>
                    {plan.highlighted && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        Highlighted
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="font-heading text-3xl font-semibold tabular-nums">
                    {plan.priceMonthly === 0 ? "Free" : formatCurrency(plan.priceMonthly)}
                    {plan.priceMonthly > 0 && (
                      <span className="text-sm font-normal text-muted-foreground"> / month</span>
                    )}
                  </p>
                  <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                    <div>
                      <dt className="text-[11px] text-muted-foreground">Subscribers (modelled)</dt>
                      <dd className="font-semibold tabular-nums">{formatNumber(subscribers)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-foreground">Monthly revenue</dt>
                      <dd className="font-semibold tabular-nums">{formatCurrency(monthly)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[11px] text-muted-foreground">Demo accounts on this plan</dt>
                      <dd className="font-semibold tabular-nums">{demoAccounts}</dd>
                    </div>
                  </dl>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="subs-heading" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="subs-heading" className="font-heading text-lg font-semibold">
              Demo subscriptions
            </h2>
            <p className="text-sm text-muted-foreground">Live subscriptions in this browser&apos;s demo data.</p>
          </div>
          <SelectField
            value={planFilter}
            onChange={(v) => setPlanFilter(v as "all" | PlanId)}
            options={planOptions}
            aria-label="Filter subscriptions by plan"
            className="sm:w-52"
          />
        </div>
        <DataTable
          caption="Subscriptions"
          columns={columns}
          data={filtered}
          rowKey={(r) => r.subscription.userId}
          pageSize={8}
          emptyState={
            <EmptyState
              icon={CreditCard}
              title="No subscriptions on this plan"
              description="Upgrades from the pricing page appear here instantly."
            />
          }
        />
      </section>
    </div>
  );
}
