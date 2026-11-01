import type { Metadata } from "next";
import { BountiesBrowser } from "@/components/bounties/bounties-browser";

export const metadata: Metadata = {
  title: "Web3 Bounties",
  description: "Earn token rewards by completing scoped tasks for DAOs and protocols.",
};

export default function BountiesPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <header className="mb-8 max-w-2xl space-y-2">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">Bounties</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          DAO <span className="gradient-text">bounties</span> &amp; grants
        </h1>
        <p className="text-muted-foreground">
          Pick up scoped tasks from DAOs and protocols and earn token rewards. Show interest and the DAO will reach out.
        </p>
      </header>
      <BountiesBrowser />
    </div>
  );
}
