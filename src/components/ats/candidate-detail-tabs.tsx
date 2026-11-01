"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Banknote,
  Calendar,
  CalendarPlus,
  Check,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Laptop,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  StickyNote,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { GithubIcon, LinkedinIcon } from "@/components/brand/brand-icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AIMatchScore } from "@/components/shared/ai-match-score";
import { EmptyState } from "@/components/shared/empty-state";
import { InterviewCard } from "@/components/shared/interview-card";
import { SkillTag, SkillTagList } from "@/components/shared/skill-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { annualUsd } from "@/lib/matching";
import { formatCurrency, formatDate, formatDateTime, formatJobSalary, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addApplicationNote, summarizeCandidate } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser } from "@/store/hooks";
import type { Application, Candidate, Job, MatchResult } from "@/types";
import { formatMonth } from "./ats-utils";
import type { InterviewActions } from "./use-interview-actions";

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

function Section({ title, icon, children, className }: { title: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function ExternalLinkRow({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
    >
      {icon}
      {label}
      <ExternalLink className="size-3 opacity-60" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

export function OverviewTab({ candidate, match }: { candidate: Candidate; match: MatchResult | null }) {
  return (
    <div className="space-y-7">
      <Section title="Summary">
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{candidate.summary}</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
          <li className="inline-flex items-center gap-1.5">
            <Mail className="size-3.5" aria-hidden />
            <a href={`mailto:${candidate.email}`} className="hover:text-foreground hover:underline">
              {candidate.email}
            </a>
          </li>
          {candidate.phone && (
            <li className="inline-flex items-center gap-1.5">
              <Phone className="size-3.5" aria-hidden />
              {candidate.phone}
            </li>
          )}
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            {candidate.location} · {candidate.remotePreference}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden />
            Available: {candidate.availability}
          </li>
        </ul>
      </Section>

      <Section title="Skills">
        <SkillTagList skills={candidate.skills} size="md" highlight={match?.matchingSkills} />
        {match && match.missingSkills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Required by this role but not on their profile</p>
            <ul className="flex flex-wrap gap-1.5">
              {match.missingSkills.map((skill) => (
                <li key={skill}>
                  <SkillTag skill={skill} variant="missing" />
                </li>
              ))}
            </ul>
          </div>
        )}
        {match && (
          <p className="text-xs text-muted-foreground">
            <span className="mr-1 inline-block size-2 rounded-full bg-success align-middle" aria-hidden />
            Green skills match the job requirements.
          </p>
        )}
      </Section>

      <Section title="Experience" icon={<TrendingUp className="size-4 text-primary" aria-hidden />}>
        {candidate.experience.length === 0 ? (
          <p className="text-sm text-muted-foreground">No work history listed.</p>
        ) : (
          <ol className="relative space-y-5">
            {candidate.experience.map((item, index) => (
              <li key={item.id} className="relative flex gap-3">
                {index < candidate.experience.length - 1 && (
                  <span aria-hidden className="absolute top-4 bottom-[-20px] left-[5px] w-px bg-border" />
                )}
                <span aria-hidden className="relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full bg-primary ring-4 ring-popover" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {item.title} <span className="font-normal text-muted-foreground">· {item.company}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMonth(item.startDate)} – {formatMonth(item.endDate)} · {item.location}
                  </p>
                  <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {candidate.education.length > 0 && (
        <Section title="Education" icon={<GraduationCap className="size-4 text-primary" aria-hidden />}>
          <ul className="space-y-2.5">
            {candidate.education.map((e) => (
              <li key={e.id} className="text-sm">
                <p className="font-medium">
                  {e.degree}, {e.field}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.school} · {e.startYear} – {e.endYear ?? "Present"}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {candidate.certifications.length > 0 && (
        <Section title="Certifications" icon={<Award className="size-4 text-primary" aria-hidden />}>
          <ul className="space-y-2">
            {candidate.certifications.map((c) => (
              <li key={c.id} className="text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">
                  {" "}
                  · {c.issuer}, {c.year}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {candidate.portfolio.length > 0 && (
        <Section title="Portfolio projects">
          <ul className="grid gap-3 sm:grid-cols-2">
            {candidate.portfolio.map((p) => (
              <li key={p.id} className="rounded-xl border border-border bg-muted/30 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{p.title}</p>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${p.title}`}
                      className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <ExternalLink className="size-4" aria-hidden />
                    </a>
                  )}
                </div>
                <p className="mt-1 line-clamp-3 text-xs text-pretty text-muted-foreground">{p.description}</p>
                {p.tags.length > 0 && <SkillTagList skills={p.tags} max={4} className="mt-2.5" />}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Links">
        <div className="flex flex-wrap gap-2">
          <ExternalLinkRow href={candidate.githubUrl} icon={<GithubIcon className="size-4" />} label="GitHub" />
          <ExternalLinkRow href={candidate.linkedinUrl} icon={<LinkedinIcon className="size-4" />} label="LinkedIn" />
          <ExternalLinkRow href={candidate.website} icon={<Globe className="size-4" />} label="Website" />
          {!candidate.githubUrl && !candidate.linkedinUrl && !candidate.website && (
            <p className="text-sm text-muted-foreground">No public links shared.</p>
          )}
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Resume                                                              */
/* ------------------------------------------------------------------ */

export function ResumeTab({ candidate, application }: { candidate: Candidate; application: Application }) {
  const fileName = application.resumeName || candidate.resume?.fileName || `${candidate.name.replace(/\s+/g, "_")}_Resume.pdf`;
  const sizeKb = candidate.resume?.sizeKb;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {sizeKb ? `${sizeKb} KB · ` : ""}
              Submitted with the application on {formatDate(application.appliedAt)}
            </p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger render={<span tabIndex={0} className="inline-flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />}>
            <Button variant="outline" size="sm" disabled aria-label="Download resume (mock file)">
              <Download aria-hidden />
              Download
            </Button>
          </TooltipTrigger>
          <TooltipContent>mock file</TooltipContent>
        </Tooltip>
      </div>

      <article
        aria-label="Resume preview"
        className="space-y-5 rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8"
      >
        <header className="flex items-start gap-4 border-b border-border pb-4">
          <UserAvatar name={candidate.name} src={candidate.avatar} size="lg" />
          <div className="min-w-0">
            <h3 className="font-heading text-xl font-semibold">{candidate.name}</h3>
            <p className="text-sm text-muted-foreground">{candidate.headline}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {candidate.email}
              {candidate.phone ? ` · ${candidate.phone}` : ""} · {candidate.location}
            </p>
          </div>
        </header>
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold tracking-wider text-primary uppercase">Profile</h4>
          <p className="text-sm text-pretty text-muted-foreground">{candidate.summary}</p>
        </div>
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold tracking-wider text-primary uppercase">Skills</h4>
          <p className="text-sm text-muted-foreground">{candidate.skills.join(" · ")}</p>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold tracking-wider text-primary uppercase">Experience</h4>
          {candidate.experience.map((item) => (
            <div key={item.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium">
                  {item.title}, {item.company}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatMonth(item.startDate)} – {formatMonth(item.endDate)}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
        {candidate.education.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold tracking-wider text-primary uppercase">Education</h4>
            {candidate.education.map((e) => (
              <p key={e.id} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{e.school}</span> — {e.degree}, {e.field} ({e.startYear}–
                {e.endYear ?? "Present"})
              </p>
            ))}
          </div>
        )}
      </article>
      <p className="text-center text-xs text-muted-foreground">
        Preview generated from the candidate&apos;s profile. No real file is stored in this demo.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Application                                                         */
/* ------------------------------------------------------------------ */

export function ApplicationTab({ application, job }: { application: Application; job: Job | undefined }) {
  const salaryNote = useMemo(() => {
    if (!job) return null;
    const expected = annualUsd(application.expectedSalary, application.salaryCurrency, "year");
    const min = annualUsd(job.salaryMin, job.currency, job.salaryPeriod);
    const max = annualUsd(job.salaryMax, job.currency, job.salaryPeriod);
    if (expected > max) return { tone: "text-destructive", text: "Above the posted range" };
    if (expected < min) return { tone: "text-success", text: "Below the posted range" };
    return { tone: "text-success", text: "Within the posted range" };
  }, [application, job]);

  return (
    <div className="space-y-7">
      <Section title="Cover letter">
        {application.coverLetter.trim() ? (
          <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-line text-pretty">
            {application.coverLetter}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No cover letter was included.</p>
        )}
      </Section>

      <Section title="Details">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Banknote className="size-3.5" aria-hidden />
              Expected salary
            </dt>
            <dd className="mt-1 text-sm font-semibold">{formatCurrency(application.expectedSalary, application.salaryCurrency)}</dd>
            {job && (
              <dd className="mt-0.5 text-xs text-muted-foreground">
                Job range: {formatJobSalary(job)}
                {salaryNote && <span className={cn("ml-1.5 font-medium", salaryNote.tone)}>· {salaryNote.text}</span>}
              </dd>
            )}
          </div>
          <div className="rounded-xl border border-border p-3.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" aria-hidden />
              Availability
            </dt>
            <dd className="mt-1 text-sm font-semibold">{application.availability}</dd>
            <dd className="mt-0.5 text-xs text-muted-foreground">Applied {formatDate(application.appliedAt)}</dd>
          </div>
          <div className="rounded-xl border border-border p-3.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="size-3.5" aria-hidden />
              Portfolio
            </dt>
            <dd className="mt-1 truncate text-sm">
              {application.portfolioUrl ? (
                <a
                  href={application.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {application.portfolioUrl.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <span className="text-muted-foreground">Not provided</span>
              )}
            </dd>
          </div>
          <div className="rounded-xl border border-border p-3.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-3.5" aria-hidden />
              Resume
            </dt>
            <dd className="mt-1 truncate text-sm font-medium">{application.resumeName || "Not provided"}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Screening answers">
        {application.screeningAnswers.length === 0 ? (
          <p className="text-sm text-muted-foreground">This job had no screening questions.</p>
        ) : (
          <ol className="space-y-3">
            {application.screeningAnswers.map((qa, index) => (
              <li key={`${index}-${qa.question}`} className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  Q{index + 1}. {qa.question}
                </p>
                <p className="mt-1.5 text-sm text-pretty">{qa.answer || "No answer provided."}</p>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AI match                                                            */
/* ------------------------------------------------------------------ */

function FitRow({ icon, title, note, tone }: { icon: ReactNode; title: string; note: string; tone: "good" | "ok" | "bad" }) {
  const toneClass = { good: "bg-success/15 text-success", ok: "bg-info/15 text-info", bad: "bg-destructive/15 text-destructive" }[tone];
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", toneClass)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{note}</p>
      </div>
    </li>
  );
}

export function AIMatchTab({
  application,
  candidate,
  job,
  match,
}: {
  application: Application;
  candidate: Candidate;
  job: Job | undefined;
  match: MatchResult | null;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      setSummary(await summarizeCandidate(application.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate a summary");
    } finally {
      setLoading(false);
    }
  }

  if (!match || !job) {
    return <EmptyState title="Match unavailable" description="The job for this application is no longer available." className="py-10" />;
  }

  const expTone = match.experienceFit === "match" ? "good" : match.experienceFit === "over" ? "ok" : "bad";
  const ExpIcon = match.experienceFit === "under" ? ArrowDownRight : match.experienceFit === "over" ? ArrowUpRight : Check;
  const salaryNote = {
    match: "The candidate's salary expectation overlaps the posted range.",
    above: "The posted range starts above the candidate's expectation.",
    below: "The posted range tops out below the candidate's expectation.",
    unknown: "Not enough salary data to compare.",
  }[match.salaryFit];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-5 rounded-xl border border-primary/20 bg-linear-to-br from-indigo-500/10 to-violet-500/10 p-4">
        <AIMatchScore score={application.matchScore} size="lg" showLabel />
        <p className="min-w-52 flex-1 text-sm text-pretty">
          Matches {match.matchingSkills.length} of {job.skills.length} required skills for <strong>{job.title}</strong>.{" "}
          {match.missingSkills.length > 0
            ? `Gaps: ${match.missingSkills.slice(0, 4).join(", ")}${match.missingSkills.length > 4 ? "…" : ""}.`
            : "No skill gaps against the requirements."}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Section title={`Matching skills (${match.matchingSkills.length})`}>
          {match.matchingSkills.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {match.matchingSkills.map((s) => (
                <li key={s}>
                  <SkillTag skill={s} variant="match" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No overlapping skills.</p>
          )}
        </Section>
        <Section title={`Missing skills (${match.missingSkills.length})`}>
          {match.missingSkills.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {match.missingSkills.map((s) => (
                <li key={s}>
                  <SkillTag skill={s} variant="missing" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Covers every required skill.</p>
          )}
        </Section>
      </div>

      <ul className="grid gap-2.5" aria-label="Fit breakdown">
        <FitRow
          icon={<ExpIcon className="size-4" aria-hidden />}
          title={`Experience · ${candidate.experienceLevel} (${candidate.yearsOfExperience} yrs) vs ${job.experience}`}
          note={
            match.experienceFit === "match"
              ? "Seniority lines up with the role."
              : match.experienceFit === "over"
                ? "More experienced than the role requires — consider compensation expectations."
                : "Below the requested level — a stretch hire that may need ramp-up."
          }
          tone={expTone}
        />
        <FitRow
          icon={<Banknote className="size-4" aria-hidden />}
          title="Compensation"
          note={salaryNote}
          tone={match.salaryFit === "below" ? "bad" : match.salaryFit === "unknown" ? "ok" : "good"}
        />
        <FitRow
          icon={<Laptop className="size-4" aria-hidden />}
          title={`Work mode · prefers ${candidate.remotePreference.toLowerCase()}, role is ${job.workMode.toLowerCase()}`}
          note={match.workModeFit ? "The work setup fits the candidate's preference." : "The work setup conflicts with the candidate's preference."}
          tone={match.workModeFit ? "good" : "bad"}
        />
      </ul>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" aria-hidden />
            AI candidate summary
          </h3>
          <Button variant="gradient" size="sm" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {loading ? "Generating…" : summary ? "Regenerate summary" : "Generate AI summary"}
          </Button>
        </div>
        {summary ? (
          <p className="rounded-lg bg-muted/40 p-3.5 text-sm leading-relaxed text-pretty" aria-live="polite">
            {summary}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Get a short, deterministic recruiter-style summary of this candidate against the role.
          </p>
        )}
        <p className="text-xs font-medium text-muted-foreground">
          AI suggestions only — you decide. Nothing happens to this application unless you take an action yourself.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

const noteSchema = z.object({ text: z.string().trim().min(2, "Write at least a few words").max(800, "Keep notes under 800 characters") });
type NoteValues = z.infer<typeof noteSchema>;

export function NotesTab({ application }: { application: Application }) {
  const user = useCurrentUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoteValues>({ resolver: zodResolver(noteSchema), defaultValues: { text: "" } });

  const notes = useMemo(
    () => [...application.notes].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    [application.notes],
  );

  async function onSubmit(values: NoteValues) {
    try {
      await addApplicationNote(application.id, values.text, user?.name ?? "Recruiter");
      toast.success("Note added");
      reset({ text: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the note");
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5" noValidate>
        <label htmlFor="cd-note" className="text-sm font-semibold">
          Add an internal note
        </label>
        <Textarea
          id="cd-note"
          rows={3}
          placeholder="Interview impressions, follow-ups, concerns… (never shown to the candidate)"
          aria-invalid={Boolean(errors.text)}
          aria-describedby={errors.text ? "cd-note-error" : undefined}
          {...register("text")}
        />
        {errors.text && (
          <p id="cd-note-error" role="alert" className="text-xs text-destructive">
            {errors.text.message}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            Add note
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Notes are visible to your hiring team only."
          className="py-8"
        />
      ) : (
        <ul className="space-y-3" aria-label="Internal notes">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border border-border bg-muted/30 p-3.5">
              <div className="flex items-center gap-2.5">
                <UserAvatar name={note.authorName} size="xs" />
                <p className="text-sm font-medium">{note.authorName}</p>
                <time dateTime={note.at} className="ml-auto text-xs text-muted-foreground" title={formatDateTime(note.at)}>
                  {formatRelative(note.at)}
                </time>
              </div>
              <p className="mt-2 text-sm text-pretty whitespace-pre-line">{note.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Interviews                                                          */
/* ------------------------------------------------------------------ */

export function InterviewsTab({
  application,
  actions,
  onSchedule,
  disabled,
}: {
  application: Application;
  actions: InterviewActions;
  onSchedule: () => void;
  disabled: boolean;
}) {
  const interviews = useAppStore((s) => s.interviews);
  const mine = useMemo(
    () => interviews.filter((i) => i.applicationId === application.id).sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt)),
    [interviews, application.id],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {mine.length === 0 ? "No interviews scheduled yet." : `${mine.length} interview${mine.length === 1 ? "" : "s"} for this application`}
        </p>
        <Button variant="gradient" size="sm" onClick={onSchedule} disabled={disabled}>
          <CalendarPlus aria-hidden />
          Schedule interview
        </Button>
      </div>
      {mine.length > 0 && (
        <ul className="space-y-3">
          {mine.map((interview) => (
            <li key={interview.id}>
              <InterviewCard
                interview={interview}
                viewer="employer"
                onReschedule={actions.onReschedule}
                onCancel={actions.onCancel}
                onComplete={actions.onComplete}
                onNotes={actions.onNotes}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StatusLine({ application }: { application: Application }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <StatusBadge status={application.status} context="ats" size="sm" />
      Updated {formatRelative(application.updatedAt)}
    </div>
  );
}
