"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, Info, Layers, ListChecks, ShieldAlert, Trophy, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { BountyCard, deadlineLabel } from "@/components/shared/bounty-card";
import { CompanyLogo } from "@/components/shared/company-logo";
import { NotFoundState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SkillTagList } from "@/components/shared/skill-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { DemoOrgBadge, VerifiedBadge } from "@/components/shared/verified-badge";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCompany, useCurrentCandidate, useCurrentUser, useHydrated } from "@/store/hooks";
import { BountyInterestDialog } from "./bounty-interest-dialog";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="mb-3 font-heading text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function BountyDetail() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const bounties = useAppStore((s) => s.bounties);
  const interests = useAppStore((s) => s.bountyInterests);
  const user = useCurrentUser();
  const candidate = useCurrentCandidate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const bounty = useMemo(() => bounties.find((b) => b.id === id), [bounties, id]);
  const dao = useCompany(bounty?.daoId);

  const myInterest = useMemo(
    () => (bounty && candidate ? interests.find((i) => i.bountyId === bounty.id && i.candidateId === candidate.id) : undefined),
    [interests, bounty, candidate],
  );
  const interestCount = useMemo(() => (bounty ? interests.filter((i) => i.bountyId === bounty.id).length : 0), [interests, bounty]);

  const related = useMemo(() => {
    if (!bounty) return [];
    const mine = new Set(bounty.skills.map((s) => s.toLowerCase()));
    return bounties
      .filter((b) => b.id !== bounty.id && b.status === "open")
      .map((b) => ({
        b,
        score: b.skills.filter((s) => mine.has(s.toLowerCase())).length + (b.daoId === bounty.daoId ? 1 : 0),
      }))
      .sort((a, c) => c.score - a.score || Date.parse(c.b.postedAt) - Date.parse(a.b.postedAt))
      .slice(0, 3)
      .map((x) => x.b);
  }, [bounties, bounty]);

  if (!hydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }
  if (!bounty) {
    return (
      <div className="container mx-auto px-4 py-12">
        <NotFoundState entity="bounty" backHref="/bounties" backLabel="Browse bounties" />
      </div>
    );
  }

  const deadline = deadlineLabel(bounty.deadline);
  const acceptingInterest = bounty.status === "open" && !deadline.expired;
  const loginHref = `/login?next=${encodeURIComponent(`/bounties/${bounty.id}`)}`;

  let action: ReactNode;
  if (!user) {
    action = (
      <>
        <Link href={loginHref} className={cn(buttonVariants({ variant: "gradient", size: "lg" }), "w-full")}>
          Log in to submit interest
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create a free profile
          </Link>
        </p>
      </>
    );
  } else if (user.role !== "seeker" || !candidate) {
    action = (
      <div className="flex items-start gap-2.5 rounded-lg border border-info/30 bg-info/10 p-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
        <p className="text-muted-foreground">Only job seeker accounts can submit interest in bounties.</p>
      </div>
    );
  } else if (myInterest) {
    action = (
      <div className="space-y-1.5 rounded-lg border border-success/30 bg-success/10 p-4">
        <p className="flex items-center gap-2 font-semibold text-success">
          <CheckCircle2 className="size-5" aria-hidden />
          Interest submitted
        </p>
        <p className="text-sm text-muted-foreground">
          Sent {formatRelative(myInterest.submittedAt)}. Status: <StatusBadge status={myInterest.status} size="sm" className="ml-1" />
        </p>
      </div>
    );
  } else if (!acceptingInterest) {
    action = (
      <Button size="lg" className="w-full" disabled>
        {deadline.expired ? "Deadline passed" : "Not accepting interest"}
      </Button>
    );
  } else {
    action = (
      <Button variant="gradient" size="lg" className="w-full" onClick={() => setDialogOpen(true)}>
        Submit interest
      </Button>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
      <Link
        href="/bounties"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to bounties
      </Link>

      {!acceptingInterest && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold">
              {bounty.status === "closed" ? "This bounty is closed" : bounty.status === "in_review" ? "Submissions are being reviewed" : "The deadline has passed"}
            </p>
            <p className="text-sm text-muted-foreground">It is no longer accepting new interest.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <header className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="space-y-3 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={bounty.status} />
                <span className="text-xs text-muted-foreground">Posted {formatRelative(bounty.postedAt)}</span>
              </div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{bounty.title}</h1>
              {dao && (
                <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
                  <CompanyLogo company={dao} size="sm" />
                  <Link
                    href={`/companies/${dao.id}`}
                    className="rounded-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    {dao.name}
                  </Link>
                  <VerifiedBadge verified={dao.verified} />
                  {dao.isDao && (
                    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-violet-500/15 px-2 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                      <Users className="size-3" aria-hidden />
                      DAO
                    </span>
                  )}
                  {dao.isDemo && <DemoOrgBadge />}
                </div>
              )}
            </div>
            <div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
              <div className="bg-linear-to-br from-indigo-500/10 via-violet-500/5 to-transparent p-5 sm:col-span-1">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Trophy className="size-3.5" aria-hidden />
                  Reward
                </p>
                <p className="mt-1 font-heading text-3xl font-bold tracking-tight tabular-nums">
                  <span className="gradient-text">{formatNumber(bounty.rewardAmount)}</span>{" "}
                  <span className="text-lg font-semibold text-muted-foreground">{bounty.token}</span>
                </p>
              </div>
              <div className="bg-card p-5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Layers className="size-3.5" aria-hidden />
                  Blockchain
                </p>
                <p className="mt-1 font-heading text-lg font-semibold">{bounty.blockchain}</p>
              </div>
              <div className="bg-card p-5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarClock className="size-3.5" aria-hidden />
                  Deadline
                </p>
                <p className="mt-1 font-heading text-lg font-semibold">{formatDate(bounty.deadline)}</p>
                <p className={cn("text-sm", deadline.expired ? "text-destructive" : deadline.urgent ? "text-warning" : "text-muted-foreground")}>
                  {deadline.text}
                </p>
              </div>
            </div>
          </header>

          <Section title="Description">
            <div className="space-y-3 text-sm leading-relaxed text-pretty text-muted-foreground">
              {bounty.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </Section>

          {bounty.deliverables.length > 0 && (
            <Section title="Deliverables">
              <ul className="space-y-2">
                {bounty.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2.5 text-sm text-pretty text-muted-foreground">
                    <ListChecks className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Skills">
            <SkillTagList skills={bounty.skills} size="md" />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20" aria-label="Submit interest">
          <div className="space-y-3 rounded-xl border border-border bg-card p-5 card-glow">
            <div>
              <p className="font-heading text-xl font-semibold tabular-nums">
                {formatNumber(bounty.rewardAmount)} {bounty.token}
              </p>
              <p className="text-sm text-muted-foreground">
                {interestCount} {interestCount === 1 ? "contributor has" : "contributors have"} shown interest
              </p>
            </div>
            {action}
            <p className="text-center text-xs text-muted-foreground">Rewards are paid by the DAO. No real funds move in this demo.</p>
          </div>

          {dao && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading font-semibold">About the DAO</h2>
              <p className="line-clamp-4 text-sm text-pretty text-muted-foreground">{dao.tagline}</p>
              <Link href={`/companies/${dao.id}`} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                View {dao.isDao ? "DAO" : "organisation"}
              </Link>
            </div>
          )}
        </aside>
      </div>

      <BountyInterestDialog bounty={bounty} candidateId={candidate?.id ?? ""} open={dialogOpen && Boolean(candidate)} onOpenChange={setDialogOpen} />

      {related.length > 0 && (
        <section aria-labelledby="related-bounties" className="space-y-4 pt-4">
          <h2 id="related-bounties" className="font-heading text-xl font-semibold">
            Related bounties
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {related.map((b) => (
              <BountyCard key={b.id} bounty={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
