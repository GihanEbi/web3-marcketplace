"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Briefcase, Loader2, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { ROLE_HOME } from "@/config/nav";
import { DEMO_ACCOUNTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { loginAs } from "@/services";
import type { Role } from "@/types";

const META: Record<Role, { icon: typeof User; tint: string; perks: string }> = {
  seeker: { icon: User, tint: "from-indigo-500 to-violet-500", perks: "Apply to jobs, AI career tools, wallet & contracts" },
  employer: { icon: Briefcase, tint: "from-violet-500 to-fuchsia-500", perks: "Post jobs, ATS pipeline, interviews, projects" },
  admin: { icon: ShieldCheck, tint: "from-sky-500 to-indigo-500", perks: "Moderation, users, revenue & platform settings" },
};

/** One-click demo sign-in cards. Role switching is simulated – not real authentication. */
export function DemoAccounts({ next }: { next?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Role | null>(null);

  async function enter(role: Role) {
    setBusy(role);
    try {
      const user = await loginAs(DEMO_ACCOUNTS[role].userId);
      toast.success(`Welcome, ${user.name.split(" ")[0]}!`, { description: `Signed in as ${DEMO_ACCOUNTS[role].label} (demo)` });
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext ?? ROLE_HOME[role]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign in");
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-2.5">
      {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((role) => {
        const { icon: Icon, tint, perks } = META[role];
        const loading = busy === role;
        return (
          <button
            key={role}
            type="button"
            onClick={() => enter(role)}
            disabled={busy !== null}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl border bg-card/60 p-3 text-left transition-all",
              "hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60",
            )}
          >
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white", tint)}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{DEMO_ACCOUNTS[role].label}</span>
              <span className="block truncate text-xs text-muted-foreground">{DEMO_ACCOUNTS[role].description}</span>
              <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/70">{perks}</span>
            </span>
            {loading ? (
              <Loader2 className="size-4 animate-spin text-primary" aria-label="Signing in" />
            ) : (
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
