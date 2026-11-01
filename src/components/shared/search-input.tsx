"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  /** Delay before `onChange` fires while typing. The displayed value always updates instantly. */
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  "aria-label": ariaLabel = "Search",
  debounceMs = 0,
}: SearchInputProps) {
  const [inner, setInner] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  const onChangeRef = useRef(onChange);

  // Adopt external changes (e.g. "reset filters") during render.
  if (value !== lastValue) {
    setLastValue(value);
    setInner(value);
  }

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (debounceMs <= 0 || inner === value) return;
    const timer = setTimeout(() => onChangeRef.current(inner), debounceMs);
    return () => clearTimeout(timer);
  }, [inner, value, debounceMs]);

  function handleChange(next: string) {
    setInner(next);
    if (debounceMs <= 0) onChange(next);
  }

  function clear() {
    setInner("");
    onChange("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape" && inner) {
      e.preventDefault();
      clear();
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="text"
        inputMode="search"
        value={inner}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        className="h-9 pr-9 pl-9"
      />
      {inner && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
