import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="employer">{children}</DashboardShell>;
}
