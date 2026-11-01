import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[34rem] rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="bg-grid absolute inset-0 opacity-40" />
      </div>
      <header className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to site
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main-content" className="container mx-auto flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
