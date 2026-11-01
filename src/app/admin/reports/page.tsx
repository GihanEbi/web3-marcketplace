import { Suspense } from "react";
import { ReportsQueue } from "@/components/admin/reports-queue";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export const metadata = { title: "Reports & disputes" };

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="page" />}>
      <ReportsQueue />
    </Suspense>
  );
}
