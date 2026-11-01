import {
  Bookmark,
  Bot,
  Briefcase,
  Building2,
  CalendarClock,
  CreditCard,
  FileSearch,
  FileText,
  Flag,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserCircle,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** exact match only (used for dashboard roots) */
  exact?: boolean;
  /** key for dynamic badge counts */
  badge?: "messages" | "notifications";
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const ROLE_HOME: Record<Role, string> = {
  seeker: "/dashboard",
  employer: "/employer",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  seeker: "Job Seeker",
  employer: "Employer",
  admin: "Administrator",
};

export const NAV: Record<Role, NavGroup[]> = {
  seeker: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
        { label: "My Profile", href: "/profile", icon: UserCircle },
      ],
    },
    {
      label: "Job search",
      items: [
        { label: "Applications", href: "/applications", icon: FileText },
        { label: "Saved Jobs", href: "/saved-jobs", icon: Bookmark },
        { label: "Recommended", href: "/recommended-jobs", icon: Target },
        { label: "Interviews", href: "/interviews", icon: CalendarClock },
      ],
    },
    {
      label: "AI tools",
      items: [
        { label: "AI Assistant", href: "/ai-assistant", icon: Bot },
        { label: "Resume Analysis", href: "/resume-analysis", icon: FileSearch },
      ],
    },
    {
      label: "Work & money",
      items: [
        { label: "Messages", href: "/messages", icon: MessageSquare, badge: "messages" },
        { label: "Contracts", href: "/contracts", icon: Handshake },
        { label: "Wallet", href: "/wallet", icon: Wallet },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ],
  employer: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/employer", icon: LayoutDashboard, exact: true },
        { label: "Company", href: "/employer/company", icon: Building2 },
      ],
    },
    {
      label: "Recruitment",
      items: [
        { label: "Jobs", href: "/employer/jobs", icon: Briefcase },
        { label: "Candidates", href: "/employer/candidates", icon: Users },
        { label: "Interviews", href: "/employer/interviews", icon: CalendarClock },
        { label: "AI Assistant", href: "/employer/ai-assistant", icon: Sparkles },
      ],
    },
    {
      label: "Freelance",
      items: [
        { label: "Projects", href: "/employer/projects", icon: FolderKanban },
        { label: "Proposals", href: "/employer/proposals", icon: Megaphone },
        { label: "Contracts", href: "/employer/contracts", icon: Handshake },
      ],
    },
    {
      label: "Workspace",
      items: [
        { label: "Messages", href: "/employer/messages", icon: MessageSquare, badge: "messages" },
        { label: "Settings", href: "/employer/settings", icon: Settings },
      ],
    },
  ],
  admin: [
    {
      label: "Platform",
      items: [
        { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Companies", href: "/admin/companies", icon: Building2 },
        { label: "Job moderation", href: "/admin/jobs", icon: ShieldCheck },
        { label: "Reports", href: "/admin/reports", icon: Flag },
      ],
    },
    {
      label: "Business",
      items: [
        { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ],
};

/** Human labels for breadcrumb segments */
export const SEGMENT_LABEL: Record<string, string> = {
  dashboard: "Dashboard",
  profile: "Profile",
  applications: "Applications",
  "saved-jobs": "Saved jobs",
  "recommended-jobs": "Recommended jobs",
  "ai-assistant": "AI assistant",
  "resume-analysis": "Resume analysis",
  messages: "Messages",
  interviews: "Interviews",
  wallet: "Wallet",
  contracts: "Contracts",
  settings: "Settings",
  employer: "Employer",
  company: "Company",
  jobs: "Jobs",
  create: "Create",
  edit: "Edit",
  applicants: "Applicants",
  candidates: "Candidates",
  projects: "Projects",
  proposals: "Proposals",
  admin: "Admin",
  users: "Users",
  companies: "Companies",
  reports: "Reports",
  subscriptions: "Subscriptions",
  apply: "Apply",
};

export const PUBLIC_NAV = [
  { label: "Search Jobs", href: "/jobs" },
  { label: "Companies", href: "/companies" },
  { label: "Freelance Projects", href: "/projects" },
  { label: "Web3 Bounties", href: "/bounties" },
  { label: "Pricing", href: "/pricing" },
] as const;

