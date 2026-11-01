export type ProfileTab = "basics" | "skills" | "experience" | "education" | "portfolio" | "resume" | "preferences";

export const PROFILE_TABS: ProfileTab[] = ["basics", "skills", "experience", "education", "portfolio", "resume", "preferences"];

export function isProfileTab(value: string | null | undefined): value is ProfileTab {
  return Boolean(value) && (PROFILE_TABS as string[]).includes(value as string);
}

/** Maps a `profileCompletion().missing` label to the profile tab where it can be fixed. */
export function tabForMissing(label: string): ProfileTab {
  switch (label) {
    case "Profile photo":
    case "Headline":
    case "Professional summary":
    case "GitHub link":
    case "LinkedIn link":
      return "basics";
    case "Skills (5+)":
      return "skills";
    case "Work experience":
      return "experience";
    case "Education":
    case "Certifications":
      return "education";
    case "Portfolio projects":
      return "portfolio";
    case "Resume / CV":
      return "resume";
    case "Wallet address":
      return "preferences";
    default:
      return "basics";
  }
}

export function profileTabHref(tab: ProfileTab): string {
  return `/profile?tab=${tab}`;
}
