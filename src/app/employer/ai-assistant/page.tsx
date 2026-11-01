"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RecruiterAssistant } from "@/components/ai/recruiter-assistant";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";

function AssistantWithParams() {
  const params = useSearchParams();
  return <RecruiterAssistant tabParam={params.get("tab")} />;
}

export default function EmployerAIAssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI assistant"
        title="Recruiting copilot"
        description="Draft job descriptions, summarise and compare candidates, prepare interviews and spot pipeline trends — you make every hiring decision."
      />
      <Suspense fallback={<LoadingSkeleton variant="chat" count={4} />}>
        <AssistantWithParams />
      </Suspense>
    </div>
  );
}
