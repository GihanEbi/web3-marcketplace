import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";

export const metadata: Metadata = {
  title: { absolute: "Chainhire — Discover Your Next Opportunity in Web3" },
  description:
    "AI-powered Web3 job marketplace: find jobs, freelance projects and DAO bounties, with simulated wallet and escrow payments.",
};

export default function Page() {
  return <HomePage />;
}
