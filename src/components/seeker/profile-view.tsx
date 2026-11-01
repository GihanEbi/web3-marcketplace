"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Camera,
  CheckCircle2,
  Eye,
  FileText,
  FolderGit2,
  GraduationCap,
  Loader2,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { profileCompletion } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { useCurrentCandidate, useHydrated } from "@/store/hooks";
import { ProfileBasics } from "./profile-basics";
import { ProfileEducation } from "./profile-education";
import { ProfileExperience } from "./profile-experience";
import { ProfilePortfolio } from "./profile-portfolio";
import { ProfilePreferences } from "./profile-preferences";
import { ProfilePreview } from "./profile-preview";
import { ProfileResume } from "./profile-resume";
import { ProfileSkills } from "./profile-skills";
import { isProfileTab, tabForMissing, type ProfileTab } from "./profile-utils";
import { saveCandidate } from "./profile-ui";

const MAX_AVATAR_KB = 300;

const TAB_META: { id: ProfileTab; label: string; icon: LucideIcon }[] = [
  { id: "basics", label: "Basics", icon: UserRound },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "portfolio", label: "Portfolio", icon: FolderGit2 },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
];

export function ProfileView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const candidate = useCurrentCandidate();
  const photoRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const tabParam = params.get("tab");
  const tab: ProfileTab = isProfileTab(tabParam) ? tabParam : "basics";

  function goTo(next: ProfileTab) {
    router.replace(`${pathname}?tab=${next}`, { scroll: false });
  }

  if (!hydrated || !candidate) {
    return (
      <div className="space-y-6">
        <PageHeader title="My profile" description="Keep your professional profile sharp." />
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  const { percent, missing } = profileCompletion(candidate);

  function handlePhoto(file: File | undefined) {
    if (!file || !candidate) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPG or WebP)");
      return;
    }
    if (file.size > MAX_AVATAR_KB * 1024) {
      toast.error(`That photo is ${Math.round(file.size / 1024)} KB. Please choose one under ${MAX_AVATAR_KB} KB.`);
      return;
    }
    const candidateId = candidate.id;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      setPhotoBusy(true);
      try {
        await saveCandidate(candidateId, { avatar: reader.result }, "Profile photo updated");
      } finally {
        setPhotoBusy(false);
      }
    };
    reader.onerror = () => toast.error("Could not read that image");
    reader.readAsDataURL(file);
  }

  async function removePhoto() {
    if (!candidate) return;
    setPhotoBusy(true);
    try {
      await saveCandidate(candidate.id, { avatar: undefined }, "Profile photo removed");
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" description="A complete profile gets more views, better matches and faster responses." />

      <section className="card-glow relative overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <UserAvatar name={candidate.name} src={candidate.avatar} size="xl" />
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              disabled={photoBusy}
              aria-label="Change profile photo"
              className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border border-border bg-card shadow-md outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
            >
              {photoBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-label="Upload profile photo"
              onChange={(e) => {
                handlePhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">{candidate.name}</h2>
            <p className="text-muted-foreground">{candidate.headline}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {candidate.location}
              </span>
              <span
                className={cn(
                  "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
                  candidate.availability === "Not looking" ? "bg-muted text-muted-foreground" : "bg-success/15 text-success",
                )}
              >
                <span aria-hidden className="size-1.5 rounded-full bg-current" />
                {candidate.availability === "Immediately"
                  ? "Available immediately"
                  : candidate.availability === "Not looking"
                    ? "Not actively looking"
                    : `Available in ${candidate.availability}`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
            <Button type="button" variant="gradient" onClick={() => setPreviewOpen(true)}>
              <Eye aria-hidden />
              Preview public profile
            </Button>
            {candidate.avatar && (
              <Button type="button" variant="ghost" size="sm" onClick={removePhoto} disabled={photoBusy}>
                <Trash2 aria-hidden />
                Remove photo
              </Button>
            )}
          </div>
        </div>
        <p className="relative mt-3 text-xs text-muted-foreground">Photos are stored in your browser only (max {MAX_AVATAR_KB} KB).</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem] xl:items-start">
        <div className="min-w-0 space-y-6">
          <div role="tablist" aria-label="Profile sections" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 scrollbar-thin">
            {TAB_META.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={active}
                  aria-controls="profile-panel"
                  onClick={() => goTo(id)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active ? "gradient-brand text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>

          <div id="profile-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-6">
            {tab === "basics" && <ProfileBasics candidate={candidate} />}
            {tab === "skills" && <ProfileSkills candidate={candidate} />}
            {tab === "experience" && <ProfileExperience candidate={candidate} />}
            {tab === "education" && <ProfileEducation candidate={candidate} />}
            {tab === "portfolio" && <ProfilePortfolio candidate={candidate} />}
            {tab === "resume" && <ProfileResume candidate={candidate} />}
            {tab === "preferences" && <ProfilePreferences candidate={candidate} />}
          </div>
        </div>

        <aside aria-label="Profile completion" className="order-first xl:sticky xl:top-24 xl:order-last">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profile completion</p>
                <p className="font-heading text-4xl font-semibold tabular-nums">{percent}%</p>
              </div>
              {percent === 100 && <CheckCircle2 className="size-8 text-success" aria-hidden />}
            </div>
            <Progress value={percent} aria-label="Profile completion" />
            {missing.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Next steps</p>
                <ul className="space-y-1.5">
                  {missing.slice(0, 5).map((item) => (
                    <li key={item}>
                      <Link
                        href={`/profile?tab=${tabForMissing(item)}`}
                        scroll={false}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span aria-hidden className="size-1.5 rounded-full bg-warning" />
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">Your profile is complete. Employers love that.</p>
            )}
          </div>
        </aside>
      </div>

      <ProfilePreview candidate={candidate} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
