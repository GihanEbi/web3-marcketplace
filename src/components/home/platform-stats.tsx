"use client";

import { useMemo } from "react";
import { Briefcase, Building2, FolderKanban, Landmark, Users, type LucideIcon } from "lucide-react";
import { formatCompact } from "@/lib/format";
import { getPublicJobs } from "@/lib/job-filters";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import { CountUp } from "./count-up";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const USD_RATE: Record<string, number> = { USD: 1, USDC: 1, DAI: 1, ETH: 3200, MATIC: 0.7, SOL: 160 };

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
  format?: (n: number) => string;
  hint: string;
}

export function PlatformStats() {
  const hydrated = useHydrated();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const candidates = useAppStore((s) => s.candidates);
  const projects = useAppStore((s) => s.projects);
  const contracts = useAppStore((s) => s.contracts);

  const stats = useMemo<Stat[]>(() => {
    const paidOut = contracts.reduce(
      (sum, c) =>
        sum + c.milestones.filter((m) => m.status === "released").reduce((s, m) => s + m.amount * (USD_RATE[c.token] ?? 1), 0),
      0,
    );
    return [
      { label: "Open jobs", value: getPublicJobs(jobs, companies).length, icon: Briefcase, hint: "published right now" },
      { label: "Hiring companies", value: companies.filter((c) => !c.suspended).length, icon: Building2, hint: "protocols, DAOs & startups" },
      { label: "Talent profiles", value: candidates.length, icon: Users, hint: "builders on the platform" },
      { label: "Open projects", value: projects.filter((p) => p.status === "open").length, icon: FolderKanban, hint: "freelance gigs" },
      {
        label: "Paid via escrow",
        value: paidOut,
        icon: Landmark,
        format: (n) => `$${formatCompact(n)}`,
        hint: "released milestones (simulated)",
      },
    ];
  }, [jobs, companies, candidates, projects, contracts]);

  return (
    <section className="container mx-auto px-4 py-16 sm:py-20" aria-labelledby="platform-stats">
      <SectionHeading
        eyebrow="Platform statistics"
        title={<span id="platform-stats">A marketplace that keeps growing</span>}
        description="Live numbers pulled straight from the marketplace data."
        align="center"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.04} className={i === 4 ? "col-span-2 lg:col-span-1" : undefined}>
            <div className="h-full rounded-xl border border-border bg-card p-5 text-center transition-colors hover:border-primary/40">
              <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="size-5" aria-hidden />
              </span>
              <p className="font-heading text-3xl font-bold tracking-tight tabular-nums">
                {hydrated ? <CountUp value={stat.value} format={stat.format} /> : <span aria-hidden>—</span>}
              </p>
              <p className="mt-1 text-sm font-medium">{stat.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.hint}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
