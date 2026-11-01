"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Bot, FileText, Gauge, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AIMatchScore } from "@/components/shared/ai-match-score";
import { CompanyLogo } from "@/components/shared/company-logo";
import { SkillTag } from "@/components/shared/skill-tag";
import { getPublicJobs } from "@/lib/job-filters";
import { computeMatch, matchLabel } from "@/lib/matching";
import { useAppStore } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const POINTS = [
  { icon: Gauge, title: "Transparent match scores", text: "See exactly how your skills, experience level, salary range and work-mode preference line up with each role." },
  { icon: Sparkles, title: "Skill-gap insights", text: "Know which required skills you already have and which ones to learn next to unlock more opportunities." },
  { icon: FileText, title: "Resume & cover letter help", text: "Get resume feedback and tailored cover letters for every application, generated in seconds." },
  { icon: Bot, title: "Always-on AI assistant", text: "Ask for role recommendations, interview prep or salary context whenever you need it." },
];

/** Deterministic showcase: the demo seeker against her best-matching public job. */
function useShowcase() {
  const candidates = useAppStore((s) => s.candidates);
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);

  return useMemo(() => {
    const candidate = candidates.find((c) => c.id === "cand-001") ?? candidates[0];
    if (!candidate) return null;
    let best: { job: (typeof jobs)[number]; score: number } | null = null;
    for (const job of getPublicJobs(jobs, companies)) {
      const score = computeMatch(candidate, job).score;
      if (!best || score > best.score) best = { job, score };
    }
    if (!best) return null;
    return {
      candidate,
      job: best.job,
      company: companies.find((c) => c.id === best.job.companyId),
      match: computeMatch(candidate, best.job),
    };
  }, [candidates, jobs, companies]);
}

export function AiMatchingSection() {
  const hydrated = useHydrated();
  const showcase = useShowcase();

  return (
    <section className="relative overflow-hidden border-y border-border bg-muted/20" aria-labelledby="ai-matching">
      <div className="pointer-events-none absolute -right-32 top-1/4 size-96 rounded-full bg-violet-500/15 blur-3xl" aria-hidden />
      <div className="relative container mx-auto grid gap-12 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            eyebrow="AI-powered matching"
            title={
              <span id="ai-matching">
                Know your fit <span className="gradient-text">before you apply</span>
              </span>
            }
            description="Every job on Chainhire comes with an explainable match score so you can focus on roles where you will actually shine."
            className="mb-8 sm:mb-8"
          />
          <ul className="space-y-5">
            {POINTS.map((p) => (
              <li key={p.title} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-pretty text-muted-foreground">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={buttonVariants({ variant: "gradient", size: "lg" })}>
              Get your match scores
              <ArrowRight aria-hidden />
            </Link>
            <Link href="/jobs" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Browse jobs
            </Link>
          </div>
        </div>

        <Reveal>
          {hydrated && showcase ? (
            <div className="card-glow relative rounded-2xl border border-border bg-card p-6">
              <span className="absolute -top-3 right-5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                Sample match
              </span>
              <div className="flex items-start gap-3">
                {showcase.company && <CompanyLogo company={showcase.company} size="md" />}
                <div className="min-w-0 flex-1">
                  <Link href={`/jobs/${showcase.job.id}`} className="font-heading font-semibold hover:text-primary">
                    {showcase.job.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {showcase.company?.name} · {showcase.job.workMode}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-5 rounded-xl border border-border bg-muted/30 p-4">
                <AIMatchScore score={showcase.match.score} size="lg" />
                <div>
                  <p className="font-heading text-lg font-semibold">{matchLabel(showcase.match.score)} match</p>
                  <p className="text-sm text-muted-foreground">for {showcase.candidate.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {showcase.match.matchingSkills.length} of {showcase.job.skills.length} required skills
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-success">Matching skills</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {showcase.match.matchingSkills.length > 0 ? (
                      showcase.match.matchingSkills.map((s) => (
                        <li key={s}>
                          <SkillTag skill={s} variant="match" />
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-muted-foreground">None yet</li>
                    )}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-destructive">Skills to learn</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {showcase.match.missingSkills.length > 0 ? (
                      showcase.match.missingSkills.map((s) => (
                        <li key={s}>
                          <SkillTag skill={s} variant="missing" />
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-muted-foreground">You cover every skill</li>
                    )}
                  </ul>
                </div>
              </div>

              <p className="mt-5 flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-xs text-pretty text-muted-foreground">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                {showcase.match.explanation}
              </p>
            </div>
          ) : (
            <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" aria-hidden />
          )}
        </Reveal>
      </div>
    </section>
  );
}
