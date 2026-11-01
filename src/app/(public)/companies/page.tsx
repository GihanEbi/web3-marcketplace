import type { Metadata } from "next";
import { CompaniesDirectory } from "@/components/companies/companies-directory";

export const metadata: Metadata = {
  title: "Web3 Companies",
  description: "Explore verified protocols, DAOs, wallets and infrastructure teams hiring on Chainhire.",
};

export default function CompaniesPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <header className="mb-8 max-w-2xl space-y-2">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">Companies</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Teams building the <span className="gradient-text">decentralised web</span>
        </h1>
        <p className="text-muted-foreground">
          Discover protocols, DAOs and infrastructure companies. Verified organisations have completed the Chainhire review.
        </p>
      </header>
      <CompaniesDirectory />
    </div>
  );
}
