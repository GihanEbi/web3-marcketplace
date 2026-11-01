import type { Metadata } from "next";
import { ProjectDetail } from "@/components/projects/project-detail";

export const metadata: Metadata = {
  title: "Project details",
  description: "Scope, budget, milestones and how to submit a proposal.",
};

export default function ProjectDetailPage() {
  return <ProjectDetail />;
}
