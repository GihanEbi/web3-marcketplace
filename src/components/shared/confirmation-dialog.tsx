"use client";

import { useState, type ReactNode } from "react";
import { Loader2, TriangleAlert, CircleHelp } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** May be async; errors are swallowed (the caller is expected to toast them). */
  onConfirm: () => void | Promise<void>;
  /** Externally-controlled pending state (merged with the internal one). */
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  loading = false,
}: ConfirmationDialogProps) {
  const [pending, setPending] = useState(false);
  const busy = pending || loading;

  async function handleConfirm() {
    if (busy) return;
    setPending(true);
    try {
      await onConfirm();
    } catch {
      // handled by the caller (toast)
    } finally {
      setPending(false);
      onOpenChange(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (busy && !next) return;
    onOpenChange(next);
  }

  const MediaIcon = destructive ? TriangleAlert : CircleHelp;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={cn(destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}
          >
            <MediaIcon aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={busy}
            className={destructive ? "bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/80" : undefined}
          >
            {busy && <Loader2 className="animate-spin" aria-hidden />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
