import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="size-8" />
      </span>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="max-w-md text-muted-foreground">The page you are looking for does not exist or has moved.</p>
      </div>
      <div className="flex gap-3">
        <Link href="/" className={buttonVariants({ variant: "gradient" })}>
          Back to home
        </Link>
        <Link href="/jobs" className={buttonVariants({ variant: "outline" })}>
          Browse jobs
        </Link>
      </div>
    </div>
  );
}
