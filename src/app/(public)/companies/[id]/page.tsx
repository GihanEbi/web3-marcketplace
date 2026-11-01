import type { Metadata } from "next";
import { CompanyDetail } from "@/components/companies/company-detail";

export const metadata: Metadata = {
  title: "Company profile",
  description: "Company overview, tech stack, open positions and projects.",
};

export default function CompanyDetailPage() {
  return <CompanyDetail />;
}
