import type { Metadata } from "next";
import { BountyDetail } from "@/components/bounties/bounty-detail";

export const metadata: Metadata = {
  title: "Bounty details",
  description: "Reward, deliverables, deadline and how to submit your interest.",
};

export default function BountyDetailPage() {
  return <BountyDetail />;
}
