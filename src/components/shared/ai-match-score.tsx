import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Banknote, Check, CircleCheck, Laptop, Minus, Sparkles, TrendingUp, X } from "lucide-react";
import { matchLabel } from "@/lib/matching";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/types";
import { SkillTag } from "./skill-tag";

interface ScoreTone {
  /** text colour class */
  text: string;
  /** svg stroke class */
  stroke: string;
  /** soft chip background + ring */
  chip: string;
}

/** ≥85 success, ≥72 info/primary, ≥58 warning, else danger */
export function scoreTone(score: number): ScoreTone {
  if (score >= 85) return { text: "text-success", stroke: "stroke-success", chip: "bg-success/15 text-success ring-success/30" };
  if (score >= 72) return { text: "text-primary", stroke: "stroke-primary", chip: "bg-primary/15 text-primary ring-primary/30" };
  if (score >= 58)
    return {
      text: "text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning",
      stroke: "stroke-warning",
      chip: "bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_40%)] ring-warning/35 dark:text-warning",
    };
  return { text: "text-destructive", stroke: "stroke-destructive", chip: "bg-destructive/15 text-destructive ring-destructive/30" };
}

const RING: Record<"sm" | "md" | "lg", { box: number; stroke: number; text: string }> = {
  sm: { box: 36, stroke: 3.5, text: "text-[11px]" },
  md: { box: 56, stroke: 4.5, text: "text-sm" },
  lg: { box: 88, stroke: 6, text: "text-2xl" },
};

interface AIMatchScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function AIMatchScore({ score, size = "md", showLabel = false, className }: AIMatchScoreProps) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const { box, stroke, text } = RING[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const tone = scoreTone(value);
  const label = matchLabel(value);

  return (
    <div
      className={cn("inline-flex items-center gap-2.5", className)}
      role="img"
      aria-label={`AI match score ${value} percent, ${label}`}
    >
      <div className="relative shrink-0" style={{ width: box, height: box }}>
        <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="-rotate-90" aria-hidden>
          <circle cx={box / 2} cy={box / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-[stroke-dashoffset] duration-700 ease-out", tone.stroke)}
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-heading font-semibold tabular-nums",
            text,
            tone.text,
          )}
        >
          {size === "sm" ? value : `${value}%`}
        </span>
      </div>
      {showLabel && (
        <div className="leading-tight">
          <p className={cn("text-sm font-semibold", tone.text)}>{label}</p>
          <p className="text-xs text-muted-foreground">AI match</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Breakdown                                                           */
/* ------------------------------------------------------------------ */

type FitTone = "good" | "ok" | "bad";

const FIT_CLASS: Record<FitTone, string> = {
  good: "bg-success/15 text-success",
  ok: "bg-info/15 text-info",
  bad: "bg-destructive/15 text-destructive",
};

function FitRow({
  icon,
  title,
  note,
  badge,
  tone,
}: {
  icon: ReactNode;
  title: string;
  note: string;
  badge: ReactNode;
  tone: FitTone;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", FIT_CLASS[tone])}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          {badge}
        </div>
        <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{note}</p>
      </div>
    </li>
  );
}

function FitPill({ tone, children }: { tone: FitTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium", FIT_CLASS[tone])}>
      {children}
    </span>
  );
}

export function MatchBreakdown({ match, className }: { match: MatchResult; className?: string }) {
  const expTone: FitTone = match.experienceFit === "match" ? "good" : match.experienceFit === "over" ? "ok" : "bad";
  const expLabel = { match: "Right level", over: "Above level", under: "Stretch" }[match.experienceFit];
  const ExpIcon = match.experienceFit === "under" ? ArrowDownRight : match.experienceFit === "over" ? ArrowUpRight : Check;

  const salaryTone: FitTone =
    match.salaryFit === "match" || match.salaryFit === "above" ? "good" : match.salaryFit === "unknown" ? "ok" : "bad";
  const salaryLabel = { match: "In range", above: "Above range", below: "Below range", unknown: "Unknown" }[match.salaryFit];
  const SalaryIcon = match.salaryFit === "unknown" ? Minus : Banknote;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-linear-to-br from-indigo-500/10 to-violet-500/10 p-4">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-pretty">{match.explanation}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <section aria-label="Matching skills" className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <CircleCheck className="size-4 text-success" aria-hidden />
            Matching skills
            <span className="text-xs font-normal text-muted-foreground">({match.matchingSkills.length})</span>
          </h4>
          {match.matchingSkills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {match.matchingSkills.map((skill) => (
                <li key={skill}>
                  <SkillTag skill={skill} variant="match" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No overlapping skills yet.</p>
          )}
        </section>
        <section aria-label="Missing skills" className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <X className="size-4 text-destructive" aria-hidden />
            Missing skills
            <span className="text-xs font-normal text-muted-foreground">({match.missingSkills.length})</span>
          </h4>
          {match.missingSkills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {match.missingSkills.map((skill) => (
                <li key={skill}>
                  <SkillTag skill={skill} variant="missing" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">You cover every required skill.</p>
          )}
        </section>
      </div>

      <ul className="grid gap-2.5">
        <FitRow
          icon={<TrendingUp className="size-4" aria-hidden />}
          title="Experience"
          note={match.experienceNote}
          tone={expTone}
          badge={
            <FitPill tone={expTone}>
              <ExpIcon className="mr-0.5 size-3" aria-hidden />
              {expLabel}
            </FitPill>
          }
        />
        <FitRow
          icon={<SalaryIcon className="size-4" aria-hidden />}
          title="Compensation"
          note={match.salaryNote}
          tone={salaryTone}
          badge={<FitPill tone={salaryTone}>{salaryLabel}</FitPill>}
        />
        <FitRow
          icon={<Laptop className="size-4" aria-hidden />}
          title="Work mode"
          note={match.workModeFit ? "The work setup fits your preferences." : "The work setup does not fit your preference."}
          tone={match.workModeFit ? "good" : "bad"}
          badge={<FitPill tone={match.workModeFit ? "good" : "bad"}>{match.workModeFit ? "Fits" : "Mismatch"}</FitPill>}
        />
      </ul>
    </div>
  );
}
