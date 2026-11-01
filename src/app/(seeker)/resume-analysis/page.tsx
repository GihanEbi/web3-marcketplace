"use client";

import { ResumeAnalyzer } from "@/components/ai/resume-analyzer";
import { PageHeader } from "@/components/shared/page-header";

export default function ResumeAnalysisPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI assistant"
        title="Resume analysis"
        description="Get an instant score, strengths and concrete fixes so your resume stands out to Web3 hiring managers."
      />
      <ResumeAnalyzer />
    </div>
  );
}
