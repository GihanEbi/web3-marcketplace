import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: ReactNode;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint + inline error, wired together with aria ids. */
export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="gap-1">
        {label}
        {required && (
          <span aria-hidden className="text-destructive">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
