"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, FileText, FileSearch, Lightbulb, MessageSquare, Search, Sparkles, Target, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { AI_SEEKER_SUGGESTIONS } from "@/services";
import { useCurrentCandidate, useHydrated } from "@/store/hooks";
import { AIActivityPanel } from "./ai-activity-panel";
import { AIChatInterface } from "./ai-chat-interface";
import { AIDisclaimer } from "./ai-disclaimer";
import { CoverLetterGenerator } from "./cover-letter-generator";

export type SeekerAssistantTab = "chat" | "cover-letter" | "activity";

export function parseSeekerTab(value: string | null | undefined): SeekerAssistantTab {
  return value === "cover-letter" || value === "activity" ? value : "chat";
}

const CAPABILITIES = [
  { icon: Search, title: "Find jobs", text: "Search open roles by skill, stack or chain." },
  { icon: Target, title: "Match your skills", text: "See which roles fit your profile best." },
  { icon: FileSearch, title: "Review your CV", text: "Get a score plus concrete fixes." },
  { icon: FileText, title: "Write cover letters", text: "Tailored to the job, in your tone." },
  { icon: UserRound, title: "Polish your profile", text: "Spot gaps that cost you interviews." },
  { icon: MessageSquare, title: "Interview prep", text: "Practise realistic technical questions." },
] as const;

const TIPS = [
  "Mention a role or stack — “Solidity jobs” or “React interview”.",
  "Ask about your applications to get a quick status recap.",
  "Edit generated cover letters so they sound like you.",
] as const;

function SidePanel() {
  return (
    <aside aria-label="What the assistant can do" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden />
          What I can do
        </h2>
        <ul className="space-y-3">
          {CAPABILITIES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="size-4 text-warning" aria-hidden />
          Tips
        </h2>
        <ul className="list-disc space-y-2 pl-4 text-xs text-muted-foreground marker:text-primary">
          {TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <Link href="/resume-analysis" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
          Run a full resume analysis →
        </Link>
      </section>
    </aside>
  );
}

interface SeekerAssistantProps {
  /** value of `?tab=` */
  tabParam?: string | null;
  /** value of `?job=` */
  jobParam?: string | null;
}

export function SeekerAssistant({ tabParam, jobParam }: SeekerAssistantProps) {
  const hydrated = useHydrated();
  const candidate = useCurrentCandidate();
  const [tab, setTab] = useState<SeekerAssistantTab>(parseSeekerTab(tabParam));
  const [lastParam, setLastParam] = useState(tabParam);

  // follow `?tab=` when navigation changes it (e.g. sidebar link while already on the page)
  if (tabParam !== lastParam) {
    setLastParam(tabParam);
    setTab(parseSeekerTab(tabParam));
  }

  if (!hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <LoadingSkeleton variant="chat" count={4} />
        <LoadingSkeleton variant="list" count={3} />
      </div>
    );
  }

  if (!candidate) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Sign in as a job seeker"
        description="The career assistant uses your profile to personalise answers, so it needs a job seeker account."
      />
    );
  }

  return (
    <div className="space-y-5">
      <AIDisclaimer />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Tabs value={tab} onValueChange={(v) => setTab(parseSeekerTab(String(v)))} className="min-w-0 gap-4">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="chat" className="px-3">
              <MessageSquare aria-hidden />
              Chat
            </TabsTrigger>
            <TabsTrigger value="cover-letter" className="px-3">
              <FileText aria-hidden />
              Cover letter
            </TabsTrigger>
            <TabsTrigger value="activity" className="px-3">
              <Activity aria-hidden />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" keepMounted>
            <AIChatInterface
              role="seeker"
              suggestions={AI_SEEKER_SUGGESTIONS}
              candidateId={candidate.id}
              firstName={candidate.name.split(" ")[0]}
              storageKey={`chainhire-ai-chat-seeker-${candidate.id}`}
              placeholder="Ask about jobs, your CV, interviews… (Enter to send)"
            />
          </TabsContent>
          <TabsContent value="cover-letter" keepMounted>
            <CoverLetterGenerator key={jobParam ?? "none"} candidate={candidate} initialJobId={jobParam} />
          </TabsContent>
          <TabsContent value="activity">
            <AIActivityPanel role="seeker" />
          </TabsContent>
        </Tabs>

        <SidePanel />
      </div>
    </div>
  );
}
