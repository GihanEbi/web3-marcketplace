import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type SkillVariant = "default" | "match" | "missing" | "outline";
type SkillSize = "sm" | "md";

const VARIANT_CLASS: Record<SkillVariant, string> = {
  default: "border-transparent bg-secondary text-secondary-foreground",
  match: "border-success/30 bg-success/15 text-success",
  missing: "border-dashed border-destructive/40 bg-destructive/5 text-destructive",
  outline: "border-border bg-transparent text-muted-foreground",
};

const SIZE_CLASS: Record<SkillSize, string> = {
  sm: "h-5 gap-1 px-2 text-[11px]",
  md: "h-6 gap-1.5 px-2.5 text-xs",
};

interface SkillTagProps {
  skill: string;
  active?: boolean;
  onRemove?: () => void;
  variant?: SkillVariant;
  size?: SkillSize;
  onClick?: () => void;
  className?: string;
}

export function SkillTag({
  skill,
  active = false,
  onRemove,
  variant = "default",
  size = "md",
  onClick,
  className,
}: SkillTagProps) {
  const base = cn(
    "inline-flex max-w-full items-center rounded-full border font-medium whitespace-nowrap transition-colors",
    SIZE_CLASS[size],
    VARIANT_CLASS[variant],
    active && "border-primary/50 bg-primary/15 text-primary ring-1 ring-primary/40",
    className,
  );

  const label = onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="truncate rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {skill}
    </button>
  ) : (
    <span className="truncate">{skill}</span>
  );

  return (
    <span data-slot="skill-tag" className={cn(base, onClick && "cursor-pointer hover:border-primary/40")}>
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${skill}`}
          className="-mr-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full outline-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <X className="size-3" aria-hidden />
        </button>
      )}
    </span>
  );
}

interface SkillTagListProps {
  skills: string[];
  max?: number;
  /** skills that match (rendered green) */
  highlight?: string[];
  /** skills that are missing (rendered red/dashed) */
  missing?: string[];
  size?: SkillSize;
  className?: string;
}

export function SkillTagList({ skills, max, highlight, missing, size = "sm", className }: SkillTagListProps) {
  if (skills.length === 0) return null;
  const visible = max !== undefined && skills.length > max ? skills.slice(0, max) : skills;
  const hidden = skills.length - visible.length;
  const matched = new Set((highlight ?? []).map((s) => s.toLowerCase()));
  const absent = new Set((missing ?? []).map((s) => s.toLowerCase()));

  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)} aria-label="Skills">
      {visible.map((skill) => {
        const key = skill.toLowerCase();
        const variant: SkillVariant = matched.has(key) ? "match" : absent.has(key) ? "missing" : "default";
        return (
          <li key={skill} className="max-w-full">
            <SkillTag skill={skill} variant={variant} size={size} />
          </li>
        );
      })}
      {hidden > 0 && (
        <li>
          <span
            title={skills.slice(visible.length).join(", ")}
            className={cn(
              "inline-flex cursor-default items-center rounded-full border border-border font-medium text-muted-foreground",
              SIZE_CLASS[size],
            )}
          >
            +{hidden}
          </span>
        </li>
      )}
    </ul>
  );
}
