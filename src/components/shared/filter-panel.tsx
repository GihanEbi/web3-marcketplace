"use client";

import type { ReactNode } from "react";
import { ChevronDown, ListFilter, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* FilterPanel + FilterSection                                         */
/* ------------------------------------------------------------------ */

interface FilterPanelProps {
  title?: string;
  activeCount?: number;
  onReset?: () => void;
  children: ReactNode;
  className?: string;
}

export function FilterPanel({ title = "Filters", activeCount = 0, onReset, children, className }: FilterPanelProps) {
  return (
    <aside aria-label={title} className={cn("rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold">
          <ListFilter className="size-4 text-primary" aria-hidden />
          {title}
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </h2>
        {onReset && (
          <Button variant="ghost" size="xs" onClick={onReset} disabled={activeCount === 0}>
            <RotateCcw aria-hidden />
            Reset
          </Button>
        )}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </aside>
  );
}

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function FilterSection({ title, defaultOpen = true, children, className }: FilterSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("px-4", className)}>
      <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between gap-2 rounded-md py-3 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
        {title}
        <ChevronDown
          className="size-4 text-muted-foreground transition-transform duration-200 group-data-panel-open/trigger:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0">
        <div className="space-y-2 pt-0.5 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ------------------------------------------------------------------ */
/* CheckboxGroup                                                       */
/* ------------------------------------------------------------------ */

interface CheckboxOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface CheckboxGroupProps<T extends string> {
  options: readonly T[] | readonly CheckboxOption<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  className?: string;
}

function normaliseOptions<T extends string>(options: readonly T[] | readonly CheckboxOption<T>[]): CheckboxOption<T>[] {
  return options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
}

export function CheckboxGroup<T extends string>({ options, value, onChange, className }: CheckboxGroupProps<T>) {
  const items = normaliseOptions(options);

  function toggle(optionValue: T, checked: boolean) {
    const without = value.filter((v) => v !== optionValue);
    onChange(checked ? [...without, optionValue] : without);
  }

  return (
    <div role="group" className={cn("space-y-1", className)}>
      {items.map((option) => {
        const checked = value.includes(option.value);
        return (
          <label
            key={option.value}
            className="-mx-1.5 flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm transition-colors hover:bg-muted/60"
          >
            <Checkbox checked={checked} onCheckedChange={(next) => toggle(option.value, next)} />
            <span className={cn("min-w-0 flex-1 truncate", checked ? "font-medium text-foreground" : "text-muted-foreground")}>
              {option.label}
            </span>
            {option.count !== undefined && (
              <span className="text-xs text-muted-foreground tabular-nums">{option.count}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ActiveFilterChips                                                   */
/* ------------------------------------------------------------------ */

interface ActiveFilterChipsProps {
  chips: { key: string; label: string }[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilterChips({ chips, onRemove, onClearAll, className }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Active filters" role="group">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex h-7 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 pr-1 pl-3 text-xs font-medium text-primary"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove filter ${chip.label}`}
            className="inline-flex size-5 items-center justify-center rounded-full outline-none hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      <Button variant="ghost" size="xs" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MobileFilterSheet                                                   */
/* ------------------------------------------------------------------ */

interface MobileFilterSheetProps {
  activeCount: number;
  children: ReactNode;
  title?: string;
  className?: string;
}

/** "Filters (n)" button that opens a left sheet. Only visible below the `lg` breakpoint. */
export function MobileFilterSheet({ activeCount, children, title = "Filters", className }: MobileFilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" className={cn("lg:hidden", className)} />}>
        <ListFilter aria-hidden />
        {title}
        {activeCount > 0 ? ` (${activeCount})` : ""}
      </SheetTrigger>
      <SheetContent side="left" className="w-[88%] max-w-sm gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Refine the results shown on the page.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
