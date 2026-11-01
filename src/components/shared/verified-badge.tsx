import { BadgeCheck, ShieldQuestion } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  verified: boolean;
  /** Render a muted "unverified" marker instead of nothing. */
  showUnverified?: boolean;
  className?: string;
}

export function VerifiedBadge({ verified, showUnverified = false, className }: VerifiedBadgeProps) {
  if (!verified && !showUnverified) return null;
  const Icon = verified ? BadgeCheck : ShieldQuestion;
  const text = verified ? "Verified company (demo)" : "Not verified";
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} role="img" aria-label={text} />}
        className={cn(
          "inline-flex shrink-0 items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          verified ? "text-info" : "text-muted-foreground/60",
          className,
        )}
      >
        <Icon className="size-4" aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

export function DemoOrgBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center rounded-full border border-dashed border-border px-2 text-[10px] font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase",
        className,
      )}
    >
      Demo org
    </span>
  );
}
