import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE: Record<AvatarSize, { box: string; icon: string }> = {
  xs: { box: "size-6", icon: "size-3" },
  sm: { box: "size-8", icon: "size-4" },
  md: { box: "size-10", icon: "size-5" },
  lg: { box: "size-14", icon: "size-7" },
  xl: { box: "size-20", icon: "size-10" },
};

interface AIAvatarProps {
  size?: AvatarSize;
  /** soft pulsing halo, e.g. while the assistant is "thinking" */
  thinking?: boolean;
  className?: string;
}

/** Gradient sparkle avatar used for every AI voice in the product. */
export function AIAvatar({ size = "md", thinking = false, className }: AIAvatarProps) {
  const s = SIZE[size];
  return (
    <span
      role="img"
      aria-label="AI assistant"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/30 ring-1 ring-white/20 ring-inset",
        s.box,
        className,
      )}
    >
      {thinking && <span aria-hidden className="absolute inset-0 rounded-full bg-violet-500/40 motion-safe:animate-ping" />}
      <Sparkles className={cn("relative", s.icon)} aria-hidden />
    </span>
  );
}
