import type { Company } from "@/types";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<LogoSize, string> = {
  sm: "size-8 rounded-lg text-[11px]",
  md: "size-11 rounded-xl text-sm",
  lg: "size-14 rounded-xl text-lg",
  xl: "size-20 rounded-2xl text-2xl",
};

interface CompanyLogoProps {
  company: Pick<Company, "initials" | "logoFrom" | "logoTo" | "name">;
  size?: LogoSize;
  className?: string;
}

export function CompanyLogo({ company, size = "md", className }: CompanyLogoProps) {
  return (
    <div
      role="img"
      aria-label={`${company.name} logo`}
      style={{ backgroundImage: `linear-gradient(135deg, ${company.logoFrom}, ${company.logoTo})` }}
      className={cn(
        "flex shrink-0 items-center justify-center font-heading font-bold tracking-tight text-white shadow-sm ring-1 ring-inset ring-white/15 select-none",
        SIZE_CLASS[size],
        className,
      )}
    >
      <span aria-hidden className="drop-shadow-sm">
        {company.initials}
      </span>
    </div>
  );
}
