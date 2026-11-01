"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillTag } from "@/components/shared/skill-tag";
import { SKILLS } from "@/lib/constants";

interface SkillsInputProps {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  invalid?: boolean;
  placeholder?: string;
}

/** Small tag input with clickable skill suggestions (Enter or comma adds). */
export function SkillsInput({ id, value, onChange, max = 12, invalid, placeholder = "Type a skill and press Enter" }: SkillsInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [draft, setDraft] = useState("");
  const lower = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value]);
  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return SKILLS.filter((s) => !lower.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(q))).slice(0, 8);
  }, [draft, lower]);

  function add(raw: string) {
    const tag = raw.trim().replace(/\s+/g, " ");
    setDraft("");
    if (!tag || lower.has(tag.toLowerCase()) || value.length >= max) return;
    onChange([...value, tag]);
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
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={value.length >= max ? `Maximum of ${max} skills` : placeholder}
          disabled={value.length >= max}
          aria-invalid={invalid}
          autoComplete="off"
        />
        <Button type="button" variant="outline" size="icon" onClick={() => add(draft)} disabled={!draft.trim() || value.length >= max} aria-label="Add skill">
          <Plus aria-hidden />
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Selected skills">
          {value.map((skill) => (
            <li key={skill}>
              <SkillTag skill={skill} variant="match" onRemove={() => onChange(value.filter((v) => v !== skill))} />
            </li>
          ))}
        </ul>
      )}
      {suggestions.length > 0 && value.length < max && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Suggested skills">
          {suggestions.map((s) => (
            <li key={s}>
              <SkillTag skill={s} variant="outline" onClick={() => add(s)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
