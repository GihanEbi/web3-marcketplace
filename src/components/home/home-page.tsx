"use client";

import { AiMatchingSection } from "./ai-matching-section";
import { CtaBand } from "./cta-band";
import { FeaturedCompanies, FeaturedJobs, JobCategories, RecentProjects } from "./discovery-sections";
import { HeroSection } from "./hero-section";
import { HowItWorks } from "./how-it-works";
import { PlatformStats } from "./platform-stats";
import { Web3PaymentsSection } from "./web3-payments-section";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedJobs />
      <JobCategories />
      <FeaturedCompanies />
      <RecentProjects />
      <PlatformStats />
      <AiMatchingSection />
      <HowItWorks />
      <Web3PaymentsSection />
      <CtaBand />
    </>
  );
}
