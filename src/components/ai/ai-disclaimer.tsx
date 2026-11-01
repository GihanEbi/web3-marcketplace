import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Persistent notice that every AI output in the demo is simulated. */
export function AIDisclaimer({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-info/25 bg-info/10 px-3.5 py-2.5 text-xs text-pretty text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
      <p>
        <span className="font-semibold text-foreground">AI suggestions are simulated and advisory only.</span>{" "}
        {children ?? "Responses come from deterministic templates over your demo data. No real language model is called, and nothing is changed without your approval."}
      </p>
    </div>
  );
}
