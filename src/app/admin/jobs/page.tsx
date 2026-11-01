import { Suspense } from "react";
import { JobsModeration } from "@/components/admin/jobs-moderation";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export const metadata = { title: "Job moderation" };

export default function AdminJobsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="page" />}>
      <JobsModeration />
    </Suspense>
  );
}
