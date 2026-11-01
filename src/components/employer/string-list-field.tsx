"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface StringListFieldProps {
  /** Singular noun used for aria-labels, e.g. "Responsibility" */
  noun: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  max?: number;
  multiline?: boolean;
  invalid?: boolean;
}

/** Dynamic list of text rows with add / remove controls. Fully keyboard operable. */
export function StringListField({
  noun,
  value,
  onChange,
  placeholder,
  addLabel,
  max = 12,
  multiline = false,
  invalid,
}: StringListFieldProps) {
  function update(index: number, text: string) {
    onChange(value.map((r, i) => (i === index ? text : r)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {value.length === 0 && <p className="text-sm text-muted-foreground">No {noun.toLowerCase()} entries yet.</p>}
      {value.map((row, index) => (
        <div key={index} className="flex items-start gap-2">
          <span
            aria-hidden
            className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground tabular-nums"
          >
            {index + 1}
          </span>
          {multiline ? (
            <Textarea
              value={row}
              onChange={(e) => update(index, e.target.value)}
              placeholder={placeholder}
              aria-label={`${noun} ${index + 1}`}
              aria-invalid={invalid && !row.trim()}
              rows={2}
              className="min-h-9"
            />
          ) : (
            <Input
              value={row}
              onChange={(e) => update(index, e.target.value)}
              placeholder={placeholder}
              aria-label={`${noun} ${index + 1}`}
              aria-invalid={invalid && !row.trim()}
              className="h-9"
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            aria-label={`Remove ${noun.toLowerCase()} ${index + 1}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ""])} disabled={value.length >= max}>
          <Plus aria-hidden />
          {addLabel ?? `Add ${noun.toLowerCase()}`}
        </Button>
        {value.length >= max && <span className="text-xs text-muted-foreground">Maximum of {max} reached</span>}
      </div>
    </div>
  );
}
