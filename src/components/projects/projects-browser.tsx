"use client";

import { useMemo, useState } from "react";
import { FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveFilterChips, CheckboxGroup, FilterSection } from "@/components/shared/filter-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ProjectCard } from "@/components/shared/project-card";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { BrowseShell, SkillFilter, countSkills, tally } from "@/components/jobs/browse-controls";
import { BLOCKCHAINS, PAYMENT_TOKENS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import type { Blockchain, FreelanceProject, PaymentToken } from "@/types";

const PAGE_SIZE = 9;

type BudgetType = FreelanceProject["budgetType"];
type DurationBand = "" | "short" | "medium" | "long";
type StatusFilter = "open" | "in_progress" | "all";
type ProjectSort = "newest" | "budget" | "duration";

interface ProjectFilters {
  query: string;
  skills: string[];
  budgetTypes: BudgetType[];
  currencies: PaymentToken[];
  chains: Blockchain[];
  duration: DurationBand;
  status: StatusFilter;
  sort: ProjectSort;
}

const DEFAULTS: ProjectFilters = {
  query: "",
  skills: [],
  budgetTypes: [],
  currencies: [],
  chains: [],
  duration: "",
  status: "open",
  sort: "newest",
};

const USD_RATE: Record<PaymentToken, number> = { USD: 1, USDC: 1, DAI: 1, ETH: 3200, MATIC: 0.7, SOL: 160 };
const DURATION_LABEL: Record<Exclude<DurationBand, "">, string> = {
  short: "Under 4 weeks",
  medium: "4–8 weeks",
  long: "More than 8 weeks",
};

function inBand(weeks: number, band: DurationBand): boolean {
  if (band === "short") return weeks < 4;
  if (band === "medium") return weeks >= 4 && weeks <= 8;
  if (band === "long") return weeks > 8;
  return true;
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function activeCountOf(f: ProjectFilters): number {
  return (
    (f.query ? 1 : 0) +
    f.skills.length +
    f.budgetTypes.length +
    f.currencies.length +
    f.chains.length +
    (f.duration ? 1 : 0) +
    (f.status !== "open" ? 1 : 0)
  );
}

export function ProjectsBrowser() {
  const hydrated = useHydrated();
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);

  const [filters, setFilters] = useState<ProjectFilters>(DEFAULTS);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Public catalogue: open projects plus ones already filled (in progress). Drafts, completed and closed stay hidden.
  const catalogue = useMemo(
    () =>
      projects.filter((p) => {
        if (p.status !== "open" && p.status !== "in_progress") return false;
        return !companies.find((c) => c.id === p.clientCompanyId)?.suspended;
      }),
    [projects, companies],
  );

  const results = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "";
    const list = catalogue.filter((p) => {
      if (filters.status !== "all" && p.status !== filters.status) return false;
      if (q) {
        const haystack = [p.title, p.description, companyName(p.clientCompanyId), ...p.skills].join(" ").toLowerCase();
        if (!q.split(/\s+/).every((t) => haystack.includes(t))) return false;
      }
      if (filters.skills.length && !filters.skills.every((s) => p.skills.some((ps) => ps.toLowerCase() === s.toLowerCase()))) return false;
      if (filters.budgetTypes.length && !filters.budgetTypes.includes(p.budgetType)) return false;
      if (filters.currencies.length && !filters.currencies.includes(p.currency)) return false;
      if (filters.chains.length && !filters.chains.includes(p.blockchain)) return false;
      if (!inBand(p.durationWeeks, filters.duration)) return false;
      return true;
    });
    const sorted = [...list];
    if (filters.sort === "budget") sorted.sort((a, b) => b.budgetMax * USD_RATE[b.currency] - a.budgetMax * USD_RATE[a.currency]);
    else if (filters.sort === "duration") sorted.sort((a, b) => a.durationWeeks - b.durationWeeks);
    else sorted.sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
    return sorted;
  }, [catalogue, companies, filters]);

  const counts = useMemo(
    () => ({
      type: tally(catalogue, (p) => p.budgetType),
      currency: tally(catalogue, (p) => p.currency),
      chain: tally(catalogue, (p) => p.blockchain),
    }),
    [catalogue],
  );
  const skillOptions = useMemo(() => countSkills(catalogue.map((p) => p.skills)), [catalogue]);

  function update(patch: Partial<ProjectFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setVisible(PAGE_SIZE);
  }
  function reset() {
    setFilters({ ...DEFAULTS, sort: filters.sort });
    setVisible(PAGE_SIZE);
  }

  const chips = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (filters.query) list.push({ key: "query", label: `“${filters.query}”` });
    filters.skills.forEach((s) => list.push({ key: `skill:${s}`, label: s }));
    filters.budgetTypes.forEach((b) => list.push({ key: `type:${b}`, label: b === "fixed" ? "Fixed price" : "Hourly" }));
    filters.currencies.forEach((c) => list.push({ key: `cur:${c}`, label: c }));
    filters.chains.forEach((c) => list.push({ key: `chain:${c}`, label: c }));
    if (filters.duration) list.push({ key: "duration", label: DURATION_LABEL[filters.duration] });
    if (filters.status !== "open") list.push({ key: "status", label: filters.status === "all" ? "Open + filled" : "Filled" });
    return list;
  }, [filters]);

  function removeChip(key: string) {
    const [kind, ...rest] = key.split(":");
    const value = rest.join(":");
    if (kind === "query") update({ query: "" });
    else if (kind === "skill") update({ skills: filters.skills.filter((s) => s !== value) });
    else if (kind === "type") update({ budgetTypes: filters.budgetTypes.filter((b) => b !== value) });
    else if (kind === "cur") update({ currencies: filters.currencies.filter((c) => c !== value) });
    else if (kind === "chain") update({ chains: filters.chains.filter((c) => c !== value) });
    else if (kind === "duration") update({ duration: "" });
    else if (kind === "status") update({ status: "open" });
  }

  if (!hydrated) return <LoadingSkeleton variant="card" />;

  const activeCount = activeCountOf(filters);
  const shown = results.slice(0, visible);
  const remaining = results.length - shown.length;

  const panel = (
    <>
      <FilterSection title="Status">
        <SelectField
          aria-label="Project status"
          value={filters.status}
          onChange={(status) => update({ status: status as StatusFilter })}
          options={[
            { value: "open", label: "Open for proposals" },
            { value: "in_progress", label: "Filled (in progress)" },
            { value: "all", label: "Open + filled" },
          ]}
        />
      </FilterSection>
      <FilterSection title="Budget type">
        <CheckboxGroup<BudgetType>
          options={[
            { value: "fixed" as BudgetType, label: "Fixed price", count: counts.type.get("fixed") ?? 0 },
            { value: "hourly" as BudgetType, label: "Hourly", count: counts.type.get("hourly") ?? 0 },
          ]}
          value={filters.budgetTypes}
          onChange={(budgetTypes) => update({ budgetTypes })}
        />
      </FilterSection>
      <FilterSection title="Payment currency">
        <CheckboxGroup<PaymentToken>
          options={PAYMENT_TOKENS.map((t) => ({ value: t, label: t, count: counts.currency.get(t) ?? 0 }))}
          value={filters.currencies}
          onChange={(currencies) => update({ currencies })}
        />
      </FilterSection>
      <FilterSection title="Duration">
        <SelectField
          aria-label="Duration"
          value={filters.duration}
          onChange={(duration) => update({ duration: duration as DurationBand })}
          options={[
            { value: "", label: "Any duration" },
            { value: "short", label: DURATION_LABEL.short },
            { value: "medium", label: DURATION_LABEL.medium },
            { value: "long", label: DURATION_LABEL.long },
          ]}
        />
      </FilterSection>
      <FilterSection title="Blockchain" defaultOpen={false}>
        <CheckboxGroup<Blockchain>
          options={BLOCKCHAINS.map((b) => ({ value: b, label: b, count: counts.chain.get(b) ?? 0 }))}
          value={filters.chains}
          onChange={(chains) => update({ chains })}
        />
      </FilterSection>
      <FilterSection title="Skills" defaultOpen={false}>
        <SkillFilter options={skillOptions} selected={filters.skills} onToggle={(s) => update({ skills: toggle(filters.skills, s) })} />
      </FilterSection>
    </>
  );

  return (
    <BrowseShell
      panel={panel}
      activeCount={activeCount}
      onReset={reset}
      search={
        <SearchInput
          value={filters.query}
          onChange={(query) => update({ query })}
          placeholder="Search projects by title, skill or client…"
          aria-label="Search projects"
          debounceMs={200}
        />
      }
      sort={
        <SelectField
          aria-label="Sort projects"
          value={filters.sort}
          onChange={(sort) => update({ sort: sort as ProjectSort })}
          className="w-44"
          options={[
            { value: "newest", label: "Newest first" },
            { value: "budget", label: "Budget: high to low" },
            { value: "duration", label: "Shortest duration" },
          ]}
        />
      }
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground tabular-nums">{formatNumber(results.length)}</span>{" "}
        {results.length === 1 ? "project" : "projects"} found
      </p>
      <ActiveFilterChips chips={chips} onRemove={removeChip} onClearAll={reset} />

      {results.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title="No projects match your filters"
          description="Try widening the budget type, currency or duration, or clear all filters."
          action={
            activeCount > 0 ? (
              <Button variant="outline" onClick={reset}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {shown.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          {remaining > 0 && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load more projects
              </Button>
              <p className="text-xs text-muted-foreground">
                Showing {shown.length} of {results.length}
              </p>
            </div>
          )}
        </>
      )}
    </BrowseShell>
  );
}
