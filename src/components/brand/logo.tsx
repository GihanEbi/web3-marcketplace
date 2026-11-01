import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 14.5 7 17a3.2 3.2 0 0 1-4.5-4.5L5 10" />
        <path d="m14.5 9.5 2.5-2.5a3.2 3.2 0 0 1 4.5 4.5L19 14" />
        <path d="m9 15 6-6" />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  showText = true,
  className,
}: {
  href?: string;
  showText?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-heading", className)} aria-label="Chainhire home">
      <LogoMark />
      {showText && <span className="text-lg font-bold tracking-tight">Chain<span className="gradient-text">hire</span></span>}
    </Link>
  );
}
