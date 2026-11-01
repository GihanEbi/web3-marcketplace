"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillTag } from "@/components/shared/skill-tag";
import { cn } from "@/lib/utils";

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: readonly string[];
  placeholder?: string;
  max?: number;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
  className?: string;
}

/** Free-form tag input with clickable suggestions. Enter or comma adds, Backspace on empty removes the last tag. */
export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter",
  max = 30,
  "aria-invalid": invalid,
  "aria-label": ariaLabel,
  className,
}: TagInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [draft, setDraft] = useState("");

  const lower = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value]);
  const shown = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return suggestions.filter((s) => !lower.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(q))).slice(0, 10);
  }, [suggestions, lower, draft]);

  function add(raw: string) {
    const tag = raw.trim().replace(/\s+/g, " ");
    if (!tag || lower.has(tag.toLowerCase()) || value.length >= max) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={value.length >= max ? `Maximum of ${max} reached` : placeholder}
          disabled={value.length >= max}
          aria-invalid={invalid}
          aria-label={ariaLabel}
          autoComplete="off"
          className="h-9"
        />
        <Button type="button" variant="outline" onClick={() => add(draft)} disabled={!draft.trim()} aria-label="Add tag">
          <Plus aria-hidden />
          Add
        </Button>
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Selected tags">
          {value.map((tag) => (
            <li key={tag}>
              <SkillTag skill={tag} onRemove={() => onChange(value.filter((t) => t !== tag))} />
            </li>
          ))}
        </ul>
      )}

      {shown.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Suggestions</p>
          <ul className="flex flex-wrap gap-1.5" aria-label="Suggested tags">
            {shown.map((s) => (
              <li key={s}>
                <SkillTag skill={`+ ${s}`} variant="outline" onClick={() => add(s)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
