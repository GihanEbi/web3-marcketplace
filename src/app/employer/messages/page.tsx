"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessagingPanel } from "@/components/messaging/messaging-panel";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

function Inbox() {
  const params = useSearchParams();
  return <MessagingPanel viewer="employer" initialConversationId={params.get("c")} />;
}

export default function EmployerMessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Talk to candidates about their applications and interviews." />
      <Suspense fallback={<LoadingSkeleton variant="chat" />}>
        <Inbox />
      </Suspense>
    </div>
  );
}
