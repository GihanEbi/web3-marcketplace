"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  /** Accessible name / toast text, e.g. "Escrow address". When `showLabel` is set it is also rendered. */
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export function CopyButton({ value, label = "Copy", showLabel = false, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(label === "Copy" ? "Copied to clipboard" : `${label} copied`);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  const Icon = copied ? Check : Copy;

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "xs" : "icon-xs"}
      onClick={handleCopy}
      aria-label={copied ? "Copied" : label === "Copy" ? "Copy to clipboard" : `Copy ${label}`}
      className={cn("text-muted-foreground hover:text-foreground", copied && "text-success hover:text-success", className)}
    >
      <Icon aria-hidden />
      {showLabel && <span>{copied ? "Copied" : label}</span>}
    </Button>
  );
}
