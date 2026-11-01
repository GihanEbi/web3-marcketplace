"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact, formatCurrency } from "@/lib/format";

export interface EarningsDatum {
  name: string;
  released: number;
  inEscrow: number;
  upcoming: number;
}

const ROW_HEIGHT = 44;

/** Stacked horizontal bars per contract (USD-equivalent, mock rates). */
export function EarningsChart({ data }: { data: EarningsDatum[] }) {
  const height = Math.max(150, data.length * ROW_HEIGHT + 56);
  const summary = data
    .map((d) => `${d.name}: ${formatCurrency(d.released, "USD")} released, ${formatCurrency(d.inEscrow, "USD")} in escrow, ${formatCurrency(d.upcoming, "USD")} awaiting funding`)
    .join("; ");

  return (
    <div role="img" aria-label={`Earnings by contract. ${summary}`} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(v: number) => `$${formatCompact(v)}`}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={104}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
            formatter={(value) => formatCurrency(typeof value === "number" ? value : Number(value ?? 0), "USD")}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="released" name="Released" stackId="a" fill="var(--chart-4)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="inEscrow" name="In escrow" stackId="a" fill="var(--chart-2)" />
          <Bar dataKey="upcoming" name="Awaiting funding" stackId="a" fill="var(--chart-1)" fillOpacity={0.45} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
