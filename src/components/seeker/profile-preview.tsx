"use client";

import { Award, Briefcase, ExternalLink, Globe, GraduationCap, MapPin, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GithubIcon, LinkedinIcon } from "@/components/brand/brand-icons";
import { SkillTagList, SkillTag } from "@/components/shared/skill-tag";
import { UserAvatar } from "@/components/shared/user-avatar";
import { shortenAddress } from "@/lib/format";
import type { Candidate } from "@/types";
import { formatMonth } from "./profile-ui";

interface ProfilePreviewProps {
  candidate: Candidate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Block({ icon: Icon, title, children }: { icon: typeof Briefcase; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="size-4" aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Renders the profile the way employers see it. */
export function ProfilePreview({ candidate, open, onOpenChange }: ProfilePreviewProps) {
  const links = [
    { href: candidate.githubUrl, label: "GitHub", icon: GithubIcon },
    { href: candidate.linkedinUrl, label: "LinkedIn", icon: LinkedinIcon },
    { href: candidate.website, label: "Website", icon: Globe },
  ].filter((l) => l.href);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Public profile preview</DialogTitle>
          <DialogDescription>This is how employers see your profile.</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
          Preview — this is how employers see your profile. Your e-mail and phone stay private until you apply.
        </div>

        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <UserAvatar name={candidate.name} src={candidate.avatar} size="xl" />
          <div className="min-w-0 space-y-1.5">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">{candidate.name}</h2>
            <p className="text-base text-muted-foreground">{candidate.headline}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {candidate.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="size-4" aria-hidden />
                {candidate.yearsOfExperience} yrs · {candidate.experienceLevel}
              </span>
              {candidate.walletAddress && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                  <Wallet className="size-4" aria-hidden />
                  {shortenAddress(candidate.walletAddress)}
                </span>
              )}
            </div>
            <p className="inline-flex h-6 items-center rounded-full bg-success/15 px-2.5 text-xs font-medium text-success">
              {candidate.availability === "Not looking" ? "Not actively looking" : candidate.availability === "Immediately" ? "Available immediately" : `Available in ${candidate.availability}`}
            </p>
          </div>
        </header>

        {candidate.summary && (
          <Block icon={Briefcase} title="About">
            <p className="text-sm leading-relaxed text-pretty">{candidate.summary}</p>
          </Block>
        )}

        {candidate.skills.length > 0 && (
          <Block icon={Briefcase} title="Skills">
            <SkillTagList skills={candidate.skills} size="md" />
          </Block>
        )}

        {candidate.experience.length > 0 && (
          <Block icon={Briefcase} title="Experience">
            <ol className="relative space-y-5 border-l border-border pl-5">
              {candidate.experience.map((item) => (
                <li key={item.id} className="relative">
                  <span aria-hidden className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary ring-4 ring-popover" />
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.company}
                    {item.location ? ` · ${item.location}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMonth(item.startDate)} – {item.endDate ? formatMonth(item.endDate) : "Present"}
                  </p>
                  {item.description && <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{item.description}</p>}
                </li>
              ))}
            </ol>
          </Block>
        )}

        {candidate.education.length > 0 && (
          <Block icon={GraduationCap} title="Education">
            <ul className="space-y-2">
              {candidate.education.map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="font-medium">{item.school}</p>
                  <p className="text-muted-foreground">
                    {item.degree}, {item.field} · {item.startYear} – {item.endYear ?? "Present"}
                  </p>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {candidate.certifications.length > 0 && (
          <Block icon={Award} title="Certifications">
            <ul className="space-y-1 text-sm">
              {candidate.certifications.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {item.issuer} · {item.year}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {candidate.portfolio.length > 0 && (
          <Block icon={ExternalLink} title="Portfolio">
            <ul className="grid gap-3 sm:grid-cols-2">
              {candidate.portfolio.map((project) => (
                <li key={project.id} className="space-y-2 rounded-xl border border-border p-3">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium hover:text-primary"
                  >
                    {project.title}
                    <ExternalLink className="size-3.5" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <p className="text-xs text-pretty text-muted-foreground">{project.description}</p>
                  <ul className="flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <li key={tag}>
                        <SkillTag skill={tag} size="sm" variant="outline" />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {links.length > 0 && (
          <Block icon={Globe} title="Links">
            <ul className="flex flex-wrap gap-3">
              {links.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Block>
        )}
      </DialogContent>
    </Dialog>
  );
}
