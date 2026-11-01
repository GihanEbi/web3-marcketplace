"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROLE_HOME, ROLE_LABEL } from "@/config/nav";
import { useCurrentUser, useHydrated } from "@/store/hooks";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import type { Role } from "@/types";

/**
 * Simulated protected layout. This is a UX demo only — frontend role checks
 * are NOT security. A real app would enforce this on the server.
 */
export function RoleGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  const mismatch = hydrated && user !== null && user.role !== role;
  const loggedOut = hydrated && user === null;

  useEffect(() => {
    if (loggedOut) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (mismatch && user) {
      toast.info(`That area is for ${ROLE_LABEL[role]} accounts`, {
        description: `You're signed in as ${ROLE_LABEL[user.role]}. Taking you to your dashboard.`,
      });
      router.replace(ROLE_HOME[user.role]);
    }
  }, [loggedOut, mismatch, user, role, router, pathname]);

  if (!hydrated || loggedOut || mismatch) {
    return (
      <div className="p-6" role="status" aria-live="polite">
        <span className="sr-only">Loading your workspace…</span>
        <LoadingSkeleton variant="page" />
      </div>
    );
  }
  return <>{children}</>;
}
