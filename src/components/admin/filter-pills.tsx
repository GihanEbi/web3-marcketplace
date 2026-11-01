"use client";

import { cn } from "@/lib/utils";

export interface FilterPillOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  /** highlight the pill when it needs attention (e.g. pending approvals) */
  attention?: boolean;
}

interface FilterPillsProps<T extends string> {
  options: FilterPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  className?: string;
}

/** Horizontally scrollable group of toggle pills with counts. */
export function FilterPills<T extends string>({ options, value, onChange, className, ...rest }: FilterPillsProps<T>) {
  return (
    <div
      role="group"
      aria-label={rest["aria-label"]}
      className={cn("-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] leading-5 font-semibold tabular-nums",
                  active
                    ? "bg-primary/20 text-primary"
                    : option.attention && option.count > 0
                      ? "bg-warning/20 text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
