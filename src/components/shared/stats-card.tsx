"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "primary" | "success" | "warning" | "info" | "danger";

const ACCENT_TILE: Record<Accent, string> = {
  primary: "from-indigo-500 to-violet-500 shadow-violet-500/30",
  success: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
  warning: "from-amber-500 to-orange-500 shadow-amber-500/30",
  info: "from-sky-500 to-blue-500 shadow-sky-500/30",
  danger: "from-rose-500 to-red-500 shadow-rose-500/30",
};

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive?: boolean };
  hint?: string;
  href?: string;
  accent?: Accent;
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  href,
  accent = "primary",
  className,
}: StatsCardProps) {
  const positive = trend?.positive ?? true;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;

  const body = (
    <div
      className={cn(
        "relative h-full overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors",
        href && "hover:border-primary/40",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-linear-to-br opacity-[0.07] blur-2xl",
          ACCENT_TILE[accent],
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg",
            ACCENT_TILE[accent],
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
      </div>
      {(trend || hint) && (
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium",
                positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
              )}
            >
              <TrendIcon className="size-3" aria-hidden />
              {trend.value}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={href ? { y: -2 } : undefined}
      className="h-full"
    >
      {href ? (
        <Link href={href} className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {body}
        </Link>
      ) : (
        body
      )}
    </motion.div>
  );
}
