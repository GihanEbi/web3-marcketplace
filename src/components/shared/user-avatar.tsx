import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type PresenceStatus = "online" | "away" | "busy" | "offline";

const SIZE_CLASS: Record<AvatarSize, { root: string; text: string; dot: string }> = {
  xs: { root: "size-6", text: "text-[10px]", dot: "size-1.5" },
  sm: { root: "size-8", text: "text-xs", dot: "size-2" },
  md: { root: "size-10", text: "text-sm", dot: "size-2.5" },
  lg: { root: "size-14", text: "text-lg", dot: "size-3" },
  xl: { root: "size-20", text: "text-2xl", dot: "size-3.5" },
};

const STATUS_CLASS: Record<PresenceStatus, string> = {
  online: "bg-success",
  away: "bg-warning",
  busy: "bg-destructive",
  offline: "bg-muted-foreground/60",
};

/** Deterministic 32-bit hash so the same name always gets the same colours. */
function hashName(name: string): number {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function avatarGradient(name: string): string {
  const hash = hashName(name.trim().toLowerCase());
  // keep hues in the indigo → violet → blue → teal → pink band for brand cohesion
  const hue = 200 + (hash % 160);
  const hue2 = (hue + 35 + ((hash >> 8) % 30)) % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 52%), hsl(${hue2} 72% 42%))`;
}

interface UserAvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
  status?: PresenceStatus;
}

export function UserAvatar({ name, src, size = "md", className, status }: UserAvatarProps) {
  const s = SIZE_CLASS[size];
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Avatar className={s.root} aria-label={name} role="img">
        {src && <AvatarImage src={src} alt="" />}
        <AvatarFallback
          style={{ backgroundImage: avatarGradient(name) }}
          className={cn("font-heading font-semibold text-white", s.text)}
        >
          {initialsOf(name) || "?"}
        </AvatarFallback>
      </Avatar>
      {status && (
        <span
          role="status"
          aria-label={status}
          className={cn(
            "absolute right-0 bottom-0 rounded-full ring-2 ring-card",
            s.dot,
            STATUS_CLASS[status],
          )}
        />
      )}
    </span>
  );
}
