"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Eye, Loader2, MessageSquare, MoreHorizontal, Star, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIMatchScore } from "@/components/shared/ai-match-score";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { SkillTagList } from "@/components/shared/skill-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDate } from "@/lib/format";
import { ATS_STAGE_LABEL } from "@/lib/constants";
import type { ApplicationStatus } from "@/types";
import { STAGE_OPTIONS, type ApplicantRow } from "./ats-utils";
import type { AtsWorkflow } from "./use-ats-workflow";

interface ApplicantsTableProps {
  rows: ApplicantRow[];
  workflow: AtsWorkflow;
  onOpen: (applicationId: string) => void;
  /** search + status filter above the table (default true) */
  showToolbar?: boolean;
  pageSize?: number;
}

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  ...STAGE_OPTIONS,
  { value: "withdrawn", label: "Withdrawn" },
];

export function ApplicantsTable({ rows, workflow, onOpen, showToolbar = true, pageSize = 10 }: ApplicantsTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const { pendingStatus } = workflow;

  const filtered = useMemo(() => {
    if (!showToolbar) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter(({ application, candidate }) => {
      const current = pendingStatus[application.id] ?? application.status;
      if (status !== "all" && current !== status) return false;
      if (!q) return true;
      return (
        candidate.name.toLowerCase().includes(q) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(q)) ||
        candidate.headline.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status, showToolbar, pendingStatus]);

  const columns = useMemo<DataTableColumn<ApplicantRow>[]>(
    () => [
      {
        key: "candidate",
        header: "Candidate",
        sortValue: (r) => r.candidate.name,
        cell: ({ candidate }) => (
          <div className="flex min-w-48 items-center gap-3">
            <UserAvatar name={candidate.name} src={candidate.avatar} size="md" />
            <div className="min-w-0">
              <p className="truncate font-medium">{candidate.name}</p>
              <p className="truncate text-xs text-muted-foreground">{candidate.headline}</p>
            </div>
          </div>
        ),
      },
      {
        key: "job",
        header: "Applied for",
        sortValue: (r) => r.job?.title ?? "",
        cell: ({ job }) => <span className="block max-w-44 truncate text-muted-foreground">{job?.title ?? "Role unavailable"}</span>,
      },
      {
        key: "experience",
        header: "Experience",
        sortValue: (r) => r.candidate.yearsOfExperience,
        cell: ({ candidate }) => (
          <span className="whitespace-nowrap tabular-nums">
            {candidate.yearsOfExperience} {candidate.yearsOfExperience === 1 ? "yr" : "yrs"}
          </span>
        ),
      },
      {
        key: "skills",
        header: "Top skills",
        cell: ({ candidate, job }) => (
          <div className="min-w-40">
            <SkillTagList skills={candidate.skills} max={3} highlight={job?.skills} />
          </div>
        ),
      },
      {
        key: "applied",
        header: "Applied",
        sortValue: (r) => Date.parse(r.application.appliedAt),
        cell: ({ application }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(application.appliedAt)}</span>,
      },
      {
        key: "match",
        header: "Match",
        sortValue: (r) => r.application.matchScore,
        cell: ({ application }) => <AIMatchScore score={application.matchScore} size="sm" />,
      },
      {
        key: "status",
        header: "Status",
        sortValue: (r) => ATS_STAGE_LABEL[(pendingStatus[r.application.id] ?? r.application.status) as keyof typeof ATS_STAGE_LABEL] ?? "Withdrawn",
        cell: ({ application }) => (
          <StatusBadge status={pendingStatus[application.id] ?? application.status} context="ats" size="sm" />
        ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        headerClassName: "w-12",
        cell: (row) => (
          // Menu popups are portalled, but React clicks still bubble to the row: stop them here.
          <div onClick={(e) => e.stopPropagation()} data-no-row-click>
            <RowActions row={row} workflow={workflow} onOpen={onOpen} />
          </div>
        ),
      },
    ],
    [pendingStatus, workflow, onOpen],
  );

  return (
    <div className="space-y-4">
      {showToolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name, headline or skill…"
            aria-label="Search applicants"
            className="sm:max-w-sm"
          />
          <SelectField
            aria-label="Filter by status"
            value={status}
            onChange={setStatus}
            options={STATUS_FILTERS}
            className="sm:w-48"
          />
          <p className="text-xs text-muted-foreground sm:ml-auto" aria-live="polite">
            {filtered.length} of {rows.length} applicants
          </p>
        </div>
      )}
      <DataTable
        caption="Applicants"
        columns={columns}
        data={filtered}
        rowKey={(r) => r.application.id}
        onRowClick={(r) => onOpen(r.application.id)}
        pageSize={pageSize}
        emptyState={
          <EmptyState
            icon={Users}
            title="No applicants match"
            description="Try a different search term or status filter."
            className="border-0 bg-transparent py-6"
          />
        }
      />
    </div>
  );
}

function RowActions({
  row,
  workflow,
  onOpen,
}: {
  row: ApplicantRow;
  workflow: AtsWorkflow;
  onOpen: (id: string) => void;
}) {
  const { application, candidate } = row;
  const status: ApplicationStatus = workflow.pendingStatus[application.id] ?? application.status;
  const withdrawn = status === "withdrawn";
  const messaging = workflow.messagingId === application.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${candidate.name}`} />}
      >
        {messaging ? <Loader2 className="animate-spin" aria-hidden /> : <MoreHorizontal aria-hidden />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onOpen(application.id)}>
          <Eye aria-hidden />
          View candidate
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={withdrawn || status === "shortlisted"}
          onClick={() => workflow.requestStatus(application.id, "shortlisted")}
        >
          <Star aria-hidden />
          Shortlist
        </DropdownMenuItem>
        <DropdownMenuItem disabled={withdrawn} onClick={() => workflow.openSchedule(application.id)}>
          <CalendarPlus aria-hidden />
          Schedule interview
        </DropdownMenuItem>
        <DropdownMenuItem disabled={messaging} onClick={() => void workflow.messageCandidate(application.id)}>
          <MessageSquare aria-hidden />
          Send message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={withdrawn || status === "rejected" || status === "hired"}
          onClick={() => workflow.requestStatus(application.id, "rejected")}
        >
          <UserX aria-hidden />
          Reject
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
