"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SkillTag } from "@/components/shared/skill-tag";
import { SKILLS } from "@/lib/constants";

interface SkillTagInputProps {
  id?: string;
  value: string[];
  onChange: (skills: string[]) => void;
  max?: number;
  invalid?: boolean;
}

/** Tag input with typeahead suggestions from the shared skill list. */
export function SkillTagInput({ id, value, onChange, max = 12, invalid }: SkillTagInputProps) {
  const [text, setText] = useState("");

  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase();
    const taken = new Set(value.map((s) => s.toLowerCase()));
    return SKILLS.filter((s) => !taken.has(s.toLowerCase()) && (q === "" || s.toLowerCase().includes(q))).slice(0, 8);
  }, [text, value]);

  function add(raw: string) {
    const skill = raw.trim();
    if (!skill || value.length >= max) return;
    if (value.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setText("");
      return;
    }
    // keep canonical casing when the skill is a known one
    const canonical = SKILLS.find((s) => s.toLowerCase() === skill.toLowerCase());
    onChange([...value, canonical ?? skill]);
    setText("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && text === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Selected skills">
          {value.map((skill) => (
            <li key={skill}>
              <SkillTag skill={skill} onRemove={() => onChange(value.filter((s) => s !== skill))} />
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={value.length >= max ? `Maximum of ${max} skills reached` : "Type a skill and press Enter (e.g. Solidity)"}
          disabled={value.length >= max}
          aria-invalid={invalid}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => add(text)}
          disabled={text.trim() === "" || value.length >= max}
          aria-label="Add skill"
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-input px-2.5 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden />
          Add
        </button>
      </div>
      {suggestions.length > 0 && value.length < max && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Skill suggestions">
          <span className="text-xs text-muted-foreground">Suggestions:</span>
          {suggestions.map((skill) => (
            <SkillTag key={skill} skill={`+ ${skill}`} variant="outline" onClick={() => add(skill)} />
          ))}
        </div>
      )}
    </div>
  );
}
