"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { InterviewsBoard } from "@/components/ats/interviews-board";
import { ScheduleInterviewDialog } from "@/components/ats/schedule-interview-dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

export default function EmployerInterviewsPage() {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews"
        description="Schedule, reschedule and review every interview across your open roles."
        actions={
          <Button variant="gradient" onClick={() => setScheduleOpen(true)}>
            <CalendarPlus aria-hidden />
            Schedule interview
          </Button>
        }
      />
      <InterviewsBoard onSchedule={() => setScheduleOpen(true)} />
      <ScheduleInterviewDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </div>
  );
}
