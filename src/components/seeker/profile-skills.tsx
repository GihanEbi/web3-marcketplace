"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkillTag } from "@/components/shared/skill-tag";
import { SKILLS } from "@/lib/constants";
import type { Candidate } from "@/types";
import { ProfileSection, saveCandidate } from "./profile-ui";

const MAX_SKILLS = 40;

export function ProfileSkills({ candidate }: { candidate: Candidate }) {
  const [skills, setSkills] = useState<string[]>(candidate.skills);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () => skills.length !== candidate.skills.length || skills.some((s, i) => s !== candidate.skills[i]),
    [skills, candidate.skills],
  );

  const suggestions = useMemo(() => {
    const have = new Set(skills.map((s) => s.toLowerCase()));
    const q = input.trim().toLowerCase();
    return SKILLS.filter((s) => !have.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(q))).slice(0, 14);
  }, [skills, input]);

  function add(raw: string) {
    const value = raw.trim().replace(/\s+/g, " ");
    if (!value) return;
    if (value.length > 30) {
      toast.error("Skill names must be 30 characters or fewer");
      return;
    }
    if (skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      toast.info(`${value} is already in your skills`);
      setInput("");
      return;
    }
    if (skills.length >= MAX_SKILLS) {
      toast.error(`You can list up to ${MAX_SKILLS} skills`);
      return;
    }
    // Prefer the canonical casing from the suggestion list (e.g. "solidity" -> "Solidity").
    const canonical = SKILLS.find((s) => s.toLowerCase() === value.toLowerCase()) ?? value;
    setSkills((prev) => [...prev, canonical]);
    setInput("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await saveCandidate(candidate.id, { skills }, "Skills saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProfileSection
      title="Technical skills"
      description="Skills drive your AI match scores — add everything you work with confidently."
      actions={
        <Button type="button" variant="gradient" onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {saving ? "Saving…" : "Save skills"}
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="skill-input">Add a skill</Label>
          <div className="flex gap-2">
            <Input
              id="skill-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a skill and press Enter…"
              autoComplete="off"
            />
            <Button type="button" variant="outline" onClick={() => add(input)} disabled={!input.trim()}>
              <Plus aria-hidden />
              Add
            </Button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Suggestions</p>
            <ul className="flex flex-wrap gap-1.5" aria-label="Suggested skills">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => add(s)}
                    className="inline-flex h-6 items-center gap-1 rounded-full border border-dashed border-border px-2.5 text-xs text-muted-foreground transition-colors outline-none hover:border-primary/50 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <Plus className="size-3" aria-hidden />
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Your skills ({skills.length}/{MAX_SKILLS})
          </p>
          {skills.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No skills yet. Add at least five to complete this part of your profile.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2" aria-label="Your skills">
              {skills.map((skill) => (
                <li key={skill}>
                  <SkillTag skill={skill} size="md" onRemove={() => setSkills((prev) => prev.filter((s) => s !== skill))} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ProfileSection>
  );
}
