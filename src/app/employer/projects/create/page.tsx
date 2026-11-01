"use client";

import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectForm } from "@/components/contracts/project-form";

export default function CreateProjectPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Create a freelance project"
        description="Describe the work, set a budget and break it into milestones. Publish it to the public board or save it as a draft."
      />
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
        <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Payments for accepted proposals run through a <strong className="font-semibold">simulated escrow</strong> — no real funds, wallets or blockchain
          transactions are involved.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
