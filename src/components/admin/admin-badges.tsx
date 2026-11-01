import { ROLE_LABEL } from "@/config/nav";
import { TONE_BADGE, type StatusTone } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import type { PlanId, Role } from "@/types";

function Pill({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONE_BADGE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const ROLE_TONE: Record<Role, StatusTone> = { seeker: "info", employer: "primary", admin: "warning" };

export function RoleBadge({ role }: { role: Role }) {
  return <Pill tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</Pill>;
}

const PLAN_TONE: Record<PlanId, StatusTone> = { free: "neutral", professional: "primary", business: "success" };
const PLAN_LABEL: Record<PlanId, string> = { free: "Free", professional: "Professional", business: "Business" };

export function PlanBadge({ plan }: { plan: PlanId }) {
  return <Pill tone={PLAN_TONE[plan]}>{PLAN_LABEL[plan]}</Pill>;
}

export function planLabel(plan: PlanId): string {
  return PLAN_LABEL[plan];
}

export function TagPill({ tone = "neutral", children }: { tone?: StatusTone; children: React.ReactNode }) {
  return (
    <Pill tone={tone} className="h-5 px-2 text-[11px]">
      {children}
    </Pill>
  );
}
