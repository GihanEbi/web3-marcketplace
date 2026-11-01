import { Suspense } from "react";
import { CompaniesManager } from "@/components/admin/companies-manager";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export const metadata = { title: "Companies" };

export default function AdminCompaniesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="page" />}>
      <CompaniesManager />
    </Suspense>
  );
}
