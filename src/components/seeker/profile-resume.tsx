"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CheckCircle2, FileText, FileUp, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { delay, uploadResume } from "@/services";
import type { Candidate } from "@/types";
import { ProfileSection, saveCandidate } from "./profile-ui";

const MAX_KB = 5 * 1024;
const ACCEPTED = /\.(pdf|docx?)$/i;

export function ProfileResume({ candidate }: { candidate: Candidate }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const uploading = progress !== null;
  const resume = candidate.resume;

  async function upload(file: File | undefined) {
    if (!file || uploading) return;
    if (!ACCEPTED.test(file.name)) {
      toast.error("Please upload a PDF or Word document (.pdf, .doc, .docx)");
      return;
    }
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    if (sizeKb > MAX_KB) {
      toast.error("That file is larger than 5 MB. Please choose a smaller resume.");
      return;
    }
    setFileName(file.name);
    setProgress(0);
    timer.current = setInterval(() => setProgress((p) => (p === null ? null : Math.min(92, p + 7))), 80);
    try {
      await uploadResume(candidate.id, file.name, sizeKb);
      setProgress(100);
      toast.success(resume ? "Resume replaced" : "Resume uploaded");
      await delay(350);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload your resume");
    } finally {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      setProgress(null);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    void upload(e.dataTransfer.files?.[0]);
  }

  return (
    <>
      <ProfileSection title="Resume / CV" description="Your default CV for applications. PDF, DOC or DOCX up to 5 MB.">
        <div className="space-y-5">
          {resume && (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{resume.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {resume.sizeKb} KB · uploaded {formatDate(resume.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  On file
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
                  <FileUp aria-hidden />
                  Replace
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => setRemoveOpen(true)} disabled={uploading}>
                  <Trash2 aria-hidden />
                  Remove
                </Button>
              </div>
            </div>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              dragging ? "border-primary bg-primary/10" : "border-border bg-card/40",
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500/15 to-violet-500/15 text-primary ring-1 ring-primary/20">
              <UploadCloud className="size-6" aria-hidden />
            </span>
            {uploading ? (
              <div className="mt-4 w-full max-w-sm space-y-2" role="status" aria-live="polite">
                <p className="truncate text-sm font-medium">Uploading {fileName}…</p>
                <Progress value={progress} aria-label="Upload progress" />
                <p className="text-xs text-muted-foreground tabular-nums">{progress}%</p>
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm font-medium">{resume ? "Drop a new file here to replace your resume" : "Drag and drop your resume here"}</p>
                <p className="mt-1 text-xs text-muted-foreground">or choose a file from your device</p>
                <Button type="button" variant="gradient" className="mt-4" onClick={() => inputRef.current?.click()}>
                  <FileUp aria-hidden />
                  {resume ? "Choose a new file" : "Choose file"}
                </Button>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="sr-only"
              tabIndex={-1}
              aria-label="Upload resume file"
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            This is a demo — only the file name and size are stored in your browser. Nothing is uploaded to a server.
          </p>
        </div>
      </ProfileSection>

      <ConfirmationDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title="Remove your resume?"
        description="Your resume will be removed from your profile. Applications you have already submitted keep the CV they were sent with."
        confirmLabel="Remove resume"
        destructive
        onConfirm={async () => {
          await saveCandidate(candidate.id, { resume: undefined }, "Resume removed");
        }}
      />
    </>
  );
}
