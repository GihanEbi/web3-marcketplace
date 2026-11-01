"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Briefcase, Search, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/select-field";
import { getPublicJobs } from "@/lib/job-filters";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";

const LOCATIONS = [
  { value: "", label: "Anywhere" },
  { value: "Remote", label: "Remote" },
  { value: "Berlin", label: "Berlin" },
  { value: "London", label: "London" },
  { value: "Singapore", label: "Singapore" },
  { value: "Amsterdam", label: "Amsterdam" },
  { value: "Toronto", label: "Toronto" },
  { value: "Seoul", label: "Seoul" },
];

const POPULAR = ["Solidity", "Smart Contracts", "Security", "Rust", "React"];
const ECOSYSTEMS = ["Ethereum", "Solana", "Base", "Arbitrum", "Polygon", "Optimism"];

function FloatingChip({
  className,
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={cn("glass absolute hidden items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5 shadow-xl xl:flex", className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={
        reduce
          ? { duration: 0.2 }
          : { opacity: { duration: 0.4, delay }, scale: { duration: 0.4, delay }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay } }
      }
    >
      {children}
    </motion.div>
  );
}

export function HeroSection() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const openJobs = useMemo(() => getPublicJobs(jobs, companies).length, [jobs, companies]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location) params.set("location", location);
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  }

  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      {/* background: grid + animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="bg-grid absolute inset-0 opacity-60" />
        <motion.div
          className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-indigo-500/25 blur-3xl"
          animate={reduce ? undefined : { x: [0, 40, 0], y: [0, 24, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-10 -right-24 size-[26rem] rounded-full bg-fuchsia-500/20 blur-3xl"
          animate={reduce ? undefined : { x: [0, -36, 0], y: [0, 32, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/3 size-[24rem] rounded-full bg-sky-500/20 blur-3xl"
          animate={reduce ? undefined : { x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 pt-14 pb-16 sm:pt-20 sm:pb-24">
        <FloatingChip className="top-24 left-4 2xl:left-12" delay={0.2}>
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Briefcase className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="font-heading text-sm font-semibold tabular-nums">{hydrated ? `${openJobs} open roles` : "Live roles"}</p>
            <p className="text-xs text-muted-foreground">updated daily</p>
          </div>
        </FloatingChip>
        <FloatingChip className="top-40 right-4 2xl:right-12" delay={0.6}>
          <span className="flex size-9 items-center justify-center rounded-lg bg-success/15 text-success">
            <Sparkles className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="font-heading text-sm font-semibold">94% AI match</p>
            <p className="text-xs text-muted-foreground">Solidity Engineer</p>
          </div>
        </FloatingChip>
        <FloatingChip className="right-10 bottom-12 2xl:right-24" delay={1}>
          <span className="flex size-9 items-center justify-center rounded-lg bg-info/15 text-info">
            <Wallet className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="font-heading text-sm font-semibold">Paid in USDC</p>
            <p className="text-xs text-muted-foreground">escrow-protected (simulated)</p>
          </div>
        </FloatingChip>

        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <span className="glass inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              AI-powered matching · Web3 payments · DAO bounties
            </span>
            <h1 className="font-heading text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Discover Your Next Opportunity in <span className="gradient-text">Web3</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-pretty text-muted-foreground">
              Chainhire connects blockchain engineers, designers and builders with verified protocols, DAOs and startups, then helps you get hired,
              and paid, on your terms.
            </p>
          </motion.div>

          <motion.form
            onSubmit={onSubmit}
            role="search"
            aria-label="Search jobs"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass mx-auto mt-9 flex max-w-3xl flex-col gap-2 rounded-2xl border border-border p-2 shadow-2xl shadow-primary/10 md:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Job title, skill or company"
                aria-label="Job title, skill or company"
                className="h-11 border-transparent bg-transparent pl-9 text-base shadow-none md:text-base"
              />
            </div>
            <div className="md:w-48">
              <SelectField aria-label="Location" value={location} onChange={setLocation} options={LOCATIONS} className="[&_select]:h-11 [&_select]:border-transparent" />
            </div>
            <Button type="submit" variant="gradient" size="lg" className="h-11 px-6">
              <Search aria-hidden />
              Search Jobs
            </Button>
          </motion.form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-sm text-muted-foreground">
            <span>Popular:</span>
            {POPULAR.map((term) => (
              <Link
                key={term}
                href={`/jobs?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs transition-colors outline-none hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {term}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Explore Talent
            </Link>
            <Link href="/employer/jobs/create" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Post a Job
            </Link>
          </div>

          {/* trust row */}
          <div className="mt-14 space-y-5 border-t border-border/60 pt-8">
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-info" aria-hidden />
                Verified employers
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" aria-hidden />
                Deterministic AI matching
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-success" aria-hidden />
                Milestone escrow (simulated)
              </li>
              <li className="flex items-center gap-2">
                <Wallet className="size-4 text-warning" aria-hidden />
                Get paid in USDC, ETH or DAI
              </li>
            </ul>
            <div>
              <p className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">Teams hiring across every major ecosystem</p>
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {ECOSYSTEMS.map((e) => (
                  <li key={e} className="font-heading text-sm font-semibold text-muted-foreground/80">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
