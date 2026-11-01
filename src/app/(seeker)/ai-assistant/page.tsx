"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SeekerAssistant } from "@/components/ai/seeker-assistant";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";

function AssistantWithParams() {
  const params = useSearchParams();
  return <SeekerAssistant tabParam={params.get("tab")} jobParam={params.get("job")} />;
}

export default function SeekerAIAssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI assistant"
        title="Your Web3 career copilot"
        description="Chat about jobs and interviews, generate tailored cover letters, and review everything the AI has done for you."
      />
      <Suspense fallback={<LoadingSkeleton variant="chat" count={4} />}>
        <AssistantWithParams />
      </Suspense>
    </div>
  );
}
