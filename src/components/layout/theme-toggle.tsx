"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = !mounted || resolvedTheme === "dark";
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          />
        }
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
    </Tooltip>
  );
}
