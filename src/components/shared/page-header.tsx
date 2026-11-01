import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, eyebrow, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">{eyebrow}</p>
        )}
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm text-pretty text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
