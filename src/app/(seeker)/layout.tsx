import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="seeker">{children}</DashboardShell>;
}
