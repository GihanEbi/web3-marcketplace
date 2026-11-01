"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminAnalytics } from "@/types";

/* ------------------------------------------------------------------ */
/* Shared chart primitives                                             */
/* ------------------------------------------------------------------ */

const C1 = "var(--chart-1)";
const C2 = "var(--chart-2)";
const C3 = "var(--chart-3)";
const C4 = "var(--chart-4)";
const C5 = "var(--chart-5)";

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 } as const;
const GRID_STROKE = "var(--border)";
const CURSOR_FILL = { fill: "var(--muted)", opacity: 0.45 } as const;
const CURSOR_LINE = { stroke: "var(--border)", strokeWidth: 1 } as const;

interface TooltipEntry {
  name?: string | number;
  value?: unknown;
  color?: string;
  fill?: string;
  payload?: { fill?: string };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: string | number;
  format?: (value: number, name: string) => string;
  /** show a total row (stacked charts) */
  total?: boolean;
}

/** Tooltip themed with popover tokens so it reads in both light and dark mode. */
function ChartTooltip({ active, payload, label, format, total = false }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const rows = payload.map((entry) => ({
    name: String(entry.name ?? ""),
    value: typeof entry.value === "number" ? entry.value : Number(entry.value ?? 0),
    color: entry.color ?? entry.payload?.fill ?? entry.fill ?? C1,
  }));
  const fmt = format ?? ((v: number) => formatNumber(v));
  const sum = rows.reduce((acc, r) => acc + r.value, 0);
  return (
    <div className="min-w-36 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      {label !== undefined && label !== "" && <p className="mb-1.5 font-medium">{label}</p>}
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
              {row.name}
            </span>
            <span className="font-medium tabular-nums">{fmt(row.value, row.name)}</span>
          </li>
        ))}
        {total && rows.length > 1 && (
          <li className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-1.5">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold tabular-nums">{fmt(sum, "Total")}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

export interface LegendItem {
  label: string;
  color: string;
  value?: string;
}

function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.label}
          {item.value && <span className="font-medium text-foreground tabular-nums">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}

interface ChartCardProps {
  title: string;
  description: string;
  /** Text alternative announced to assistive tech (the SVG itself is hidden). */
  summary: string;
  legend?: LegendItem[];
  children: ReactNode;
  className?: string;
  chartClassName?: string;
}

export function ChartCard({
  title,
  description,
  summary,
  legend,
  children,
  className,
  chartClassName,
}: ChartCardProps) {
  return (
    <Card className={cn("card-glow", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <figure className="m-0">
          <figcaption className="sr-only">{summary}</figcaption>
          <div aria-hidden className={cn("h-64 w-full", chartClassName)}>
            {children}
          </div>
          {legend && <Legend items={legend} />}
        </figure>
      </CardContent>
    </Card>
  );
}

function change(first: number, last: number): string {
  if (first === 0) return "n/a";
  const pct = ((last - first) / first) * 100;
  return `${pct >= 0 ? "+" : ""}${formatNumber(pct)}%`;
}

/* ------------------------------------------------------------------ */
/* User growth                                                         */
/* ------------------------------------------------------------------ */

export function UserGrowthChart({ data, className }: { data: AdminAnalytics["userGrowth"]; className?: string }) {
  const first = data[0];
  const last = data[data.length - 1];
  const summary =
    first && last
      ? `User growth, ${first.month} to ${last.month}. Job seekers grew from ${formatNumber(first.seekers)} to ${formatNumber(last.seekers)} (${change(first.seekers, last.seekers)}). Employers grew from ${formatNumber(first.employers)} to ${formatNumber(last.employers)} (${change(first.employers, last.employers)}).`
      : "No user growth data available.";
  return (
    <ChartCard
      title="User growth"
      description="Registered job seekers and employers per month"
      summary={summary}
      className={className}
      legend={[
        { label: "Job seekers", color: C1 },
        { label: "Employers", color: C3 },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} accessibilityLayer={false}>
          <defs>
            <linearGradient id="admin-grad-seekers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C1} stopOpacity={0.45} />
              <stop offset="100%" stopColor={C1} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="admin-grad-employers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C3} stopOpacity={0.45} />
              <stop offset="100%" stopColor={C3} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatCompact(v)}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} cursor={CURSOR_LINE} />
          <Area
            type="monotone"
            dataKey="seekers"
            name="Job seekers"
            stroke={C1}
            strokeWidth={2}
            fill="url(#admin-grad-seekers)"
          />
          <Area
            type="monotone"
            dataKey="employers"
            name="Employers"
            stroke={C3}
            strokeWidth={2}
            fill="url(#admin-grad-employers)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/* Job activity                                                        */
/* ------------------------------------------------------------------ */

export function JobActivityChart({ data, className }: { data: AdminAnalytics["jobActivity"]; className?: string }) {
  const first = data[0];
  const last = data[data.length - 1];
  const summary =
    first && last
      ? `Job activity, ${first.month} to ${last.month}. Monthly job postings rose from ${formatNumber(first.postings)} to ${formatNumber(last.postings)}. Monthly applications rose from ${formatNumber(first.applications)} to ${formatNumber(last.applications)}.`
      : "No job activity data available.";
  return (
    <ChartCard
      title="Job activity"
      description="Postings (bars, left axis) and applications (line, right axis)"
      summary={summary}
      className={className}
      legend={[
        { label: "Job postings", color: C2 },
        { label: "Applications", color: C5 },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: -4, bottom: 0, left: -12 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis yAxisId="left" tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => formatCompact(v)}
          />
          <Tooltip content={<ChartTooltip />} cursor={CURSOR_FILL} />
          <Bar yAxisId="left" dataKey="postings" name="Job postings" fill={C2} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="applications"
            name="Applications"
            stroke={C5}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/* Revenue                                                             */
/* ------------------------------------------------------------------ */

export function RevenueChart({ data, className }: { data: AdminAnalytics["revenue"]; className?: string }) {
  const first = data[0];
  const last = data[data.length - 1];
  const summary =
    first && last
      ? `Monthly revenue, ${first.month} to ${last.month}, stacked by source. Subscriptions grew from ${formatCurrency(first.subscriptions)} to ${formatCurrency(last.subscriptions)}. Transaction fees grew from ${formatCurrency(first.fees)} to ${formatCurrency(last.fees)}. Total in ${last.month}: ${formatCurrency(last.subscriptions + last.fees)}.`
      : "No revenue data available.";
  return (
    <ChartCard
      title="Revenue"
      description="Monthly revenue by source (mock data)"
      summary={summary}
      className={className}
      legend={[
        { label: "Subscriptions", color: C1 },
        { label: "Fees", color: C4 },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => `$${formatCompact(v)}`}
          />
          <Tooltip content={<ChartTooltip total format={(v) => formatCurrency(v)} />} cursor={CURSOR_FILL} />
          <Bar dataKey="subscriptions" name="Subscriptions" stackId="rev" fill={C1} maxBarSize={26} />
          <Bar dataKey="fees" name="Fees" stackId="rev" fill={C4} radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/* Plan distribution (donut)                                           */
/* ------------------------------------------------------------------ */

const PLAN_COLORS = [C3, C1, C5, C2, C4];

export function PlanDistributionChart({
  data,
  className,
}: {
  data: AdminAnalytics["planDistribution"];
  className?: string;
}) {
  const total = data.reduce((acc, d) => acc + d.users, 0);
  const slices = data.map((d, i) => ({ ...d, fill: PLAN_COLORS[i % PLAN_COLORS.length] }));
  const pct = (n: number) => (total === 0 ? "0%" : `${Math.round((n / total) * 100)}%`);
  const summary = `Plan distribution across ${formatNumber(total)} users: ${data
    .map((d) => `${d.plan} ${formatNumber(d.users)} (${pct(d.users)})`)
    .join(", ")}.`;
  return (
    <ChartCard
      title="Plan distribution"
      description="Users by subscription plan (mock data)"
      summary={summary}
      className={className}
      legend={slices.map((s) => ({
        label: s.plan,
        color: s.fill,
        value: `${formatNumber(s.users)} · ${pct(s.users)}`,
      }))}
    >
      <div className="relative size-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer={false}>
            <Tooltip content={<ChartTooltip format={(v) => `${formatNumber(v)} users`} />} />
            <Pie
              data={slices}
              dataKey="users"
              nameKey="plan"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-semibold tabular-nums">{formatCompact(total)}</span>
          <span className="text-xs text-muted-foreground">total users</span>
        </div>
      </div>
    </ChartCard>
  );
}
