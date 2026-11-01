import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function CtaBand() {
  return (
    <section className="container mx-auto px-4 pb-20" aria-labelledby="cta-heading">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-3xl border border-primary/30 gradient-brand px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-30" aria-hidden />
          <div className="pointer-events-none absolute -top-24 -left-16 -z-10 size-72 rounded-full bg-white/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-16 -bottom-24 -z-10 size-72 rounded-full bg-sky-300/30 blur-3xl" aria-hidden />
          <h2 id="cta-heading" className="mx-auto max-w-2xl font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Ready to build your career in Web3?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-white/85 sm:text-lg">
            Join builders and hiring teams on Chainhire. Create a free profile, or publish your first role in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "bg-white text-indigo-700 hover:bg-white/90")}
            >
              Create free profile
              <ArrowRight aria-hidden />
            </Link>
            <Link
              href="/employer/jobs/create"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white")}
            >
              Post a Job
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
