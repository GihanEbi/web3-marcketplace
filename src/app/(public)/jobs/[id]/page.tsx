import type { Metadata } from "next";
import { JobDetail } from "@/components/jobs/job-detail";

export const metadata: Metadata = {
  title: "Job details",
  description: "Role overview, requirements, compensation and how to apply.",
};

export default function JobDetailPage() {
  return <JobDetail />;
}
