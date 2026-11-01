"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { JobPerformance, PipelinePoint, WeeklyPoint } from "./use-employer-data";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const TICK = { fill: "var(--muted-foreground)", fontSize: 12 };

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--popover-foreground)",
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.35)",
} as const;
const TOOLTIP_LABEL = { color: "var(--popover-foreground)", fontWeight: 600, marginBottom: 2 } as const;
const TOOLTIP_ITEM = { color: "var(--popover-foreground)", padding: 0 } as const;

interface ChartCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <header className="mb-4">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}

function NoData({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function ApplicationsOverTimeChart({ data }: { data: WeeklyPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.applications, 0);
  if (total === 0) return <NoData message="No applications in the last 8 weeks." />;
  return (
    <div
      role="img"
      aria-label={`Applications per week over the last 8 weeks: ${data.map((d) => `${d.label} ${d.applications}`).join(", ")}`}
      className="h-[260px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="emp-apps-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL}
            itemStyle={TOOLTIP_ITEM}
            cursor={{ stroke: "var(--border)" }}
            labelFormatter={(label) => `Week ending ${String(label)}`}
          />
          <Area
            type="monotone"
            dataKey="applications"
            name="Applications"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            fill="url(#emp-apps-fill)"
            dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PipelineChart({ data }: { data: PipelinePoint[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return <NoData message="No applications in your pipeline yet." />;
  return (
    <div
      role="img"
      aria-label={`Recruitment pipeline: ${data.map((d) => `${d.label} ${d.count}`).join(", ")}`}
      className="h-[260px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 0, left: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="label" tick={TICK} tickLine={false} axisLine={false} width={84} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL}
            itemStyle={TOOLTIP_ITEM}
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          />
          <Bar dataKey="count" name="Applications" radius={[0, 6, 6, 0]} barSize={22}>
            {data.map((d, i) => (
              <Cell key={d.status} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
            <LabelList dataKey="count" position="right" fill="var(--foreground)" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function TopJobsChart({ data }: { data: JobPerformance[] }) {
  const rows = data.slice(0, 5).map((p) => ({ id: p.job.id, title: truncate(p.job.title, 22), full: p.job.title, applications: p.applications }));
  if (rows.length === 0) return <NoData message="Publish a job to see its performance." />;
  return (
    <div
      role="img"
      aria-label={`Applications per job: ${rows.map((r) => `${r.full} ${r.applications}`).join(", ")}`}
      className="h-[260px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 28, bottom: 0, left: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="title" tick={TICK} tickLine={false} axisLine={false} width={130} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL}
            itemStyle={TOOLTIP_ITEM}
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            labelFormatter={(_, payload) => String(payload?.[0]?.payload?.full ?? "")}
          />
          <Bar dataKey="applications" name="Applications" radius={[0, 6, 6, 0]} barSize={20}>
            {rows.map((r, i) => (
              <Cell key={r.id} fill={CHART_COLORS[(i + 1) % CHART_COLORS.length]} />
            ))}
            <LabelList dataKey="applications" position="right" fill="var(--foreground)" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
