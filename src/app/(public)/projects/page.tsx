import type { Metadata } from "next";
import { ProjectsBrowser } from "@/components/projects/projects-browser";

export const metadata: Metadata = {
  title: "Freelance Web3 Projects",
  description: "Fixed-price and hourly freelance work for smart contract, frontend and security specialists, paid in crypto.",
};

export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <header className="mb-8 max-w-2xl space-y-2">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">Freelance</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Freelance <span className="gradient-text">Web3 projects</span>
        </h1>
        <p className="text-muted-foreground">
          Send proposals to vetted teams and get paid milestone by milestone through a simulated on-chain escrow.
        </p>
      </header>
      <ProjectsBrowser />
    </div>
  );
}
