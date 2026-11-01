"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BountyCard } from "@/components/shared/bounty-card";
import { ActiveFilterChips, CheckboxGroup, FilterSection } from "@/components/shared/filter-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { BrowseShell, SkillFilter, countSkills, tally } from "@/components/jobs/browse-controls";
import { BLOCKCHAINS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import type { Blockchain } from "@/types";

const PAGE_SIZE = 9;

type StatusFilter = "open" | "in_review" | "all";
type BountySort = "newest" | "reward" | "deadline";

interface BountyFilters {
  query: string;
  skills: string[];
  chains: Blockchain[];
  tokens: string[];
  status: StatusFilter;
  sort: BountySort;
}

const DEFAULTS: BountyFilters = { query: "", skills: [], chains: [], tokens: [], status: "open", sort: "newest" };

const USD_RATE: Record<string, number> = { USD: 1, USDC: 1, DAI: 1, ETH: 3200, MATIC: 0.7, SOL: 160 };

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function BountiesBrowser() {
  const hydrated = useHydrated();
  const bounties = useAppStore((s) => s.bounties);
  const companies = useAppStore((s) => s.companies);

  const [filters, setFilters] = useState<BountyFilters>(DEFAULTS);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const catalogue = useMemo(
    () =>
      bounties.filter((b) => {
        if (b.status === "closed") return false;
        return !companies.find((c) => c.id === b.daoId)?.suspended;
      }),
    [bounties, companies],
  );

  const results = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const orgName = (id: string) => companies.find((c) => c.id === id)?.name ?? "";
    const list = catalogue.filter((b) => {
      if (filters.status !== "all" && b.status !== filters.status) return false;
      if (q) {
        const haystack = [b.title, b.description, orgName(b.daoId), b.token, ...b.skills].join(" ").toLowerCase();
        if (!q.split(/\s+/).every((t) => haystack.includes(t))) return false;
      }
      if (filters.skills.length && !filters.skills.every((s) => b.skills.some((bs) => bs.toLowerCase() === s.toLowerCase()))) return false;
      if (filters.chains.length && !filters.chains.includes(b.blockchain)) return false;
      if (filters.tokens.length && !filters.tokens.includes(b.token)) return false;
      return true;
    });
    const sorted = [...list];
    if (filters.sort === "reward") sorted.sort((a, b) => b.rewardAmount * (USD_RATE[b.token] ?? 1) - a.rewardAmount * (USD_RATE[a.token] ?? 1));
    else if (filters.sort === "deadline") sorted.sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline));
    else sorted.sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
    return sorted;
  }, [catalogue, companies, filters]);

  const counts = useMemo(
    () => ({ chain: tally(catalogue, (b) => b.blockchain), token: tally(catalogue, (b) => b.token) }),
    [catalogue],
  );
  const tokenOptions = useMemo(() => [...counts.token.keys()].sort(), [counts]);
  const skillOptions = useMemo(() => countSkills(catalogue.map((b) => b.skills)), [catalogue]);

  function update(patch: Partial<BountyFilters>) {
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
    filters.chains.forEach((c) => list.push({ key: `chain:${c}`, label: c }));
    filters.tokens.forEach((t) => list.push({ key: `token:${t}`, label: `Reward in ${t}` }));
    if (filters.status !== "open") list.push({ key: "status", label: filters.status === "all" ? "Open + in review" : "In review" });
    return list;
  }, [filters]);

  function removeChip(key: string) {
    const [kind, ...rest] = key.split(":");
    const value = rest.join(":");
    if (kind === "query") update({ query: "" });
    else if (kind === "skill") update({ skills: filters.skills.filter((s) => s !== value) });
    else if (kind === "chain") update({ chains: filters.chains.filter((c) => c !== value) });
    else if (kind === "token") update({ tokens: filters.tokens.filter((t) => t !== value) });
    else if (kind === "status") update({ status: "open" });
  }

  if (!hydrated) return <LoadingSkeleton variant="card" />;

  const activeCount =
    (filters.query ? 1 : 0) + filters.skills.length + filters.chains.length + filters.tokens.length + (filters.status !== "open" ? 1 : 0);
  const shown = results.slice(0, visible);
  const remaining = results.length - shown.length;

  const panel = (
    <>
      <FilterSection title="Status">
        <SelectField
          aria-label="Bounty status"
          value={filters.status}
          onChange={(status) => update({ status: status as StatusFilter })}
          options={[
            { value: "open", label: "Open for interest" },
            { value: "in_review", label: "In review" },
            { value: "all", label: "Open + in review" },
          ]}
        />
      </FilterSection>
      <FilterSection title="Reward token">
        <CheckboxGroup
          options={tokenOptions.map((t) => ({ value: t, label: t, count: counts.token.get(t) ?? 0 }))}
          value={filters.tokens}
          onChange={(tokens) => update({ tokens })}
        />
      </FilterSection>
      <FilterSection title="Blockchain">
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
          placeholder="Search bounties by title, skill or DAO…"
          aria-label="Search bounties"
          debounceMs={200}
        />
      }
      sort={
        <SelectField
          aria-label="Sort bounties"
          value={filters.sort}
          onChange={(sort) => update({ sort: sort as BountySort })}
          className="w-44"
          options={[
            { value: "newest", label: "Newest first" },
            { value: "reward", label: "Reward: high to low" },
            { value: "deadline", label: "Deadline: soonest" },
          ]}
        />
      }
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground tabular-nums">{formatNumber(results.length)}</span>{" "}
        {results.length === 1 ? "bounty" : "bounties"} found
      </p>
      <ActiveFilterChips chips={chips} onRemove={removeChip} onClearAll={reset} />

      {results.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No bounties match your filters"
          description="Try a different token, blockchain or skill, or clear all filters."
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
            {shown.map((b) => (
              <BountyCard key={b.id} bounty={b} />
            ))}
          </div>
          {remaining > 0 && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load more bounties
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
