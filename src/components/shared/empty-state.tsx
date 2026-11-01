import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Inbox, RotateCcw, SearchX, TriangleAlert, type LucideIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StateShellProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
}

function StateShell({ icon: Icon, title, description, action, tone = "default", className }: StateShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-14 items-center justify-center rounded-2xl ring-1 ring-inset",
          tone === "danger"
            ? "bg-destructive/10 text-destructive ring-destructive/25"
            : "bg-linear-to-br from-indigo-500/15 to-violet-500/15 text-primary ring-primary/20",
        )}
      >
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="font-heading text-lg font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-pretty text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return <StateShell icon={icon} title={title} description={description} action={action} className={className} />;
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this right now. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <StateShell
      icon={TriangleAlert}
      tone="danger"
      title={title}
      description={description}
      className={className}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
        )
      }
    />
  );
}

interface NotFoundStateProps {
  /** e.g. "job" → "We couldn't find that job" */
  entity: string;
  backHref: string;
  backLabel?: string;
  className?: string;
}

export function NotFoundState({ entity, backHref, backLabel, className }: NotFoundStateProps) {
  return (
    <StateShell
      icon={SearchX}
      title={`We couldn't find that ${entity}`}
      description={`The ${entity} may have been removed, or the link might be incorrect.`}
      className={className}
      action={
        <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft aria-hidden />
          {backLabel ?? `Back to ${entity}s`}
        </Link>
      }
    />
  );
}
