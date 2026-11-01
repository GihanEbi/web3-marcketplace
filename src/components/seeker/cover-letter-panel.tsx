"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/shared/copy-button";
import { SelectField } from "@/components/shared/select-field";
import { cn } from "@/lib/utils";
import { generateCoverLetter, type CoverLetterTone } from "@/services";
import { coverDraftKey } from "./job-utils";

const TONES: { value: CoverLetterTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "concise", label: "Concise" },
];

interface CoverLetterPanelProps {
  candidateId: string;
  jobId: string;
  /** false when the job can no longer be applied to (the apply link is hidden) */
  canApply: boolean;
  className?: string;
}

/** Inline AI cover-letter generator. Re-mount with a `key` per job to reset its state. */
export function CoverLetterPanel({ candidateId, jobId, canApply, className }: CoverLetterPanelProps) {
  const [tone, setTone] = useState<CoverLetterTone>("professional");
  const [variant, setVariant] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const hasDraft = text.trim().length > 0;

  async function generate(regenerate: boolean) {
    if (loading) return;
    const nextVariant = regenerate ? variant + 1 : variant;
    setLoading(true);
    try {
      const letter = await generateCoverLetter(candidateId, jobId, { tone, variant: nextVariant });
      setVariant(nextVariant);
      setText(letter);
      toast.success(regenerate ? "Fresh version generated" : "Cover letter drafted — edit it below");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate a cover letter");
    } finally {
      setLoading(false);
    }
  }

  function stashDraft() {
    try {
      window.sessionStorage.setItem(coverDraftKey(jobId), text);
    } catch {
      /* sessionStorage unavailable — the apply form simply opens empty */
    }
  }

  return (
    <section
      aria-label="AI cover letter"
      className={cn("space-y-4 rounded-xl border border-primary/25 bg-linear-to-br from-indigo-500/5 to-violet-500/5 p-4 sm:p-5", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
          <FileText className="size-4 text-primary" aria-hidden />
          AI cover letter
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-36">
            <SelectField aria-label="Cover letter tone" value={tone} onChange={(v) => setTone(v as CoverLetterTone)} options={TONES} disabled={loading} />
          </div>
          {!hasDraft && (
            <Button type="button" variant="gradient" onClick={() => generate(false)} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
              {loading ? "Writing…" : "Generate cover letter"}
            </Button>
          )}
        </div>
      </div>

      {!hasDraft && !loading && (
        <p className="text-sm text-muted-foreground">
          Generate a tailored first draft using your profile and this job&apos;s requirements. You can edit it before using it.
        </p>
      )}

      {loading && !hasDraft && (
        <div role="status" aria-label="Generating cover letter" className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={cn("h-3 animate-pulse rounded bg-muted", i === 4 ? "w-2/3" : "w-full")} />
          ))}
        </div>
      )}

      {hasDraft && (
        <div className="space-y-3">
          <Textarea
            aria-label="Cover letter draft (editable)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            rows={12}
            className="min-h-60 bg-card leading-relaxed"
          />
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={text} label="Cover letter" showLabel className="border border-border" />
            <Button type="button" variant="outline" size="sm" onClick={() => generate(true)} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
              Regenerate
            </Button>
            {canApply && (
              <Link
                href={`/jobs/${jobId}/apply`}
                onClick={stashDraft}
                className={cn(buttonVariants({ variant: "gradient", size: "sm" }), "sm:ml-auto")}
              >
                Use in application
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
