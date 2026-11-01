"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CircleAlert, CircleCheck, Lightbulb, LayoutTemplate, Sparkles, type LucideIcon } from "lucide-react";
import { scoreTone } from "@/components/shared/ai-match-score";
import { SkillTagList } from "@/components/shared/skill-tag";
import { matchLabel } from "@/lib/matching";
import { cn } from "@/lib/utils";
import type { ResumeAnalysis } from "@/types";

const RING = { box: 148, stroke: 11 } as const;

/** Animated 0-100 score ring with a qualitative label. */
export function ScoreRing({ score, className }: { score: number; className?: string }) {
  const reduceMotion = useReducedMotion() ?? false;
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (RING.box - RING.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const tone = scoreTone(value);
  const label = matchLabel(value);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)} role="img" aria-label={`Resume score ${value} out of 100, ${label}`}>
      <div className="relative" style={{ width: RING.box, height: RING.box }}>
        <svg width={RING.box} height={RING.box} viewBox={`0 0 ${RING.box} ${RING.box}`} className="-rotate-90" aria-hidden>
          <circle cx={RING.box / 2} cy={RING.box / 2} r={radius} fill="none" strokeWidth={RING.stroke} className="stroke-muted" />
          <motion.circle
            cx={RING.box / 2}
            cy={RING.box / 2}
            r={radius}
            fill="none"
            strokeWidth={RING.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: reduceMotion ? circumference * (1 - value / 100) : circumference }}
            animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
            transition={{ duration: reduceMotion ? 0 : 0.9, ease: "easeOut" }}
            className={tone.stroke}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-heading text-4xl font-semibold tabular-nums", tone.text)}>{value}</span>
          <span className="text-xs text-muted-foreground">out of 100</span>
        </div>
      </div>
      <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset", tone.chip)}>{label}</span>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  tone,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  tone: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 sm:p-5", className)} aria-label={title}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className={cn("flex size-7 items-center justify-center rounded-lg", tone)}>
          <Icon className="size-4" aria-hidden />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function BulletList({ items, empty, marker }: { items: string[]; empty: string; marker: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-pretty">
          <span aria-hidden className={cn("mt-2 size-1.5 shrink-0 rounded-full", marker)} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Presentational breakdown of a `ResumeAnalysis`. */
export function ResumeAnalysisView({ analysis, className }: { analysis: ResumeAnalysis; className?: string }) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className="grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-6">
        <ScoreRing score={analysis.score} className="mx-auto" />
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            AI summary
          </p>
          <p className="text-sm leading-relaxed text-pretty sm:text-base">{analysis.summary}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Strengths" icon={CircleCheck} tone="bg-success/15 text-success">
          <BulletList items={analysis.strengths} empty="No standout strengths detected yet." marker="bg-success" />
        </Section>
        <Section title="Suggested improvements" icon={Lightbulb} tone="bg-primary/15 text-primary">
          <BulletList items={analysis.improvements} empty="Nothing to improve right now — nice work." marker="bg-primary" />
        </Section>
        <Section title="Missing information" icon={CircleAlert} tone="bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning">
          <BulletList items={analysis.missingInfo} empty="Your resume covers the key information recruiters look for." marker="bg-warning" />
        </Section>
        <Section title="Formatting suggestions" icon={LayoutTemplate} tone="bg-info/15 text-info">
          <BulletList items={analysis.formatting} empty="Formatting looks clean and consistent." marker="bg-info" />
        </Section>
      </div>

      <Section title="Relevant skills" icon={Sparkles} tone="bg-primary/15 text-primary">
        {analysis.relevantSkills.length > 0 ? (
          <SkillTagList skills={analysis.relevantSkills} size="md" />
        ) : (
          <p className="text-sm text-muted-foreground">No skills were detected. Add skills to your profile so recruiters can find you.</p>
        )}
      </Section>
    </div>
  );
}
