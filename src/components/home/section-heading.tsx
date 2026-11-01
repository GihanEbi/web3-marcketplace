import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** optional "View all" style link on the right */
  action?: { href: string; label: string };
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({ eyebrow, title, description, action, align = "left", className }: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-10",
        centered ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl space-y-2", centered && "mx-auto")}>
        {eyebrow && <p className="text-xs font-semibold tracking-wider text-primary uppercase">{eyebrow}</p>}
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">{title}</h2>
        {description && <p className="text-pretty text-muted-foreground sm:text-lg">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          {action.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
