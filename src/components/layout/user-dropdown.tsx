"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Globe, LogOut, Settings, UserCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ROLE_LABEL } from "@/config/nav";
import { logout } from "@/services";
import { useCurrentCandidate, useCurrentCompany, useCurrentUser } from "@/store/hooks";

export function UserDropdown() {
  const user = useCurrentUser();
  const candidate = useCurrentCandidate();
  const company = useCurrentCompany();
  const router = useRouter();
  if (!user) return null;

  const settingsHref = user.role === "seeker" ? "/settings" : user.role === "employer" ? "/employer/settings" : "/admin/settings";
  const profileHref = user.role === "seeker" ? "/profile" : user.role === "employer" ? "/employer/company" : "/admin";

  async function handleLogout() {
    await logout();
    toast.success("Signed out of demo session");
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Open user menu"
            className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <UserAvatar name={user.name} src={candidate?.avatar} size="md" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-2">
            <span className="text-sm font-semibold text-foreground">{user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-primary">
              {ROLE_LABEL[user.role]}
              {company ? ` · ${company.name}` : ""}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={profileHref} />}>
          <UserCircle /> {user.role === "employer" ? "Company profile" : user.role === "seeker" ? "My profile" : "Overview"}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={settingsHref} />}>
          <Settings /> Settings
        </DropdownMenuItem>
        {user.role !== "admin" && (
          <DropdownMenuItem render={<Link href="/pricing" />}>
            <CreditCard /> Plan: <span className="capitalize">{user.plan}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem render={<Link href="/" />}>
          <Globe /> Public website
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
