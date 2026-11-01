"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Loader2, MapPin, MessageSquare, Star, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIMatchScore } from "@/components/shared/ai-match-score";
import { ApplicationStatusTimeline } from "@/components/shared/application-status-timeline";
import { SelectField } from "@/components/shared/select-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ATS_STAGE_LABEL } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/format";
import { computeMatch } from "@/lib/matching";
import { useAppStore } from "@/store/app-store";
import { useApplication, useCandidate, useCurrentUser, useHydrated, useJob } from "@/store/hooks";
import type { Application } from "@/types";
import { STAGE_OPTIONS } from "./ats-utils";
import {
  AIMatchTab,
  ApplicationTab,
  InterviewsTab,
  NotesTab,
  OverviewTab,
  ResumeTab,
} from "./candidate-detail-tabs";
import { useAtsWorkflow } from "./use-ats-workflow";
import { useInterviewActions } from "./use-interview-actions";

interface CandidateDetailSheetProps {
  applicationId: string | null;
  onOpenChange: (open: boolean) => void;
  /** Called when the recruiter picks another application of the same candidate in the header */
  onApplicationChange?: (applicationId: string) => void;
}

export function CandidateDetailSheet({ applicationId, onOpenChange, onApplicationChange }: CandidateDetailSheetProps) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  // Keep the last shown id while the sheet animates closed.
  const [shownId, setShownId] = useState<string | null>(applicationId);
  if (applicationId && applicationId !== shownId) setShownId(applicationId);

  const application = useApplication(shownId ?? undefined);
  const allowed = Boolean(hydrated && application && user?.companyId && application.companyId === user.companyId);

  return (
    <Sheet open={Boolean(applicationId) && allowed} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
        {allowed && application && (
          <SheetBody key={application.id} application={application} onApplicationChange={onApplicationChange} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({
  application,
  onApplicationChange,
}: {
  application: Application;
  onApplicationChange?: (applicationId: string) => void;
}) {
  const candidate = useCandidate(application.candidateId);
  const job = useJob(application.jobId);
  const allApplications = useAppStore((s) => s.applications);
  const jobs = useAppStore((s) => s.jobs);
  const interviews = useAppStore((s) => s.interviews);
  const workflow = useAtsWorkflow();
  const interviewActions = useInterviewActions();

  const match = useMemo(() => (candidate && job ? computeMatch(candidate, job) : null), [candidate, job]);
  const siblings = useMemo(
    () => allApplications.filter((a) => a.candidateId === application.candidateId && a.companyId === application.companyId),
    [allApplications, application.candidateId, application.companyId],
  );
  const interviewCount = useMemo(
    () => interviews.filter((i) => i.applicationId === application.id).length,
    [interviews, application.id],
  );

  const status = workflow.pendingStatus[application.id] ?? application.status;
  const withdrawn = status === "withdrawn";
  const closed = withdrawn || status === "rejected" || status === "hired";
  const messaging = workflow.messagingId === application.id;

  if (!candidate) {
    return (
      <SheetHeader className="p-5">
        <SheetTitle>Candidate unavailable</SheetTitle>
        <SheetDescription>This candidate profile could not be found.</SheetDescription>
      </SheetHeader>
    );
  }

  const statusOptions = withdrawn ? [...STAGE_OPTIONS, { value: "withdrawn", label: "Withdrawn" }] : STAGE_OPTIONS;

  return (
    <>
      <div className="shrink-0 space-y-4 border-b border-border p-5 pr-12">
        <div className="flex items-start gap-4">
          <UserAvatar name={candidate.name} src={candidate.avatar} size="lg" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-xl leading-tight">{candidate.name}</SheetTitle>
            <SheetDescription className="truncate">{candidate.headline}</SheetDescription>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {candidate.location}
              </span>
              <span>
                Applied for{" "}
                {job ? (
                  <Link href={`/employer/jobs/${job.id}/applicants`} className="font-medium text-foreground hover:underline">
                    {job.title}
                  </Link>
                ) : (
                  "a removed role"
                )}{" "}
                · {formatDate(application.appliedAt)}
              </span>
            </p>
          </div>
          <AIMatchScore score={application.matchScore} size="md" />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 pb-1.5">
            <StatusBadge status={status} context="ats" />
            <span className="hidden text-xs text-muted-foreground sm:inline">Updated {formatRelative(application.updatedAt)}</span>
          </div>
          <div className="w-44 space-y-1">
            <label htmlFor="cd-status" className="text-xs font-medium text-muted-foreground">
              Update status
            </label>
            <SelectField
              id="cd-status"
              value={status}
              disabled={withdrawn}
              onChange={(value) => workflow.requestStatus(application.id, value as Application["status"])}
              options={statusOptions}
            />
          </div>
          {onApplicationChange && siblings.length > 1 && (
            <div className="w-56 space-y-1">
              <label htmlFor="cd-application" className="text-xs font-medium text-muted-foreground">
                Application ({siblings.length})
              </label>
              <SelectField
                id="cd-application"
                value={application.id}
                onChange={onApplicationChange}
                options={siblings.map((a) => ({
                  value: a.id,
                  label: `${jobs.find((j) => j.id === a.jobId)?.title ?? "Role"} · ${a.status === "withdrawn" ? "Withdrawn" : ATS_STAGE_LABEL[a.status]}`,
                }))}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={withdrawn || status === "shortlisted"}
            onClick={() => workflow.requestStatus(application.id, "shortlisted")}
          >
            <Star aria-hidden />
            Shortlist
          </Button>
          <Button size="sm" variant="gradient" disabled={withdrawn || status === "hired"} onClick={() => workflow.openSchedule(application.id)}>
            <CalendarPlus aria-hidden />
            Schedule interview
          </Button>
          <Button size="sm" variant="outline" disabled={messaging} onClick={() => void workflow.messageCandidate(application.id)}>
            {messaging ? <Loader2 className="animate-spin" aria-hidden /> : <MessageSquare aria-hidden />}
            Send message
          </Button>
          <Button size="sm" variant="destructive" disabled={closed} onClick={() => workflow.requestStatus(application.id, "rejected")}>
            <UserX aria-hidden />
            Reject
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="min-h-0 flex-1 gap-0">
        <div className="scrollbar-thin shrink-0 overflow-x-auto border-b border-border px-3">
          <TabsList variant="line" className="w-max group-data-horizontal/tabs:h-10">
            <TabsTrigger value="overview" className="px-3">Overview</TabsTrigger>
            <TabsTrigger value="resume" className="px-3">Resume</TabsTrigger>
            <TabsTrigger value="application" className="px-3">Application</TabsTrigger>
            <TabsTrigger value="ai" className="px-3">AI match</TabsTrigger>
            <TabsTrigger value="timeline" className="px-3">Timeline</TabsTrigger>
            <TabsTrigger value="notes" className="px-3">
              Notes{application.notes.length > 0 && <Count n={application.notes.length} />}
            </TabsTrigger>
            <TabsTrigger value="interviews" className="px-3">
              Interviews{interviewCount > 0 && <Count n={interviewCount} />}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="min-h-0 flex-1 overflow-y-auto p-5">
          <OverviewTab candidate={candidate} match={match} />
        </TabsContent>
        <TabsContent value="resume" className="min-h-0 flex-1 overflow-y-auto p-5">
          <ResumeTab candidate={candidate} application={application} />
        </TabsContent>
        <TabsContent value="application" className="min-h-0 flex-1 overflow-y-auto p-5">
          <ApplicationTab application={application} job={job} />
        </TabsContent>
        <TabsContent value="ai" className="min-h-0 flex-1 overflow-y-auto p-5">
          <AIMatchTab application={application} candidate={candidate} job={job} match={match} />
        </TabsContent>
        <TabsContent value="timeline" className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <ApplicationStatusTimeline events={application.timeline} currentStatus={application.status} context="ats" />
          </div>
        </TabsContent>
        <TabsContent value="notes" className="min-h-0 flex-1 overflow-y-auto p-5">
          <NotesTab application={application} />
        </TabsContent>
        <TabsContent value="interviews" className="min-h-0 flex-1 overflow-y-auto p-5">
          <InterviewsTab
            application={application}
            actions={interviewActions}
            onSchedule={() => workflow.openSchedule(application.id)}
            disabled={withdrawn}
          />
        </TabsContent>
      </Tabs>

      {workflow.dialogs}
      {interviewActions.dialogs}
    </>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-semibold text-primary tabular-nums">
      {n}
    </span>
  );
}
