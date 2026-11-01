"use client";

import { forwardRef, type ChangeEvent, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value" | "defaultValue" | "children"> {
  value?: string;
  /** Receives the selected value (not the DOM event). Use with `Controller`. */
  onChange?: (value: string) => void;
  options: SelectOption[];
  /** Shown (muted) while `value === ""`. */
  placeholder?: string;
  className?: string;
}

/**
 * Native `<select>` styled to match `Input` (h-9, rounded-lg, chevron).
 * Forwards its ref and any extra select props (`name`, `onBlur`, `aria-invalid`, …),
 * so it plugs straight into react-hook-form's `Controller`.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { value, onChange, options, placeholder, className, disabled, ...rest },
  ref,
) {
  const isEmpty = value === "" || value === undefined;

  return (
    <div className={cn("relative w-full", className)}>
      <select
        ref={ref}
        data-slot="select-field"
        value={value}
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value)}
        className={cn(
          "h-9 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent pr-8 pl-2.5 text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          "[&>option]:bg-popover [&>option]:text-popover-foreground",
          isEmpty && placeholder ? "text-muted-foreground" : "text-foreground",
        )}
        {...rest}
      >
        {placeholder !== undefined && (
          <option value="" disabled={!isEmpty}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
});
