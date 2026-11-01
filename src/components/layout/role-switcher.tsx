"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Check, ChevronsUpDown, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEMO_ACCOUNTS } from "@/lib/constants";
import { ROLE_HOME } from "@/config/nav";
import { loginAs } from "@/services";
import { useCurrentUser } from "@/store/hooks";
import type { Role } from "@/types";

const ICONS: Record<Role, typeof UserIcon> = { seeker: UserIcon, employer: Briefcase, admin: ShieldCheck };

/** Demo account switcher: jump between Job Seeker / Employer / Admin demo users. */
export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const user = useCurrentUser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function switchTo(role: Role) {
    const account = DEMO_ACCOUNTS[role];
    if (user?.id === account.userId) return;
    setBusy(true);
    try {
      const next = await loginAs(account.userId);
      toast.success(`Switched to ${account.label}`, { description: `Signed in as ${next.name} (demo)` });
      router.push(ROLE_HOME[role]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not switch account");
    } finally {
      setBusy(false);
    }
  }

  const ActiveIcon = user ? ICONS[user.role] : UserIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size={compact ? "icon" : "default"} disabled={busy} aria-label="Switch demo account" className="gap-2" />
        }
      >
        <ActiveIcon className="size-4 text-primary" />
        {!compact && (
          <>
            <span className="hidden text-xs font-medium lg:inline">Demo role</span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Switch demo account</DropdownMenuLabel>
          {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((role) => {
            const account = DEMO_ACCOUNTS[role];
            const Icon = ICONS[role];
            const active = user?.id === account.userId;
            return (
              <DropdownMenuItem key={role} onClick={() => switchTo(role)} className="items-start gap-3 py-2">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{account.label}</span>
                  <span className="block text-xs text-muted-foreground">{account.description}</span>
                </span>
                {active && <Check className="mt-1 size-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <p className="px-2 pb-1.5 pt-1 text-[11px] leading-snug text-muted-foreground">
          Demo only — role switching is simulated in the browser and is not real authentication.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
