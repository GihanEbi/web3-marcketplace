"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink, FolderGit2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SkillTag } from "@/components/shared/skill-tag";
import { makeId } from "@/store/app-store";
import type { Candidate, PortfolioProject } from "@/types";
import { Field, ProfileSection, saveCandidate } from "./profile-ui";

const schema = z.object({
  title: z.string().trim().min(2, "Project title is required").max(80, "Keep the title under 80 characters"),
  description: z.string().trim().min(10, "Describe the project in at least 10 characters").max(400, "Keep it under 400 characters"),
  url: z.url("Enter a valid URL, e.g. https://github.com/you/project"),
  tags: z.string().trim().max(120, "Keep tags under 120 characters"),
});
type FormValues = z.infer<typeof schema>;

function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => {
      const key = t.toLowerCase();
      if (!t || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function ProjectForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: PortfolioProject;
  onCancel: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      url: initial?.url ?? "",
      tags: initial?.tags.join(", ") ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field id="proj-title" label="Project title" error={errors.title?.message}>
        <Input id="proj-title" aria-invalid={!!errors.title} {...register("title")} />
      </Field>
      <Field id="proj-url" label="Project URL" error={errors.url?.message}>
        <Input id="proj-url" type="url" inputMode="url" placeholder="https://" aria-invalid={!!errors.url} {...register("url")} />
      </Field>
      <Field id="proj-desc" label="Description" error={errors.description?.message}>
        <Textarea id="proj-desc" rows={4} aria-invalid={!!errors.description} {...register("description")} />
      </Field>
      <Field id="proj-tags" label="Tags" hint="Comma separated, e.g. Solidity, Foundry, ERC-4626" error={errors.tags?.message}>
        <Input id="proj-tags" aria-invalid={!!errors.tags} {...register("tags")} />
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {initial ? "Save changes" : "Add project"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProfilePortfolio({ candidate }: { candidate: Candidate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioProject | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<PortfolioProject | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const list = candidate.portfolio;

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  async function submit(values: FormValues) {
    const entry: PortfolioProject = {
      id: editing?.id ?? makeId("port"),
      title: values.title,
      description: values.description,
      url: values.url,
      tags: parseTags(values.tags),
    };
    const next = editing ? list.map((p) => (p.id === editing.id ? entry : p)) : [entry, ...list];
    const ok = await saveCandidate(candidate.id, { portfolio: next }, editing ? "Project updated" : "Project added");
    if (ok) setDialogOpen(false);
  }

  return (
    <>
      <ProfileSection
        title="Portfolio projects"
        description="Showcase shipped work — repos, dapps, audits and write-ups."
        actions={
          <Button type="button" variant="gradient" onClick={openAdd}>
            <Plus aria-hidden />
            Add project
          </Button>
        }
      >
        {list.length === 0 ? (
          <EmptyState
            icon={FolderGit2}
            title="No portfolio projects yet"
            description="Link to a repo or live app to show what you can build."
            action={
              <Button type="button" variant="gradient" onClick={openAdd}>
                <Plus aria-hidden />
                Add your first project
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((project) => (
              <li key={project.id} className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-semibold">{project.title}</h3>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${project.title}`}
                      onClick={() => {
                        setEditing(project);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${project.title}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setDeleteTarget(project);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-pretty text-muted-foreground">{project.description}</p>
                {project.tags.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
                    {project.tags.map((tag) => (
                      <li key={tag}>
                        <SkillTag skill={tag} size="sm" variant="outline" />
                      </li>
                    ))}
                  </ul>
                )}
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Open project
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </ProfileSection>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit project" : "Add portfolio project"}</DialogTitle>
            <DialogDescription>Link to something employers can open and explore.</DialogDescription>
          </DialogHeader>
          <ProjectForm initial={editing} onCancel={() => setDialogOpen(false)} onSubmit={submit} />
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove this project?"
        description={`${deleteTarget?.title ?? "This project"} will be removed from your portfolio.`}
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return;
          await saveCandidate(candidate.id, { portfolio: list.filter((p) => p.id !== deleteTarget.id) }, "Project removed");
        }}
      />
    </>
  );
}
