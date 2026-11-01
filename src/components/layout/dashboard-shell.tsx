"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { RoleGuard } from "@/components/layout/role-guard";
import type { Role } from "@/types";

/**
 * Shared dashboard layout for all three roles: guard + sidebar + header + content.
 * Used by the (seeker), employer and admin route-group layouts.
 */
export function DashboardShell({ role, children }: { role: Role; children: React.ReactNode }) {
  return (
    <RoleGuard role={role}>
      <div className="flex min-h-dvh">
        <AppSidebar role={role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader role={role} />
          <main id="main-content" className="mx-auto w-full max-w-[1500px] flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
