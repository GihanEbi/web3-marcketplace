"use client";

import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ProfileView } from "@/components/seeker/profile-view";

export default function SeekerProfilePage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="detail" />}>
      <ProfileView />
    </Suspense>
  );
}
