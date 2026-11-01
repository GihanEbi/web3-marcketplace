"use client";

import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/components/shared/company-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { SwitchRow } from "@/components/jobs/browse-controls";
import { getPublicJobs } from "@/lib/job-filters";
import { pluralize } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";

type CompanySort = "jobs" | "name" | "founded";

export function CompaniesDirectory() {
  const hydrated = useHydrated();
  const companies = useAppStore((s) => s.companies);
  const jobs = useAppStore((s) => s.jobs);

  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hiringNow, setHiringNow] = useState(false);
  const [sort, setSort] = useState<CompanySort>("jobs");

  const visibleCompanies = useMemo(() => companies.filter((c) => !c.suspended), [companies]);
  const openJobs = useMemo(() => {
    const map = new Map<string, number>();
    for (const j of getPublicJobs(jobs, companies)) map.set(j.companyId, (map.get(j.companyId) ?? 0) + 1);
    return map;
  }, [jobs, companies]);
  const industries = useMemo(
    () => [...new Set(visibleCompanies.map((c) => c.industry))].sort((a, b) => a.localeCompare(b)),
    [visibleCompanies],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = visibleCompanies.filter((c) => {
      if (q) {
        const haystack = [c.name, c.industry, c.tagline, c.location, ...c.techStack, ...c.ecosystems].join(" ").toLowerCase();
        if (!q.split(/\s+/).every((t) => haystack.includes(t))) return false;
      }
      if (industry && c.industry !== industry) return false;
      if (verifiedOnly && !c.verified) return false;
      if (hiringNow && (openJobs.get(c.id) ?? 0) === 0) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "founded") return b.founded - a.founded || a.name.localeCompare(b.name);
      return (openJobs.get(b.id) ?? 0) - (openJobs.get(a.id) ?? 0) || a.name.localeCompare(b.name);
    });
  }, [visibleCompanies, query, industry, verifiedOnly, hiringNow, sort, openJobs]);

  const hasFilters = Boolean(query || industry || verifiedOnly || hiringNow);
  function reset() {
    setQuery("");
    setIndustry("");
    setVerifiedOnly(false);
    setHiringNow(false);
  }

  if (!hydrated) return <LoadingSkeleton variant="card" />;

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_16rem_12rem]">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name, industry or tech…"
            aria-label="Search companies"
            debounceMs={150}
          />
          <SelectField
            aria-label="Industry"
            value={industry}
            onChange={setIndustry}
            options={[{ value: "", label: "All industries" }, ...industries.map((i) => ({ value: i, label: i }))]}
          />
          <SelectField
            aria-label="Sort companies"
            value={sort}
            onChange={(v) => setSort(v as CompanySort)}
            options={[
              { value: "jobs", label: "Most open jobs" },
              { value: "name", label: "Name (A–Z)" },
              { value: "founded", label: "Recently founded" },
            ]}
          />
        </div>
        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <SwitchRow label="Verified only" description="Companies verified by the Chainhire team" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
          <SwitchRow label="Hiring now" description="Companies with at least one open job" checked={hiringNow} onCheckedChange={setHiringNow} />
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground">{pluralize(results.length, "company", "companies")}</span> found
      </p>

      {results.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies match your search"
          description="Try a different keyword or clear your filters to see every organisation on Chainhire."
          action={
            hasFilters ? (
              <Button variant="outline" onClick={reset}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((c) => (
            <CompanyCard key={c.id} company={c} activeJobs={openJobs.get(c.id) ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
