"use client";

import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants";
import type { ApplicationStatus } from "@/types";

export const STATUS_COLOR: Record<ApplicationStatus, string> = {
  applied: "var(--info)",
  under_review: "var(--warning)",
  shortlisted: "var(--chart-1)",
  interview: "var(--chart-5)",
  offered: "var(--success)",
  hired: "var(--chart-4)",
  rejected: "var(--destructive)",
  withdrawn: "var(--muted-foreground)",
};

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--popover-foreground)",
  fontSize: 12,
  padding: "6px 10px",
} as const;

export interface StatusDatum {
  status: ApplicationStatus;
  count: number;
}

export function StatusDonut({ data }: { data: StatusDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({
    name: APPLICATION_STATUS_LABEL[d.status],
    value: d.count,
    fill: STATUS_COLOR[d.status],
  }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0" role="img" aria-label={`Applications by status, ${total} in total`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={54}
              outerRadius={78}
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "var(--popover-foreground)" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-[11px] text-muted-foreground">applications</span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-1">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[d.status] }} />
            <span className="truncate text-muted-foreground">{APPLICATION_STATUS_LABEL[d.status]}</span>
            <span className="ml-auto font-medium tabular-nums">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface TimeDatum {
  label: string;
  count: number;
}

export function ApplicationsOverTime({ data }: { data: TimeDatum[] }) {
  return (
    <div className="h-44 w-full" role="img" aria-label="Applications submitted per week">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [String(value), "Applications"]}
          />
          <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
