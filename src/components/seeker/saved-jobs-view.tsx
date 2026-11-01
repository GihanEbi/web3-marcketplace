"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Banknote, Bookmark, BookmarkX, Check, Clock, Coins, Loader2, MapPin, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/shared/company-logo";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { SkillTagList } from "@/components/shared/skill-tag";
import { formatDate, formatJobSalary, formatRelative } from "@/lib/format";
import { annualUsd } from "@/lib/matching";
import { saveJob } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useHydrated, useMyApplications, useSavedJobIds } from "@/store/hooks";
import type { Application, Company, Job } from "@/types";
import { acceptsApplications } from "./job-utils";

type SavedSort = "recent" | "newest" | "salary";

interface Entry {
  job: Job;
  company?: Company;
  open: boolean;
  application?: Application;
  /** position in the saved list (0 = saved most recently) */
  rank: number;
}

const SORT_OPTIONS = [
  { value: "recent", label: "Recently saved" },
  { value: "newest", label: "Newest posted" },
  { value: "salary", label: "Highest salary" },
];

export function SavedJobsView() {
  const hydrated = useHydrated();
  const candidate = useCurrentCandidate();
  const savedIds = useSavedJobIds();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const myApps = useMyApplications();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SavedSort>("recent");
  const [removing, setRemoving] = useState<string | null>(null);

  const entries = useMemo<Entry[]>(
    () =>
      savedIds.flatMap((id, rank) => {
        const job = jobs.find((j) => j.id === id);
        if (!job) return [];
        return [
          {
            job,
            rank,
            company: companies.find((c) => c.id === job.companyId),
            open: acceptsApplications(job, companies),
            application: myApps.find((a) => a.jobId === job.id && a.status !== "withdrawn"),
          },
        ];
      }),
    [savedIds, jobs, companies, myApps],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = entries.filter((e) => {
      if (!q) return true;
      return [e.job.title, e.company?.name ?? "", e.job.location, e.job.category, ...e.job.skills].join(" ").toLowerCase().includes(q);
    });
    const sorted = [...filtered];
    if (sort === "newest") sorted.sort((a, b) => Date.parse(b.job.postedAt) - Date.parse(a.job.postedAt));
    else if (sort === "salary")
      sorted.sort(
        (a, b) =>
          annualUsd(b.job.salaryMax, b.job.currency, b.job.salaryPeriod) - annualUsd(a.job.salaryMax, a.job.currency, a.job.salaryPeriod),
      );
    else sorted.sort((a, b) => a.rank - b.rank);
    return sorted;
  }, [entries, query, sort]);

  async function remove(job: Job) {
    if (!candidate || removing) return;
    setRemoving(job.id);
    try {
      await saveJob(candidate.id, job.id);
      toast.success(`Removed "${job.title}" from saved jobs`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove this job");
    } finally {
      setRemoving(null);
    }
  }

  if (!hydrated || !candidate) {
    return (
      <div className="space-y-6">
        <PageHeader title="Saved jobs" description="Roles you have bookmarked." />
        <LoadingSkeleton variant="list" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved jobs"
        description={
          entries.length > 0
            ? `${entries.length} bookmarked ${entries.length === 1 ? "role" : "roles"} — apply when you are ready.`
            : "Bookmark roles while you browse and find them again here."
        }
        actions={
          <Link href="/jobs" className={buttonVariants({ variant: "gradient" })}>
            Browse jobs
          </Link>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          description="Tap the bookmark icon on any job to keep it here for later. Saved roles are never lost, even if their deadline passes."
          action={
            <>
              <Link href="/jobs" className={buttonVariants({ variant: "gradient" })}>
                Explore jobs
              </Link>
              <Link href="/recommended-jobs" className={buttonVariants({ variant: "outline" })}>
                See recommendations
              </Link>
            </>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={query} onChange={setQuery} placeholder="Search saved jobs…" aria-label="Search saved jobs" className="sm:max-w-sm" />
            <div className="sm:ml-auto sm:w-52">
              <SelectField
                aria-label="Sort saved jobs"
                value={sort}
                onChange={(v) => setSort(v as SavedSort)}
                options={SORT_OPTIONS}
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title="No saved jobs match your search"
              description="Try a different keyword."
              action={
                <Button variant="outline" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-4 xl:grid-cols-2">
              {visible.map(({ job, company, open, application }, index) => (
                <motion.li
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index, 6) * 0.03 }}
                  className="flex"
                >
                  <article className="flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
                    <div className="flex items-start gap-3">
                      {company && <CompanyLogo company={company} size="md" />}
                      <div className="min-w-0 flex-1">
                        <h2 className="font-heading text-base leading-snug font-semibold">
                          <Link href={`/jobs/${job.id}`} className="rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60">
                            {job.title}
                          </Link>
                        </h2>
                        <p className="truncate text-sm text-muted-foreground">{company?.name ?? "Unknown company"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${job.title} from saved jobs`}
                        title="Remove from saved"
                        onClick={() => remove(job)}
                        disabled={removing === job.id}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {removing === job.id ? <Loader2 className="animate-spin" aria-hidden /> : <BookmarkX aria-hidden />}
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" aria-hidden />
                        {job.location} · {job.workMode}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        <Banknote className="size-3.5 text-muted-foreground" aria-hidden />
                        {formatJobSalary(job)}
                      </span>
                      {job.cryptoPayment && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                          <Coins className="size-3.5" aria-hidden />
                          Paid in {job.paymentTokens.slice(0, 2).join("/") || "crypto"}
                        </span>
                      )}
                    </div>

                    <SkillTagList skills={job.skills} max={5} />

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <div className="space-y-1">
                        {!open && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                            <TriangleAlert className="size-3" aria-hidden />
                            No longer accepting applications
                          </span>
                        )}
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" aria-hidden />
                          Posted {formatRelative(job.postedAt)} · Deadline {formatDate(job.deadline)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/jobs/${job.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                          View details
                        </Link>
                        {application ? (
                          <Link href={`/applications/${application.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                            <Check aria-hidden />
                            Applied
                          </Link>
                        ) : open ? (
                          <Link href={`/jobs/${job.id}/apply`} className={buttonVariants({ variant: "gradient", size: "sm" })}>
                            Apply now
                          </Link>
                        ) : (
                          <Button size="sm" variant="secondary" disabled>
                            Closed
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                </motion.li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
