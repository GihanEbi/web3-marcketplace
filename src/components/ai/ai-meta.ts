import {
  BarChart3,
  FilePenLine,
  FileSearch,
  FileText,
  ListChecks,
  MessageSquare,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { AIHistoryType } from "@/types";

export interface AIHistoryTypeMeta {
  label: string;
  icon: LucideIcon;
  /** tile background + icon colour */
  tone: string;
}

export const AI_HISTORY_META: Record<AIHistoryType, AIHistoryTypeMeta> = {
  recommendation: { label: "Recommendation", icon: Target, tone: "bg-primary/15 text-primary" },
  chat: { label: "Chat", icon: MessageSquare, tone: "bg-info/15 text-info" },
  cover_letter: { label: "Cover letter", icon: FileText, tone: "bg-success/15 text-success" },
  resume_analysis: { label: "Resume analysis", icon: FileSearch, tone: "bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_40%)] dark:text-warning" },
  recruitment_insight: { label: "Insight", icon: BarChart3, tone: "bg-primary/15 text-primary" },
  job_description: { label: "Job description", icon: FilePenLine, tone: "bg-success/15 text-success" },
  interview_questions: { label: "Interview questions", icon: ListChecks, tone: "bg-info/15 text-info" },
};

export const SEEKER_HISTORY_TYPES: AIHistoryType[] = ["recommendation", "chat", "cover_letter", "resume_analysis"];
export const EMPLOYER_HISTORY_TYPES: AIHistoryType[] = ["chat", "recruitment_insight", "recommendation", "job_description", "interview_questions"];

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}
