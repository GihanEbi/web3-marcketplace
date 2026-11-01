"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveJob } from "@/services";
import { useCurrentCandidate, useCurrentUser, useHydrated, useSavedJobIds } from "@/store/hooks";
import { cn } from "@/lib/utils";

interface SaveJobButtonProps {
  jobId: string;
  variant?: "icon" | "button";
  className?: string;
}

export function SaveJobButton({ jobId, variant = "icon", className }: SaveJobButtonProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const candidate = useCurrentCandidate();
  const savedIds = useSavedJobIds();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  const storeSaved = savedIds.includes(jobId);
  const saved = hydrated && (optimistic ?? storeSaved);

  async function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    if (!user) {
      toast.info("Log in as a job seeker to save jobs", {
        action: { label: "Log in", onClick: () => router.push("/login") },
      });
      return;
    }
    if (!candidate) {
      toast.info("Saving jobs is available for job seeker accounts");
      return;
    }

    const next = !saved;
    setOptimistic(next);
    setPending(true);
    try {
      await saveJob(candidate.id, jobId);
      toast.success(next ? "Job saved" : "Removed from saved jobs");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update saved jobs");
    } finally {
      setOptimistic(null);
      setPending(false);
    }
  }

  const label = saved ? "Remove from saved jobs" : "Save job";
  const icon = <Bookmark aria-hidden className={cn(saved && "fill-current")} />;

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={label}
        className={cn(saved && "border-primary/40 text-primary", className)}
      >
        {icon}
        {saved ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn("text-muted-foreground hover:text-primary", saved && "text-primary", className)}
    >
      {icon}
    </Button>
  );
}
