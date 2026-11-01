"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Company } from "@/types";
import { JobPreview, type PreviewJob } from "./job-preview";

interface JobPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: PreviewJob | null;
  company: Company | null;
}

export function JobPreviewDialog({ open, onOpenChange, job, company }: JobPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Candidate preview</DialogTitle>
          <DialogDescription>This is how your posting appears to candidates on the public job page.</DialogDescription>
        </DialogHeader>
        {job && company && <JobPreview job={job} company={company} />}
      </DialogContent>
    </Dialog>
  );
}
