"use client";

import { useState } from "react";
import { Activity, BarChart3, FilePenLine, ListChecks, MessageSquare, Sparkles, UsersRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { AI_EMPLOYER_SUGGESTIONS } from "@/services";
import { useCurrentCompany, useCurrentUser, useHydrated } from "@/store/hooks";
import { AIActivityPanel } from "./ai-activity-panel";
import { AIChatInterface } from "./ai-chat-interface";
import { AIDisclaimer } from "./ai-disclaimer";
import { CandidateInsights } from "./candidate-insights";
import { InterviewQuestionsTool } from "./interview-questions-tool";
import { JobDescriptionGenerator } from "./job-description-generator";
import { RecruitmentInsights } from "./recruitment-insights";

type RecruiterTab = "chat" | "job-description" | "candidates" | "interview" | "insights" | "activity";

const TABS: { value: RecruiterTab; label: string; icon: typeof MessageSquare }[] = [
  { value: "chat", label: "Chat", icon: MessageSquare },
  { value: "job-description", label: "Job description", icon: FilePenLine },
  { value: "candidates", label: "Candidates", icon: UsersRound },
  { value: "interview", label: "Interview questions", icon: ListChecks },
  { value: "insights", label: "Insights", icon: BarChart3 },
  { value: "activity", label: "AI activity", icon: Activity },
];

function isTab(value: string | null | undefined): value is RecruiterTab {
  return TABS.some((t) => t.value === value);
}

/** Employer AI workspace: chat, job descriptions, candidate analysis, interview prep, insights and history. */
export function RecruiterAssistant({ tabParam }: { tabParam?: string | null }) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const [tab, setTab] = useState<RecruiterTab>(isTab(tabParam) ? tabParam : "chat");
  const [lastParam, setLastParam] = useState(tabParam);

  if (tabParam !== lastParam) {
    setLastParam(tabParam);
    if (isTab(tabParam)) setTab(tabParam);
  }

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton variant="list" count={1} />
        <LoadingSkeleton variant="chat" count={4} />
      </div>
    );
  }

  if (!company) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Sign in as an employer"
        description="The recruiting copilot works with your company's jobs and applications, so it needs an employer account."
      />
    );
  }

  return (
    <div className="space-y-5">
      <AIDisclaimer>Hiring decisions always stay with you — the AI never moves a candidate, publishes a job or sends a message on its own.</AIDisclaimer>

      <Tabs value={tab} onValueChange={(v) => setTab(isTab(String(v)) ? (String(v) as RecruiterTab) : "chat")} className="gap-4">
        <div className="overflow-x-auto pb-1 scrollbar-thin">
          <TabsList className="w-max min-w-full sm:min-w-0">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="px-3">
                <Icon aria-hidden />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="chat" keepMounted>
          <AIChatInterface
            role="employer"
            suggestions={AI_EMPLOYER_SUGGESTIONS}
            companyId={company.id}
            firstName={user?.name.split(" ")[0]}
            storageKey={`chainhire-ai-chat-employer-${company.id}`}
            placeholder="Ask about candidates, job descriptions, interviews… (Enter to send)"
          />
        </TabsContent>
        <TabsContent value="job-description">
          <JobDescriptionGenerator />
        </TabsContent>
        <TabsContent value="candidates">
          <CandidateInsights />
        </TabsContent>
        <TabsContent value="interview">
          <InterviewQuestionsTool />
        </TabsContent>
        <TabsContent value="insights">
          <RecruitmentInsights companyId={company.id} />
        </TabsContent>
        <TabsContent value="activity">
          <AIActivityPanel role="employer" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
