"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserDropdown } from "@/components/layout/user-dropdown";
import { WalletButton } from "@/components/wallet/wallet-button";
import type { Role } from "@/types";

const SEARCH_TARGET: Record<Role, { href: string; placeholder: string }> = {
  seeker: { href: "/jobs", placeholder: "Search jobs, companies, skills…" },
  employer: { href: "/employer/candidates", placeholder: "Search candidates by name or skill…" },
  admin: { href: "/admin/users", placeholder: "Search users…" },
};

export function DashboardHeader({ role }: { role: Role }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const target = SEARCH_TARGET[role];

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `${target.href}?q=${encodeURIComponent(q)}` : target.href);
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <MobileNavigation role={role} />
        <form onSubmit={onSubmit} role="search" className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={target.placeholder}
            aria-label="Search"
            className="h-9 bg-muted/40 pl-9"
          />
        </form>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <RoleSwitcher />
          {role !== "admin" && <WalletButton />}
          <ThemeToggle />
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
      <div className="flex h-10 items-center border-t px-4 md:px-6">
        <Breadcrumbs role={role} />
        <p className="text-sm font-medium sm:hidden">Chainhire</p>
      </div>
    </header>
  );
}
