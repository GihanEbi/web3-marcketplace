"use client";

import Link from "next/link";
import { ChevronsLeft, ChevronsRight, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/brand/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ROLE_LABEL } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser } from "@/store/hooks";
import type { Role } from "@/types";

export function AppSidebar({ role }: { role: Role }) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const user = useCurrentUser();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
      aria-label="Sidebar"
    >
      <div className={cn("flex h-16 items-center border-b px-4", collapsed ? "justify-center px-0" : "justify-between")}>
        {collapsed ? <LogoMark /> : <Logo href="/" />}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn("py-4", collapsed ? "px-2" : "px-3")}>
          {!collapsed && (
            <p className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {ROLE_LABEL[role]} workspace
            </p>
          )}
          <SidebarNav role={role} collapsed={collapsed} />
        </div>
      </ScrollArea>

      <div className={cn("space-y-3 border-t p-3", collapsed && "px-2")}>
        {!collapsed && role !== "admin" && user?.plan === "free" && (
          <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/15 via-primary/5 to-transparent p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" /> Upgrade your plan
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Unlock advanced AI tools and deeper insights.</p>
            <Link href="/pricing" className={cn(buttonVariants({ variant: "gradient", size: "sm" }), "mt-3 w-full")}>
              View plans
            </Link>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn("w-full text-muted-foreground", !collapsed && "justify-start")}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && "Collapse"}
        </Button>
      </div>
    </aside>
  );
}
