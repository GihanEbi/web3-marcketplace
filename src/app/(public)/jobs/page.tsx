import type { Metadata } from "next";
import { JobsBrowser } from "@/components/jobs/jobs-browser";

export const metadata: Metadata = {
  title: "Browse Web3 Jobs",
  description: "Search smart contract, frontend, security and community roles across Ethereum, Solana, Base and more.",
};

export default function JobsPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <header className="mb-8 max-w-2xl space-y-2">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">Jobs</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Find your next <span className="gradient-text">Web3 role</span>
        </h1>
        <p className="text-muted-foreground">
          Every listing is published by a company on Chainhire. Filter by stack, ecosystem, salary or how you want to be paid.
        </p>
      </header>
      <JobsBrowser />
    </div>
  );
}
