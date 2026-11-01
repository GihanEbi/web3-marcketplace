"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  Briefcase,
  CalendarClock,
  CheckCheck,
  Coins,
  Handshake,
  MessageSquare,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useRole, useRoleNotifications } from "@/store/hooks";
import type { AppNotification, NotificationType } from "@/types";

const ICONS: Record<NotificationType, LucideIcon> = {
  application: Briefcase,
  status_change: RefreshCw,
  interview: CalendarClock,
  message: MessageSquare,
  recommendation: Sparkles,
  proposal: Handshake,
  payment: Coins,
  system: BellRing,
};

export function NotificationDropdown() {
  const role = useRole();
  const router = useRouter();
  const notifications = useRoleNotifications();
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const visible = useMemo(() => (tab === "unread" ? notifications.filter((n) => !n.read) : notifications), [notifications, tab]);

  if (!role) return null;

  function open_(n: AppNotification) {
    markRead(n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} />}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4.5 text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] gap-0 p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h3 className="font-heading text-sm font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          <Button variant="ghost" size="sm" disabled={unread === 0} onClick={() => markAll(role)}>
            <CheckCheck /> Mark all read
          </Button>
        </div>
        <div className="flex gap-1 border-b px-3 py-2" role="tablist" aria-label="Notification filter">
          {(["all", "unread"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <ScrollArea className="h-[min(26rem,60vh)]">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground">
              <Bell className="size-8 opacity-40" />
              {tab === "unread" ? "You're all caught up." : "No notifications yet."}
            </div>
          ) : (
            <ul className="divide-y">
              {visible.map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => open_(n)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{n.title}</span>
                          {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground/80">{formatRelative(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
