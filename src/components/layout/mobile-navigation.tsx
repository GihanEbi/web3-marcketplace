"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ROLE_LABEL } from "@/config/nav";
import type { Role } from "@/types";

/** Slide-in navigation drawer for < lg screens. */
export function MobileNavigation({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 p-0 sm:max-w-72">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo />
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{ROLE_LABEL[role]} workspace</p>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-3">
            <SidebarNav role={role} onNavigate={() => setOpen(false)} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
