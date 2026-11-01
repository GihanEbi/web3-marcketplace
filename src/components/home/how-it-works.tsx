"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileSearch, Handshake, Send, UserPlus, Users, Wallet, ClipboardList, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

type Audience = "talent" | "employers";

interface Step {
  icon: LucideIcon;
  title: string;
  text: string;
}

const STEPS: Record<Audience, Step[]> = {
  talent: [
    { icon: UserPlus, title: "Create your profile", text: "Add your skills, experience, portfolio and wallet. Profile completeness boosts your visibility." },
    { icon: FileSearch, title: "Discover matched roles", text: "Browse jobs, projects and bounties ranked by an explainable AI match score." },
    { icon: Send, title: "Apply in minutes", text: "Send tailored applications with AI-assisted cover letters and track every stage." },
    { icon: Wallet, title: "Get paid your way", text: "Receive fiat or crypto, with milestone escrow protecting freelance work." },
  ],
  employers: [
    { icon: ClipboardList, title: "Post a role", text: "Publish a job, freelance project or bounty with AI-assisted descriptions." },
    { icon: Users, title: "Review matched talent", text: "See ranked applicants with match scores, skills and screening answers." },
    { icon: Handshake, title: "Interview and hire", text: "Move candidates through your pipeline, schedule interviews and message them." },
    { icon: CheckCircle2, title: "Pay with confidence", text: "Fund milestones in escrow and release payments when work is approved." },
  ],
};

export function HowItWorks() {
  const [audience, setAudience] = useState<Audience>("talent");
  const steps = STEPS[audience];

  return (
    <section className="container mx-auto px-4 py-16 sm:py-20" aria-labelledby="how-it-works">
      <SectionHeading
        eyebrow="How it works"
        title={<span id="how-it-works">From profile to paycheck in four steps</span>}
        description="Whether you are looking for work or building a team, Chainhire keeps the process simple."
        align="center"
        className="mb-8 sm:mb-8"
      />
      <div className="mb-10 flex justify-center">
        <Tabs value={audience} onValueChange={(v) => setAudience(v === "employers" ? "employers" : "talent")}>
          <TabsList className="h-10">
            <TabsTrigger value="talent" className="px-4">
              For talent
            </TabsTrigger>
            <TabsTrigger value="employers" className="px-4">
              For employers
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ol key={audience} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={i * 0.05} className="h-full">
            <div className="relative h-full rounded-xl border border-border bg-card p-6">
              <span className="absolute top-4 right-5 font-heading text-4xl font-bold text-muted-foreground/15 tabular-nums">{i + 1}</span>
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl gradient-brand text-white shadow-lg shadow-primary/20">
                <step.icon className="size-5" aria-hidden />
              </span>
              <h3 className="font-heading text-base font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{step.text}</p>
            </div>
            </Reveal>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex justify-center">
        {audience === "talent" ? (
          <Link href="/register" className={buttonVariants({ variant: "gradient", size: "lg" })}>
            Create your free profile
          </Link>
        ) : (
          <Link href="/employer/jobs/create" className={buttonVariants({ variant: "gradient", size: "lg" })}>
            Post your first job
          </Link>
        )}
      </div>
    </section>
  );
}
