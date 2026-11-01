"use client";

import { useMemo, useState, type DragEvent } from "react";
import { Check, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CandidateCard } from "@/components/shared/candidate-card";
import { StatusBadge, statusTone, TONE_DOT } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ATS_STAGE_LABEL, ATS_STAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types";
import { STAGE_OPTIONS, type ApplicantRow, type AtsStage } from "./ats-utils";

interface RecruitmentKanbanProps {
  rows: ApplicantRow[];
  /** Optimistic status overrides (application id → status) */
  pendingStatus?: Record<string, ApplicationStatus>;
  onMove: (applicationId: string, status: ApplicationStatus) => void;
  onOpen: (applicationId: string) => void;
  className?: string;
}

const DRAG_TYPE = "text/plain";
const NO_PENDING: Record<string, ApplicationStatus> = {};

export function RecruitmentKanban({ rows, pendingStatus = NO_PENDING, onMove, onOpen, className }: RecruitmentKanbanProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<AtsStage | null>(null);

  const effectiveStatus = (application: Application): ApplicationStatus => pendingStatus[application.id] ?? application.status;

  const { columns, withdrawn } = useMemo(() => {
    const byStage = new Map<AtsStage, ApplicantRow[]>(ATS_STAGES.map((s) => [s, []]));
    const out: ApplicantRow[] = [];
    for (const row of rows) {
      const status = pendingStatus[row.application.id] ?? row.application.status;
      if (status === "withdrawn") out.push(row);
      else byStage.get(status)?.push(row);
    }
    for (const list of byStage.values()) {
      list.sort((a, b) => b.application.matchScore - a.application.matchScore);
    }
    return { columns: byStage, withdrawn: out };
  }, [rows, pendingStatus]);

  function handleDragStart(e: DragEvent<HTMLDivElement>, id: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(DRAG_TYPE, id);
    setDraggingId(id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setOverStage(null);
  }

  function handleDragOver(e: DragEvent<HTMLElement>, stage: AtsStage) {
    if (!draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overStage !== stage) setOverStage(stage);
  }

  function handleDragLeave(e: DragEvent<HTMLElement>, stage: AtsStage) {
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    if (overStage === stage) setOverStage(null);
  }

  function handleDrop(e: DragEvent<HTMLElement>, stage: AtsStage) {
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_TYPE) || draggingId;
    setDraggingId(null);
    setOverStage(null);
    if (!id) return;
    const row = rows.find((r) => r.application.id === id);
    if (!row || effectiveStatus(row.application) === stage) return;
    onMove(id, stage);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="scrollbar-thin -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3"
        role="group"
        aria-label="Recruitment pipeline"
      >
        {ATS_STAGES.map((stage) => {
          const items = columns.get(stage) ?? [];
          const isOver = overStage === stage;
          const tone = statusTone(stage);
          return (
            <section
              key={stage}
              aria-label={`${ATS_STAGE_LABEL[stage]} column, ${items.length} candidates`}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragEnter={(e) => handleDragOver(e, stage)}
              onDragLeave={(e) => handleDragLeave(e, stage)}
              onDrop={(e) => handleDrop(e, stage)}
              className={cn(
                "flex w-72 shrink-0 snap-start flex-col rounded-xl border bg-muted/30 transition-colors 2xl:w-auto 2xl:min-w-60 2xl:flex-1",
                isOver ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border",
              )}
            >
              <header className="flex items-center justify-between gap-2 px-3 py-2.5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <span aria-hidden className={cn("size-2 rounded-full", TONE_DOT[tone])} />
                  {ATS_STAGE_LABEL[stage]}
                </h3>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1.5 text-[11px] font-semibold text-muted-foreground tabular-nums ring-1 ring-border">
                  {items.length}
                </span>
              </header>
              <ul className="scrollbar-thin flex max-h-[calc(100vh-22rem)] min-h-28 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                {items.length === 0 && (
                  <li
                    className={cn(
                      "flex flex-1 items-center justify-center rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground",
                      isOver ? "border-primary/50 text-primary" : "border-border",
                    )}
                  >
                    {isOver ? "Drop to move here" : "No candidates"}
                  </li>
                )}
                {items.map((row) => (
                  <li key={row.application.id}>
                    <KanbanCard
                      row={row}
                      status={effectiveStatus(row.application)}
                      dragging={draggingId === row.application.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onOpen={onOpen}
                      onMove={onMove}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {withdrawn.length > 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Withdrawn by candidate <span className="tabular-nums">({withdrawn.length})</span>
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {withdrawn.map(({ application, candidate }) => (
              <li key={application.id}>
                <button
                  type="button"
                  onClick={() => onOpen(application.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 py-1 pr-3 pl-1 text-xs text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <UserAvatar name={candidate.name} src={candidate.avatar} size="xs" />
                  {candidate.name}
                  <StatusBadge status="withdrawn" size="sm" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface KanbanCardProps {
  row: ApplicantRow;
  status: ApplicationStatus;
  dragging: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void;
  onOpen: (id: string) => void;
  onMove: (id: string, status: ApplicationStatus) => void;
}

function KanbanCard({ row, status, dragging, onDragStart, onDragEnd, onOpen, onMove }: KanbanCardProps) {
  const { application, candidate, job } = row;
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, application.id)}
      onDragEnd={onDragEnd}
      className={cn("relative transition-opacity", dragging && "opacity-40")}
    >
      <CandidateCard
        compact
        draggable
        candidate={candidate}
        application={application}
        job={job}
        onOpen={() => onOpen(application.id)}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="xs"
              aria-label={`Move ${candidate.name} to another stage`}
              className="absolute right-2 bottom-2 text-muted-foreground"
            />
          }
        >
          Move to…
          <MoveRight aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
            {STAGE_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                disabled={option.value === status}
                onClick={() => onMove(application.id, option.value)}
              >
                {option.value === status ? <Check aria-hidden /> : <span aria-hidden className="size-4" />}
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
