"use client";

import { useCallback, useState, type ReactNode } from "react";
import { CheckCheck, Loader2, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { formatDateTime } from "@/lib/format";
import { cancelInterview, completeInterview, setInterviewStatus } from "@/services";
import { useAppStore } from "@/store/app-store";
import type { Interview } from "@/types";
import { RescheduleInterviewDialog } from "./reschedule-interview-dialog";

type NotesMode = "complete" | "notes";

export interface InterviewActions {
  onReschedule: (interview: Interview) => void;
  onCancel: (interview: Interview) => void;
  onComplete: (interview: Interview) => void;
  onNotes: (interview: Interview) => void;
  dialogs: ReactNode;
}

/**
 * Reschedule / cancel / complete / edit-notes flows for interviews, with their dialogs.
 * Render `dialogs` once next to the cards that use the handlers.
 */
export function useInterviewActions(): InterviewActions {
  const candidates = useAppStore((s) => s.candidates);

  const [reschedule, setReschedule] = useState<{ interview: Interview | null; open: boolean }>({
    interview: null,
    open: false,
  });
  const [cancel, setCancel] = useState<{ interview: Interview | null; open: boolean }>({
    interview: null,
    open: false,
  });
  const [notes, setNotes] = useState<{ interview: Interview | null; mode: NotesMode; open: boolean }>({
    interview: null,
    mode: "notes",
    open: false,
  });

  const onReschedule = useCallback((interview: Interview) => setReschedule({ interview, open: true }), []);
  const onCancel = useCallback((interview: Interview) => setCancel({ interview, open: true }), []);
  const onComplete = useCallback((interview: Interview) => setNotes({ interview, mode: "complete", open: true }), []);
  const onNotes = useCallback((interview: Interview) => setNotes({ interview, mode: "notes", open: true }), []);

  const cancelName = candidates.find((c) => c.id === cancel.interview?.candidateId)?.name ?? "the candidate";

  async function confirmCancel() {
    const target = cancel.interview;
    if (!target) return;
    try {
      await cancelInterview(target.id);
      toast.success("Interview cancelled", { description: `${cancelName} has been notified.` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel the interview");
    }
  }

  const dialogs = (
    <>
      <RescheduleInterviewDialog
        interview={reschedule.interview}
        open={reschedule.open}
        onOpenChange={(open) => setReschedule((s) => ({ ...s, open }))}
      />
      <ConfirmationDialog
        open={cancel.open}
        onOpenChange={(open) => setCancel((s) => ({ ...s, open }))}
        title="Cancel this interview?"
        description={
          cancel.interview
            ? `The ${cancel.interview.type.toLowerCase()} with ${cancelName} on ${formatDateTime(cancel.interview.scheduledAt)} will be cancelled and they will be notified.`
            : ""
        }
        confirmLabel="Cancel interview"
        cancelLabel="Keep interview"
        destructive
        onConfirm={confirmCancel}
      />
      <InterviewNotesDialog
        interview={notes.interview}
        mode={notes.mode}
        open={notes.open}
        onOpenChange={(open) => setNotes((s) => ({ ...s, open }))}
      />
    </>
  );

  return { onReschedule, onCancel, onComplete, onNotes, dialogs };
}

function InterviewNotesDialog({
  interview,
  mode,
  open,
  onOpenChange,
}: {
  interview: Interview | null;
  mode: NotesMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {interview && <NotesForm interview={interview} mode={mode} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function NotesForm({ interview, mode, onDone }: { interview: Interview; mode: NotesMode; onDone: () => void }) {
  const [text, setText] = useState(interview.notes);
  const [saving, setSaving] = useState(false);
  const complete = mode === "complete";

  async function submit() {
    setSaving(true);
    try {
      if (complete) {
        await completeInterview(interview.id, text.trim());
        toast.success("Interview marked as completed");
      } else {
        await setInterviewStatus(interview.id, interview.status, text.trim());
        toast.success("Interview notes saved");
      }
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the interview");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{complete ? "Mark interview as completed" : "Interview notes"}</DialogTitle>
        <DialogDescription>
          {complete
            ? "Capture your feedback now. Notes stay with the interview record."
            : `${interview.type} · ${formatDateTime(interview.scheduledAt)}`}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="iv-notes">{complete ? "Feedback & notes" : "Notes"}</Label>
        <Textarea
          id="iv-notes"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Strengths, concerns, follow-up questions…"
          maxLength={1000}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button variant={complete ? "gradient" : "default"} onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : complete ? <CheckCheck aria-hidden /> : <NotebookPen aria-hidden />}
          {complete ? "Mark completed" : "Save notes"}
        </Button>
      </DialogFooter>
    </>
  );
}
