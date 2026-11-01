"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ExternalLink, KanbanSquare, Pencil, Table2, Users } from "lucide-react";
import { ApplicantsTable } from "@/components/ats/applicants-table";
import { CandidateDetailSheet } from "@/components/ats/candidate-detail-sheet";
import { RecruitmentKanban } from "@/components/ats/recruitment-kanban";
import { useApplicantRows } from "@/components/ats/ats-utils";
import { useAtsWorkflow } from "@/components/ats/use-ats-workflow";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, NotFoundState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, statusTone, TONE_DOT } from "@/components/shared/status-badge";
import { ATS_STAGE_LABEL, ATS_STAGES } from "@/lib/constants";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser, useHydrated, useJob } from "@/store/hooks";

function ApplicantsContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const appParam = searchParams.get("app");

  const hydrated = useHydrated();
  const user = useCurrentUser();
  const job = useJob(id);
  const allApplications = useAppStore((s) => s.applications);
  const workflow = useAtsWorkflow();

  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [openId, setOpenId] = useState<string | null>(appParam);
  const [lastParam, setLastParam] = useState<string | null>(appParam);
  if (appParam !== lastParam) {
    setLastParam(appParam);
    if (appParam) setOpenId(appParam);
  }

  const applications = useMemo(
    () => allApplications.filter((a) => a.jobId === id && a.companyId === user?.companyId),
    [allApplications, id, user],
  );
  const rows = useApplicantRows(applications);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const { application } of rows) {
      const status = workflow.pendingStatus[application.id] ?? application.status;
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }, [rows, workflow.pendingStatus]);

  if (!hydrated) return <LoadingSkeleton variant="page" />;

  if (!job || job.companyId !== user?.companyId) {
    return <NotFoundState entity="job" backHref="/employer/jobs" backLabel="Back to my jobs" />;
  }

  const openApplication = (applicationId: string) => setOpenId(applicationId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Applicant tracking"
        title={job.title}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <StatusBadge status={job.status} context="job" />
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" aria-hidden />
              {pluralize(rows.length, "applicant")}
            </span>
            <span>
              {job.location} · {job.type}
            </span>
          </span>
        }
        actions={
          <>
            <Link href={`/employer/jobs/${job.id}/edit`} className={buttonVariants({ variant: "outline" })}>
              <Pencil aria-hidden />
              Edit job
            </Link>
            <Link href={`/jobs/${job.id}`} className={buttonVariants({ variant: "outline" })}>
              <ExternalLink aria-hidden />
              View public page
            </Link>
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants yet"
          description="Candidates who apply to this job will appear here, ready to review, shortlist and interview."
          action={
            <Link href={`/jobs/${job.id}`} className={buttonVariants({ variant: "gradient" })}>
              <ExternalLink aria-hidden />
              View public page
            </Link>
          }
        />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" aria-label="Applicants per stage">
            {ATS_STAGES.map((stage) => (
              <li key={stage} className="rounded-xl border border-border bg-card px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span aria-hidden className={cn("size-1.5 rounded-full", TONE_DOT[statusTone(stage)])} />
                  {ATS_STAGE_LABEL[stage]}
                </p>
                <p className="mt-0.5 font-heading text-xl font-semibold tabular-nums">{stageCounts[stage] ?? 0}</p>
              </li>
            ))}
          </ul>

          <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "table")} className="gap-4">
            <TabsList>
              <TabsTrigger value="kanban" className="px-3">
                <KanbanSquare aria-hidden />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="table" className="px-3">
                <Table2 aria-hidden />
                Table
              </TabsTrigger>
            </TabsList>
            <TabsContent value="kanban">
              <p className="mb-3 text-xs text-muted-foreground">
                Drag candidates between columns, or use <span className="font-medium text-foreground">Move to…</span> on any card.
              </p>
              <RecruitmentKanban
                rows={rows}
                pendingStatus={workflow.pendingStatus}
                onMove={workflow.requestStatus}
                onOpen={openApplication}
              />
            </TabsContent>
            <TabsContent value="table">
              <ApplicantsTable rows={rows} workflow={workflow} onOpen={openApplication} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <CandidateDetailSheet
        applicationId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        onApplicationChange={setOpenId}
      />
      {workflow.dialogs}
    </div>
  );
}

export default function JobApplicantsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="page" />}>
      <ApplicantsContent />
    </Suspense>
  );
}
