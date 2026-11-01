"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { CheckboxGroup, FilterSection } from "@/components/shared/filter-panel";
import { SelectField } from "@/components/shared/select-field";
import { BLOCKCHAINS, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, JOB_CATEGORIES, WORK_MODES } from "@/lib/constants";
import type { JobFilters } from "@/lib/job-filters";
import type { Blockchain, EmploymentType, ExperienceLevel, Job, WorkMode } from "@/types";
import { SkillFilter, SwitchRow, countSkills, tally } from "./browse-controls";

interface JobFiltersPanelProps {
  filters: JobFilters;
  onChange: (patch: Partial<JobFilters>) => void;
  /** public jobs, used for the counts next to each option */
  jobs: Job[];
}

const SALARY_MAX = 250_000;

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function JobFiltersPanel({ filters, onChange, jobs }: JobFiltersPanelProps) {
  const counts = useMemo(
    () => ({
      category: tally(jobs, (j) => j.category),
      mode: tally(jobs, (j) => j.workMode),
      type: tally(jobs, (j) => j.type),
      exp: tally(jobs, (j) => j.experience),
      chain: tally(jobs, (j) => j.blockchain),
    }),
    [jobs],
  );
  const skillOptions = useMemo(() => countSkills(jobs.map((j) => j.skills)), [jobs]);

  const categoryOptions = [
    { value: "", label: "All categories" },
    ...JOB_CATEGORIES.map((c) => ({ value: c, label: `${c} (${counts.category.get(c) ?? 0})` })),
  ];

  return (
    <>
      <FilterSection title="Category">
        <SelectField
          aria-label="Category"
          value={filters.category}
          onChange={(category) => onChange({ category })}
          options={categoryOptions}
        />
      </FilterSection>

      <FilterSection title="Location">
        <Input
          aria-label="Location"
          value={filters.location}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder="City, country or “Remote”"
        />
      </FilterSection>

      <FilterSection title="Work mode">
        <CheckboxGroup<WorkMode>
          options={WORK_MODES.map((m) => ({ value: m, label: m, count: counts.mode.get(m) ?? 0 }))}
          value={filters.workModes}
          onChange={(workModes) => onChange({ workModes })}
        />
      </FilterSection>

      <FilterSection title="Employment type">
        <CheckboxGroup<EmploymentType>
          options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t, count: counts.type.get(t) ?? 0 }))}
          value={filters.types}
          onChange={(types) => onChange({ types })}
        />
      </FilterSection>

      <FilterSection title="Experience level">
        <CheckboxGroup<ExperienceLevel>
          options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: l, count: counts.exp.get(l) ?? 0 }))}
          value={filters.experience}
          onChange={(experience) => onChange({ experience })}
        />
      </FilterSection>

      <FilterSection title="Minimum salary">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Annual (USD equiv.)</span>
            <span className="font-medium tabular-nums">
              {filters.minSalary > 0 ? `$${Math.round(filters.minSalary / 1000)}k+` : "Any"}
            </span>
          </div>
          <Slider
            aria-label="Minimum annual salary"
            min={0}
            max={SALARY_MAX}
            step={10_000}
            value={[filters.minSalary]}
            onValueChange={(v) => onChange({ minSalary: Array.isArray(v) ? (v[0] ?? 0) : Number(v) })}
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>$0</span>
            <span>$250k</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Blockchain ecosystem" defaultOpen={false}>
        <CheckboxGroup<Blockchain>
          options={BLOCKCHAINS.map((b) => ({ value: b, label: b, count: counts.chain.get(b) ?? 0 }))}
          value={filters.ecosystems}
          onChange={(ecosystems) => onChange({ ecosystems })}
        />
      </FilterSection>

      <FilterSection title="Technology / skills" defaultOpen={false}>
        <SkillFilter
          options={skillOptions}
          selected={filters.skills}
          onToggle={(skill) => onChange({ skills: toggle(filters.skills, skill) })}
        />
      </FilterSection>

      <FilterSection title="Payment">
        <SwitchRow
          label="Crypto payment"
          description="Only roles that pay (partly) in tokens"
          checked={filters.cryptoOnly}
          onCheckedChange={(cryptoOnly) => onChange({ cryptoOnly })}
        />
      </FilterSection>
    </>
  );
}
