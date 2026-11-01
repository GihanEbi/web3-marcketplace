"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Eye, MoreHorizontal, ShieldBan, TriangleAlert, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { SkillTagList } from "@/components/shared/skill-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { DEMO_ACCOUNTS } from "@/lib/constants";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { setUserStatus } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser, useHydrated } from "@/store/hooks";
import type { AccountStatus, User } from "@/types";
import { PlanBadge, RoleBadge } from "./admin-badges";
import { FilterPills, type FilterPillOption } from "./filter-pills";
import { useAdminAction } from "./use-admin-action";
import { useUrlEnum, useUrlState } from "./use-url-state";

const ROLE_VALUES = ["all", "seeker", "employer", "admin"] as const;
const STATUS_VALUES = ["all", "active", "pending", "suspended"] as const;
type RoleFilter = (typeof ROLE_VALUES)[number];
type StatusFilter = (typeof STATUS_VALUES)[number];

const ROLE_FILTER_LABEL: Record<RoleFilter, string> = {
  all: "All users",
  seeker: "Job seekers",
  employer: "Employers",
  admin: "Admins",
};

const DEMO_USER_IDS: string[] = Object.values(DEMO_ACCOUNTS).map((a) => a.userId);

export function UsersManager() {
  const hydrated = useHydrated();
  const users = useAppStore((s) => s.users);
  const [query, setQuery] = useUrlState("q");
  const [role, setRole] = useUrlEnum<RoleFilter>("role", ROLE_VALUES, "all");
  const [status, setStatus] = useUrlEnum<StatusFilter>("status", STATUS_VALUES, "all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const { run, isPending } = useAdminAction();
  const current = useCurrentUser();

  const roleCounts = useMemo(() => {
    const counts: Record<RoleFilter, number> = { all: users.length, seeker: 0, employer: 0, admin: 0 };
    users.forEach((u) => {
      counts[u.role] += 1;
    });
    return counts;
  }, [users]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: users.length, active: 0, pending: 0, suspended: 0 };
    users.forEach((u) => {
      counts[u.status] += 1;
    });
    return counts;
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => {
        if (role !== "all" && u.role !== role) return false;
        if (status !== "all" && u.status !== status) return false;
        if (!q) return true;
        return [u.name, u.email, u.title ?? "", u.plan, u.role].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt));
  }, [users, query, role, status]);

  const detailUser = useMemo(() => users.find((u) => u.id === detailId) ?? null, [users, detailId]);

  function changeStatus(user: User, next: AccountStatus) {
    const verb = next === "active" ? "activated" : next === "pending" ? "marked as pending" : "suspended";
    return run(`status:${user.id}`, () => setUserStatus(user.id, next), `${user.name} was ${verb}.`);
  }

  const columns: DataTableColumn<User>[] = [
    {
      key: "name",
      header: "User",
      sortValue: (u) => u.name,
      cell: (u) => (
        <div className="flex min-w-44 items-center gap-3">
          <UserAvatar name={u.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{u.name}</p>
            {u.title && <p className="truncate text-xs text-muted-foreground">{u.title}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "E-mail",
      sortValue: (u) => u.email,
      cell: (u) => <span className="text-muted-foreground">{u.email}</span>,
    },
    { key: "role", header: "Role", sortValue: (u) => u.role, cell: (u) => <RoleBadge role={u.role} /> },
    { key: "plan", header: "Plan", sortValue: (u) => u.plan, cell: (u) => <PlanBadge plan={u.plan} /> },
    {
      key: "status",
      header: "Status",
      sortValue: (u) => u.status,
      cell: (u) => <StatusBadge status={u.status} context="generic" />,
    },
    {
      key: "joined",
      header: "Joined",
      sortValue: (u) => Date.parse(u.joinedAt),
      cell: (u) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(u.joinedAt)}</span>,
    },
    {
      key: "active",
      header: "Last active",
      sortValue: (u) => (u.lastActiveAt ? Date.parse(u.lastActiveAt) : 0),
      cell: (u) => <span className="whitespace-nowrap text-muted-foreground">{formatRelative(u.lastActiveAt)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12 text-right",
      cell: (u) => {
        const busy = isPending(`status:${u.id}`);
        return (
          <span data-no-row-click onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${u.name}`} disabled={busy} />}
              >
                <MoreHorizontal aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{u.name}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setDetailId(u.id)}>
                    <Eye aria-hidden /> View details
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Change status</DropdownMenuLabel>
                  {u.status !== "active" && (
                    <DropdownMenuItem onClick={() => void changeStatus(u, "active")}>
                      <CheckCircle2 aria-hidden /> Activate
                    </DropdownMenuItem>
                  )}
                  {u.status !== "pending" && (
                    <DropdownMenuItem onClick={() => void changeStatus(u, "pending")}>
                      <Clock aria-hidden /> Mark as pending
                    </DropdownMenuItem>
                  )}
                  {u.status !== "suspended" && (
                    <DropdownMenuItem variant="destructive" onClick={() => setSuspendTarget(u)}>
                      <ShieldBan aria-hidden /> Suspend
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        );
      },
    },
  ];

  if (!hydrated) return <LoadingSkeleton variant="page" />;

  const roleOptions: FilterPillOption<RoleFilter>[] = ROLE_VALUES.map((value) => ({
    value,
    label: ROLE_FILTER_LABEL[value],
    count: roleCounts[value],
  }));

  const statusOptions = STATUS_VALUES.map((value) => ({
    value,
    label: `${value === "all" ? "All statuses" : value.charAt(0).toUpperCase() + value.slice(1)} (${statusCounts[value]})`,
  }));

  const hasFilters = query.trim() !== "" || role !== "all" || status !== "all";
  const suspendingDemo = suspendTarget ? DEMO_USER_IDS.includes(suspendTarget.id) : false;
  const suspendingSelf = suspendTarget ? suspendTarget.id === current?.id : false;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description={`${formatNumber(users.length)} accounts · ${statusCounts.active} active, ${statusCounts.pending} pending, ${statusCounts.suspended} suspended.`}
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name, e-mail or plan…"
            aria-label="Search users"
            className="sm:max-w-sm"
          />
          <SelectField
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
            options={statusOptions}
            aria-label="Filter by status"
            className="sm:w-48"
          />
        </div>
        <FilterPills options={roleOptions} value={role} onChange={setRole} aria-label="Filter by role" />
      </div>

      <DataTable
        caption="Platform users"
        columns={columns}
        data={filtered}
        rowKey={(u) => u.id}
        onRowClick={(u) => setDetailId(u.id)}
        pageSize={10}
        emptyState={
          <EmptyState
            icon={Users}
            title="No users match your filters"
            description="Try a different search term or clear the role and status filters."
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setRole("all");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        }
      />

      <UserDetailSheet
        user={detailUser}
        onClose={() => setDetailId(null)}
        onChangeStatus={(user, next) => (next === "suspended" ? setSuspendTarget(user) : void changeStatus(user, next))}
        busy={detailUser ? isPending(`status:${detailUser.id}`) : false}
      />

      <ConfirmationDialog
        open={suspendTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSuspendTarget(null);
        }}
        title={suspendTarget ? `Suspend ${suspendTarget.name}?` : "Suspend account?"}
        destructive
        confirmLabel="Suspend account"
        description={
          <span className="space-y-2">
            <span className="block">
              {suspendTarget?.name} will not be able to log in while suspended. You can reactivate the account at any
              time.
            </span>
            {suspendingDemo && (
              <span className="flex items-start gap-1.5 text-warning">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  This is one of the demo accounts. Once suspended it cannot be used from the login page until it is
                  reactivated or the demo data is reset in Settings.
                </span>
              </span>
            )}
            {suspendingSelf && (
              <span className="flex items-start gap-1.5 text-warning">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  This is your own account. Your current session stays open, but you will not be able to sign back in.
                </span>
              </span>
            )}
          </span>
        }
        onConfirm={async () => {
          if (suspendTarget) await changeStatus(suspendTarget, "suspended");
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detail sheet                                                        */
/* ------------------------------------------------------------------ */

function UserDetailSheet({
  user,
  onClose,
  onChangeStatus,
  busy,
}: {
  user: User | null;
  onClose: () => void;
  onChangeStatus: (user: User, status: AccountStatus) => void;
  busy: boolean;
}) {
  const candidates = useAppStore((s) => s.candidates);
  const companies = useAppStore((s) => s.companies);
  const applications = useAppStore((s) => s.applications);
  const jobs = useAppStore((s) => s.jobs);
  const subscriptions = useAppStore((s) => s.subscriptions);

  const details = useMemo(() => {
    if (!user) return null;
    const candidate = user.candidateId ? candidates.find((c) => c.id === user.candidateId) : undefined;
    const company = user.companyId ? companies.find((c) => c.id === user.companyId) : undefined;
    return {
      candidate,
      company,
      applicationCount: candidate ? applications.filter((a) => a.candidateId === candidate.id).length : 0,
      jobCount: company ? jobs.filter((j) => j.companyId === company.id).length : 0,
      activeJobCount: company ? jobs.filter((j) => j.companyId === company.id && j.status === "published").length : 0,
      subscription: subscriptions.find((s) => s.userId === user.id),
    };
  }, [user, candidates, companies, applications, jobs, subscriptions]);

  return (
    <Sheet open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        {user && details && (
          <>
            <SheetHeader className="pr-12">
              <div className="flex items-center gap-3">
                <UserAvatar name={user.name} size="lg" src={details.candidate?.avatar} />
                <div className="min-w-0">
                  <SheetTitle className="truncate text-lg">{user.name}</SheetTitle>
                  <SheetDescription className="truncate">{user.email}</SheetDescription>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RoleBadge role={user.role} />
                <PlanBadge plan={user.plan} />
                <StatusBadge status={user.status} context="generic" />
              </div>
            </SheetHeader>

            <div className="space-y-5 px-4 text-sm">
              <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2.5">
                <dt className="text-muted-foreground">Joined</dt>
                <dd>{formatDate(user.joinedAt)}</dd>
                <dt className="text-muted-foreground">Last active</dt>
                <dd>{formatRelative(user.lastActiveAt)}</dd>
                {user.walletAddress && (
                  <>
                    <dt className="text-muted-foreground">Wallet</dt>
                    <dd className="font-mono text-xs break-all">{user.walletAddress}</dd>
                  </>
                )}
                {user.title && (
                  <>
                    <dt className="text-muted-foreground">Job title</dt>
                    <dd>{user.title}</dd>
                  </>
                )}
              </dl>

              <Separator />

              {details.candidate && (
                <section className="space-y-3" aria-label="Seeker profile">
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Seeker profile
                  </h3>
                  <div>
                    <p className="font-medium">{details.candidate.headline}</p>
                    <p className="text-muted-foreground">
                      {details.candidate.location} · {details.candidate.yearsOfExperience} yrs experience ·{" "}
                      {details.candidate.experienceLevel}
                    </p>
                  </div>
                  <SkillTagList skills={details.candidate.skills} max={8} />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">{details.applicationCount}</span>{" "}
                    {details.applicationCount === 1 ? "application" : "applications"} submitted
                  </p>
                </section>
              )}

              {details.company && (
                <section className="space-y-3" aria-label="Employer profile">
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Employer profile
                  </h3>
                  <div>
                    <Link
                      href={`/companies/${details.company.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {details.company.name}
                    </Link>
                    <p className="text-muted-foreground">
                      {details.company.industry} · {details.company.location}
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">{details.jobCount}</span>{" "}
                    {details.jobCount === 1 ? "job" : "jobs"} created ·{" "}
                    <span className="font-medium text-foreground tabular-nums">{details.activeJobCount}</span> live
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <StatusBadge
                      status={details.company.verified ? "approved" : "pending"}
                      label={details.company.verified ? "Company verified" : "Company unverified"}
                      size="sm"
                    />
                    {details.company.suspended && (
                      <StatusBadge status="suspended" label="Listings suspended" size="sm" />
                    )}
                  </div>
                </section>
              )}

              {user.role === "admin" && (
                <p className="text-muted-foreground">Platform administrator account with access to moderation tools.</p>
              )}

              <Separator />

              <section className="space-y-2" aria-label="Subscription">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Subscription</h3>
                {details.subscription ? (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div>
                      <p className="font-medium capitalize">{details.subscription.plan}</p>
                      <p className="text-xs text-muted-foreground">
                        ${details.subscription.amountMonthly}/month ·{" "}
                        {details.subscription.status === "cancelled" ? "ends" : "renews"}{" "}
                        {formatDate(details.subscription.renewsAt)}
                      </p>
                    </div>
                    <StatusBadge status={details.subscription.status} size="sm" />
                  </div>
                ) : (
                  <p className="text-muted-foreground">On the Free plan, no paid subscription.</p>
                )}
              </section>
            </div>

            <SheetFooter className="border-t border-border">
              <p className="text-xs text-muted-foreground">Change account status</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || user.status === "active"}
                  onClick={() => onChangeStatus(user, "active")}
                >
                  <CheckCircle2 aria-hidden /> Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || user.status === "pending"}
                  onClick={() => onChangeStatus(user, "pending")}
                >
                  <Clock aria-hidden /> Mark pending
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy || user.status === "suspended"}
                  onClick={() => onChangeStatus(user, "suspended")}
                >
                  <ShieldBan aria-hidden /> Suspend
                </Button>
              </div>
              {user.role === "employer" && user.companyId && (
                <Link
                  href={`/admin/companies?q=${encodeURIComponent(details.company?.name ?? "")}`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Manage company
                </Link>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
