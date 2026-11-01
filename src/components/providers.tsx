"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "@/store/app-store";

/**
 * Rehydrates the persisted Zustand store from localStorage after mount
 * (skipHydration is on, so server + first client render both use seed data and
 * there is never a hydration mismatch). Pages should wait for `useHydrated()`
 * before rendering data-driven UI.
 */
function StoreHydrator() {
  useEffect(() => {
    const finish = () => useAppStore.setState({ hydrated: true });
    try {
      const result = useAppStore.persist.rehydrate();
      if (result instanceof Promise) result.then(finish, finish);
      else finish();
    } catch {
      finish();
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider delay={200}>
        <StoreHydrator />
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  );
}
