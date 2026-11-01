import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type LoadingSkeletonVariant = "card" | "list" | "table" | "stats" | "page" | "detail" | "chat";

interface LoadingSkeletonProps {
  variant: LoadingSkeletonVariant;
  count?: number;
  className?: string;
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
    </div>
  );
}

function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <Skeleton className="size-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
      <Skeleton className="h-7 w-20 rounded-lg" />
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
        {range(4).map((i) => (
          <Skeleton key={i} className={cn("h-3", i === 0 ? "w-1/4" : "w-1/6")} />
        ))}
      </div>
      {range(rows).map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
        <Skeleton className="size-16 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          {range(6).map((i) => (
            <Skeleton key={i} className={cn("h-3", i % 3 === 2 ? "w-2/3" : "w-full")} />
          ))}
          <Skeleton className="mt-4 h-5 w-32" />
          {range(4).map((i) => (
            <Skeleton key={i} className="h-3 w-5/6" />
          ))}
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-28" />
          {range(4).map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function ChatSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      {range(count).map((i) => {
        const mine = i % 2 === 1;
        return (
          <div key={i} className={cn("flex gap-3", mine && "flex-row-reverse")}>
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className={cn("space-y-2", mine ? "items-end" : "items-start")}>
              <Skeleton className={cn("h-10 rounded-2xl", mine ? "w-56" : "w-72 max-w-full")} />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Placeholder content shown while `useHydrated()` is false or data is loading. */
export function LoadingSkeleton({ variant, count, className }: LoadingSkeletonProps) {
  const label = "Loading";
  switch (variant) {
    case "card":
      return (
        <div
          role="status"
          aria-label={label}
          className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}
        >
          {range(count ?? 6).map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      );
    case "list":
      return (
        <div role="status" aria-label={label} className={cn("space-y-3", className)}>
          {range(count ?? 5).map((i) => (
            <ListRowSkeleton key={i} />
          ))}
        </div>
      );
    case "table":
      return (
        <div role="status" aria-label={label} className={className}>
          <TableSkeleton rows={count ?? 6} />
        </div>
      );
    case "stats":
      return (
        <div
          role="status"
          aria-label={label}
          className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}
        >
          {range(count ?? 4).map((i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      );
    case "detail":
      return (
        <div role="status" aria-label={label} className={className}>
          <DetailSkeleton />
        </div>
      );
    case "chat":
      return (
        <div role="status" aria-label={label} className={className}>
          <ChatSkeleton count={count ?? 5} />
        </div>
      );
    case "page":
      return (
        <div role="status" aria-label={label} className={cn("space-y-6", className)}>
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {range(4).map((i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
          <TableSkeleton rows={count ?? 5} />
        </div>
      );
  }
}
