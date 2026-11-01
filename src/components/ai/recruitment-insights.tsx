"use client";

import { useEffect, useState } from "react";
import { BarChart3, CircleAlert, Info, Loader2, RefreshCw, TrendingUp, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { getRecruitmentInsights, type RecruitmentInsight } from "@/services";

const TONE: Record<RecruitmentInsight["tone"], { icon: LucideIcon; tile: string; ring: string; label: string }> = {
  positive: { icon: TrendingUp, tile: "bg-success/15 text-success", ring: "border-success/25", label: "Positive" },
  neutral: { icon: Info, tile: "bg-info/15 text-info", ring: "border-border", label: "Neutral" },
  warning: { icon: CircleAlert, tile: "bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning", ring: "border-warning/30", label: "Needs attention" },
};

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; insights: RecruitmentInsight[] };

export function RecruitmentInsights({ companyId }: { companyId: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRecruitmentInsights(companyId, { log: nonce > 0 })
      .then((insights) => {
        if (cancelled) return;
        setState({ status: "ready", insights });
        if (nonce > 0) toast.success("Insights refreshed");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "Could not load insights";
        setState({ status: "error", message });
        if (nonce > 0) toast.error(message);
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, nonce]);

  function refresh() {
    setRefreshing(true);
    setNonce((n) => n + 1);
  }

  return (
    <section aria-label="Recruitment insights" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Pipeline insights</h3>
          <p className="text-xs text-muted-foreground">Computed from your jobs and applications.</p>
        </div>
        <Button type="button" variant="outline" onClick={refresh} disabled={refreshing || state.status === "loading"}>
          {refreshing ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
          Refresh insights
        </Button>
      </div>

      {state.status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2" role="status" aria-label="Loading insights">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : state.status === "error" ? (
        <ErrorState title="Insights unavailable" description={state.message} onRetry={refresh} />
      ) : state.insights.length === 0 ? (
        <EmptyState icon={BarChart3} title="No insights yet" description="Publish a job and collect applications to see pipeline insights." />
      ) : (
        <ul className={cn("grid gap-4 transition-opacity sm:grid-cols-2", refreshing && "opacity-60")} aria-busy={refreshing}>
          {state.insights.map((insight) => {
            const t = TONE[insight.tone];
            const Icon = t.icon;
            return (
              <li key={insight.id} className={cn("flex gap-3 rounded-xl border bg-card p-4", t.ring)}>
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", t.tile)}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold">{insight.title}</h4>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-pretty text-muted-foreground">{insight.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
