"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useUnreadMessages } from "@/store/hooks";
import type { Role } from "@/types";

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

interface SidebarNavProps {
  role: Role;
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** Role-specific navigation list shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ role, collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const unreadMessages = useUnreadMessages();
  const groups = NAV[role];

  return (
    <nav aria-label={`${role} navigation`} className="flex flex-col gap-5">
      {groups.map((group, gi) => (
        <div key={group.label ?? gi} className="flex flex-col gap-1">
          {group.label && !collapsed && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.label}</p>
          )}
          {group.label && collapsed && gi > 0 && <div className="mx-3 my-1 h-px bg-border" aria-hidden />}
          {group.items.map((item) => {
            const active = isActive(pathname, item);
            const badge = item.badge === "messages" ? unreadMessages : 0;
            const Icon = item.icon;
            const link = (
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "bg-linear-to-r from-primary/20 to-primary/5 text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
                <Icon className={cn("size-4.5 shrink-0", active && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {badge > 0 && (
                  <span
                    className={cn(
                      "ml-auto flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-5 text-primary-foreground",
                      collapsed && "absolute right-1 top-0.5 ml-0 min-w-4 px-1 leading-4",
                    )}
                    aria-label={`${badge} unread`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger render={<div />}>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <div key={item.href}>{link}</div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
