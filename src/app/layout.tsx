import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Chainhire — AI-powered Web3 Job Marketplace",
    template: "%s · Chainhire",
  },
  description:
    "Discover Web3 jobs, freelance projects and DAO bounties. A frontend demo of an AI-powered Web3 job marketplace with simulated wallet and escrow.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${grotesk.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
