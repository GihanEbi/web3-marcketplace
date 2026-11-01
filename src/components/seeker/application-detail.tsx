"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Paperclip,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIMatchScore, MatchBreakdown } from "@/components/shared/ai-match-score";
import { ApplicationProgressBar, ApplicationStatusTimeline } from "@/components/shared/application-status-timeline";
import { CompanyLogo } from "@/components/shared/company-logo";
import { InterviewCard } from "@/components/shared/interview-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { NotFoundState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { computeMatch } from "@/lib/matching";
import { formatCurrency, formatDate, formatDateTime, formatJobSalary, formatRelative } from "@/lib/format";
import { startConversation } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useHydrated } from "@/store/hooks";
import { canWithdraw } from "./job-utils";
import { WithdrawDialog } from "./withdraw-dialog";

function Detail({ icon: Icon, label, children }: { icon: typeof Banknote; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium break-words">{children}</dd>
      </div>
    </div>
  );
}

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const candidate = useCurrentCandidate();
  const applications = useAppStore((s) => s.applications);
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const interviews = useAppStore((s) => s.interviews);
  const conversations = useAppStore((s) => s.conversations);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const app = useMemo(() => applications.find((a) => a.id === id), [applications, id]);
  const job = useMemo(() => jobs.find((j) => j.id === app?.jobId), [jobs, app]);
  const company = useMemo(() => companies.find((c) => c.id === app?.companyId), [companies, app]);
  const match = useMemo(() => (candidate && job ? computeMatch(candidate, job) : null), [candidate, job]);
  const appInterviews = useMemo(
    () =>
      interviews
        .filter((i) => i.applicationId === id)
        .sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt)),
    [interviews, id],
  );
  const conversation = useMemo(
    () =>
      conversations.find(
        (c) => c.candidateId === candidate?.id && (c.applicationId === id || (!c.applicationId && c.jobId === app?.jobId)),
      ),
    [conversations, candidate, id, app],
  );

  if (!hydrated || !candidate) return <LoadingSkeleton variant="detail" />;

  if (!app || app.candidateId !== candidate.id) {
    return <NotFoundState entity="application" backHref="/applications" backLabel="Back to my applications" />;
  }

  async function messageRecruiter() {
    if (!app || !job || !candidate) return;
    setStartingChat(true);
    try {
      const conv = await startConversation({
        candidateId: candidate.id,
        companyId: app.companyId,
        employerUserId: job.postedBy,
        subject: `Application: ${job.title}`,
        applicationId: app.id,
        jobId: job.id,
      });
      router.push(`/messages?c=${conv.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the conversation");
      setStartingChat(false);
    }
  }

  const withdrawable = canWithdraw(app.status);

  return (
    <div className="space-y-6">
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All applications
      </Link>

      <section className="card-glow rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            {company && <CompanyLogo company={company} size="lg" />}
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">{job?.title ?? "Job no longer available"}</h1>
                <StatusBadge status={app.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {company ? (
                  <Link href={`/companies/${company.id}`} className="font-medium text-foreground hover:text-primary">
                    {company.name}
                  </Link>
                ) : (
                  "Unknown company"
                )}
                {job && (
                  <>
                    {" · "}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden />
                      {job.location}
                    </span>
                    {" · "}
                    {job.type} · {job.workMode}
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Applied {formatDate(app.appliedAt)} · Updated {formatRelative(app.updatedAt)} · Ref {app.id}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {job && (
              <Link href={`/jobs/${job.id}`} className={buttonVariants({ variant: "outline" })}>
                <Briefcase aria-hidden />
                View job
              </Link>
            )}
            {conversation ? (
              <Link href={`/messages?c=${conversation.id}`} className={buttonVariants({ variant: "outline" })}>
                <MessageSquare aria-hidden />
                Open conversation
              </Link>
            ) : (
              job && (
                <Button variant="outline" onClick={messageRecruiter} disabled={startingChat}>
                  {startingChat ? <Loader2 className="animate-spin" aria-hidden /> : <MessageSquare aria-hidden />}
                  Message recruiter
                </Button>
              )
            )}
            {withdrawable && (
              <Button variant="destructive" onClick={() => setWithdrawOpen(true)}>
                <Undo2 aria-hidden />
                Withdraw
              </Button>
            )}
          </div>
        </div>
        <div className="mt-6 border-t border-border pt-6">
          <ApplicationProgressBar status={app.status} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" aria-hidden />
                Your submission
              </CardTitle>
              <CardDescription>Exactly what the hiring team sees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section aria-label="Cover letter" className="space-y-2">
                <h3 className="text-sm font-semibold">Cover letter</h3>
                <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-line">
                  {app.coverLetter || "No cover letter was included."}
                </p>
              </section>

              {app.screeningAnswers.length > 0 && (
                <section aria-label="Screening questions" className="space-y-3">
                  <h3 className="text-sm font-semibold">Screening questions</h3>
                  <ul className="space-y-3">
                    {app.screeningAnswers.map((qa, index) => (
                      <li key={`${index}-${qa.question}`} className="rounded-lg border border-border p-4">
                        <p className="text-sm font-medium">{qa.question}</p>
                        <p className="mt-1.5 text-sm text-pretty whitespace-pre-line text-muted-foreground">{qa.answer}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </CardContent>
          </Card>

          {match && (
            <Card>
              <CardHeader>
                <CardTitle>How you match this role</CardTitle>
                <CardDescription>Based on your current profile and the job requirements.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <AIMatchScore score={match.score} size="lg" showLabel />
                <MatchBreakdown match={match} />
              </CardContent>
            </Card>
          )}

          {appInterviews.length > 0 && (
            <section aria-label="Interviews" className="space-y-3">
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
                <CalendarClock className="size-5 text-primary" aria-hidden />
                Interviews for this application
              </h2>
              {appInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} viewer="seeker" />
              ))}
            </section>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <Detail icon={Banknote} label="Your expected salary">
                  {formatCurrency(app.expectedSalary, app.salaryCurrency)}
                  {job && <span className="block text-xs font-normal text-muted-foreground">Posted: {formatJobSalary(job)}</span>}
                </Detail>
                <Detail icon={CalendarDays} label="Availability">
                  {app.availability}
                </Detail>
                <Detail icon={Paperclip} label="Resume">
                  {app.resumeName}
                </Detail>
                <Detail icon={ExternalLink} label="Portfolio">
                  {app.portfolioUrl ? (
                    <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {app.portfolioUrl}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </Detail>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
              <CardDescription>Updates from the hiring team appear here instantly.</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationStatusTimeline events={app.timeline} currentStatus={app.status} context="candidate" />
            </CardContent>
          </Card>

          {job && (
            <p className="px-1 text-xs text-muted-foreground">
              Deadline for this role: {formatDateTime(job.deadline)}
            </p>
          )}
        </div>
      </div>

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        applicationId={app.id}
        jobTitle={job?.title}
        companyName={company?.name}
      />
    </div>
  );
}
