"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FilterPanel, MobileFilterSheet } from "@/components/shared/filter-panel";
import { SkillTag } from "@/components/shared/skill-tag";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Grid / list view toggle                                             */
/* ------------------------------------------------------------------ */

export type BrowseView = "grid" | "list";

export function ViewToggle({
  value,
  onChange,
  className,
}: {
  value: BrowseView;
  onChange: (next: BrowseView) => void;
  className?: string;
}) {
  const items: { id: BrowseView; label: string; icon: typeof List }[] = [
    { id: "grid", label: "Grid view", icon: LayoutGrid },
    { id: "list", label: "List view", icon: List },
  ];
  return (
    <div role="group" aria-label="Layout" className={cn("inline-flex rounded-lg border border-border bg-card p-0.5", className)}>
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            value === id ? "bg-primary/15 text-primary" : "hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Switch row                                                          */
/* ------------------------------------------------------------------ */

export function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer text-sm">
        <span className="block font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={(next) => onCheckedChange(next)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Searchable multi-select of skills                                   */
/* ------------------------------------------------------------------ */

export interface SkillOption {
  skill: string;
  count: number;
}

export function SkillFilter({
  options,
  selected,
  onToggle,
  limit = 12,
}: {
  options: SkillOption[];
  selected: string[];
  onToggle: (skill: string) => void;
  limit?: number;
}) {
  const [search, setSearch] = useState("");
  const inputId = useId();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const pool = options.filter((o) => !selected.includes(o.skill) && (!term || o.skill.toLowerCase().includes(term)));
    return pool.slice(0, term ? 24 : limit);
  }, [options, selected, search, limit]);

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={inputId} className="sr-only">
          Search skills
        </label>
        <Input id={inputId} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills…" className="h-8" />
      </div>
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Selected skills">
          {selected.map((skill) => (
            <li key={skill}>
              <SkillTag skill={skill} active onRemove={() => onToggle(skill)} />
            </li>
          ))}
        </ul>
      )}
      {visible.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Available skills">
          {visible.map((o) => (
            <li key={o.skill}>
              <SkillTag skill={`${o.skill} · ${o.count}`} onClick={() => onToggle(o.skill)} variant="outline" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No skills match &quot;{search}&quot;.</p>
      )}
    </div>
  );
}

/** Count how often each skill appears in a list of items, most common first. */
export function countSkills(lists: string[][]): SkillOption[] {
  const map = new Map<string, number>();
  for (const skills of lists) for (const s of skills) map.set(s, (map.get(s) ?? 0) + 1);
  return [...map.entries()].map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
}

/** Tally helper: how many items fall under each key. */
export function tally<T>(items: T[], keyOf: (item: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = keyOf(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Two-column browse layout (sticky filters on desktop, sheet on mobile) */
/* ------------------------------------------------------------------ */

export function BrowseShell({
  panel,
  activeCount,
  onReset,
  search,
  sort,
  children,
}: {
  panel: ReactNode;
  activeCount: number;
  onReset: () => void;
  search: ReactNode;
  sort: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
      <div className="hidden lg:sticky lg:top-20 lg:block">
        <FilterPanel activeCount={activeCount} onReset={onReset} className="max-h-[calc(100dvh-6rem)] overflow-y-auto scrollbar-thin">
          {panel}
        </FilterPanel>
      </div>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:flex-1">{search}</div>
          <div className="flex items-center gap-2">
            <MobileFilterSheet activeCount={activeCount}>
              <div className="-mx-4 -my-4">
                <FilterPanel activeCount={activeCount} onReset={onReset} className="rounded-none border-0">
                  {panel}
                </FilterPanel>
              </div>
            </MobileFilterSheet>
            {sort}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
