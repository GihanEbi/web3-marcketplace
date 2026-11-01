import type { Metadata } from "next";
import { PricingPage as PricingView } from "@/components/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free, Professional and Business plans for job seekers, freelancers and hiring teams. Checkout is simulated.",
};

export default function PricingPage() {
  return <PricingView />;
}
