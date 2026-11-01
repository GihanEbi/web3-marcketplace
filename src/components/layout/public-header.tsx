"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, PlusCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserDropdown } from "@/components/layout/user-dropdown";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { WalletButton } from "@/components/wallet/wallet-button";
import { PUBLIC_NAV, ROLE_HOME } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useCurrentUser, useHydrated } from "@/store/hooks";

export function PublicHeader() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Logo />
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                isActive(item.href) ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {hydrated && user ? (
            <>
              <Link href={ROLE_HOME[user.role]} className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}>
                <LayoutDashboard /> Dashboard
              </Link>
              {user.role !== "admin" && <div className="hidden md:block"><WalletButton /></div>}
              <NotificationDropdown />
              <UserDropdown />
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>
                Log in
              </Link>
              <Link href="/register" className={cn(buttonVariants({ variant: "outline" }), "hidden md:inline-flex")}>
                Sign up
              </Link>
            </>
          )}
          {(!user || user.role !== "seeker") && (
            <Link href="/employer/jobs/create" className={cn(buttonVariants({ variant: "gradient" }), "hidden md:inline-flex")}>
              <PlusCircle /> Post a Job
            </Link>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80 gap-0 p-0">
              <SheetHeader className="border-b p-4">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo />
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 p-3">
                {PUBLIC_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
                      isActive(item.href) ? "bg-muted text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto grid gap-2 border-t p-4">
                {hydrated && user ? (
                  <Link href={ROLE_HOME[user.role]} onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline" })}>
                    <LayoutDashboard /> Go to dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline" })}>
                      Log in
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline" })}>
                      Sign up
                    </Link>
                  </>
                )}
                <Link href="/employer/jobs/create" onClick={() => setOpen(false)} className={buttonVariants({ variant: "gradient" })}>
                  <PlusCircle /> Post a Job
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
