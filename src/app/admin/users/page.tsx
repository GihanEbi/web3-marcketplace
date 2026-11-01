import { Suspense } from "react";
import { UsersManager } from "@/components/admin/users-manager";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export const metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="page" />}>
      <UsersManager />
    </Suspense>
  );
}
