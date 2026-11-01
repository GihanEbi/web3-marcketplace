"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, NotFoundState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCurrentCompany, useCurrentUser, useHydrated, useJob } from "@/store/hooks";
import { JobForm } from "./job-form";

const BACK = (
  <Link href="/employer/jobs" className={buttonVariants({ variant: "outline" })}>
    <ArrowLeft aria-hidden />
    Back to jobs
  </Link>
);

export function CreateJobPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const company = useCurrentCompany();

  if (!hydrated) return <LoadingSkeleton variant="page" />;
  if (!user || !company) {
    return <EmptyState icon={Building2} title="No company found" description="Sign in with an employer account to post jobs." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create a job"
        description="Fill in the details, preview how candidates will see it, then save a draft or publish."
        actions={BACK}
      />
      <JobForm company={company} userId={user.id} />
    </div>
  );
}

export function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const job = useJob(id);

  if (!hydrated) return <LoadingSkeleton variant="page" />;
  if (!user || !company) {
    return <EmptyState icon={Building2} title="No company found" description="Sign in with an employer account to edit jobs." />;
  }
  // Jobs of other companies are treated as missing.
  if (!job || job.companyId !== company.id) {
    return <NotFoundState entity="job" backHref="/employer/jobs" backLabel="Back to jobs" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit job"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {job.title}
            <StatusBadge status={job.status} size="sm" />
          </span>
        }
        actions={BACK}
      />
      <JobForm key={job.id} company={company} userId={user.id} job={job} />
    </div>
  );
}
