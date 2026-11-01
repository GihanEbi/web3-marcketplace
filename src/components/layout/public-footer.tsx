import Link from "next/link";
import { DiscordIcon, GithubIcon, LinkedinIcon, XIcon } from "@/components/brand/brand-icons";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Talent",
    links: [
      { label: "Search jobs", href: "/jobs" },
      { label: "Freelance projects", href: "/projects" },
      { label: "Web3 bounties", href: "/bounties" },
      { label: "Create profile", href: "/register" },
    ],
  },
  {
    title: "Employers",
    links: [
      { label: "Post a job", href: "/employer/jobs/create" },
      { label: "Browse companies", href: "/companies" },
      { label: "Pricing", href: "/pricing" },
      { label: "Employer login", href: "/login" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "AI assistant", href: "/login" },
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/register" },
    ],
  },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t bg-card/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              The AI-powered marketplace for Web3 careers, freelance work and DAO bounties.
            </p>
            <div className="flex items-center gap-2">
              {[
                { label: "X (Twitter)", icon: XIcon },
                { label: "GitHub", icon: GithubIcon },
                { label: "LinkedIn", icon: LinkedinIcon },
                { label: "Discord", icon: DiscordIcon },
              ].map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground"
                  title={`${label} (demo)`}
                  aria-label={`${label} (demo)`}
                >
                  <Icon />
                </span>
              ))}
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 Chainhire. A frontend demo — all companies, people, wallets and transactions are fictional or simulated.</p>
          <p>Built with Next.js · Tailwind · shadcn/ui</p>
        </div>
      </div>
    </footer>
  );
}
