"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ROLE_HOME, SEGMENT_LABEL } from "@/config/nav";
import { useAppStore } from "@/store/app-store";
import type { Role } from "@/types";

function humanize(segment: string): string {
  return segment.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Breadcrumbs derived from the URL; resolves dynamic ids to readable titles via the store. */
export function Breadcrumbs({ role }: { role: Role }) {
  const pathname = usePathname();
  const jobs = useAppStore((s) => s.jobs);
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const candidates = useAppStore((s) => s.candidates);
  const contracts = useAppStore((s) => s.contracts);

  const crumbs = useMemo(() => {
    const home = ROLE_HOME[role];
    const segments = pathname.split("/").filter(Boolean);
    const out: { href: string; label: string; linkable: boolean }[] = [];
    let acc = "";
    segments.forEach((seg, i) => {
      acc += `/${seg}`;
      // For employer/admin, the first segment IS the home - skip it as a separate crumb
      if (i === 0 && acc === home && role !== "seeker") return;
      if (acc === home && role === "seeker") return;
      const prev = segments[i - 1];
      let label = SEGMENT_LABEL[seg] ?? humanize(seg);
      if (prev === "jobs") label = jobs.find((j) => j.id === seg)?.title ?? label;
      else if (prev === "projects") label = projects.find((p) => p.id === seg)?.title ?? label;
      else if (prev === "companies") label = companies.find((c) => c.id === seg)?.name ?? label;
      else if (prev === "candidates") label = candidates.find((c) => c.id === seg)?.name ?? label;
      else if (prev === "contracts") label = contracts.find((c) => c.id === seg)?.title ?? label;
      else if (prev === "applications") label = "Application";
      // /employer/jobs/[id] has no page of its own – only its /edit and /applicants children do
      const linkable = !(role === "employer" && prev === "jobs" && i < segments.length - 1 && segments[i + 1] !== undefined && seg !== "create");
      out.push({ href: acc, label, linkable });
    });
    return out;
  }, [pathname, role, jobs, companies, projects, candidates, contracts]);

  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={ROLE_HOME[role]} aria-label="Dashboard home" />}>
            <Home className="size-3.5" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={c.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {last || !c.linkable ? (
                  <BreadcrumbPage className="max-w-48 truncate">{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={c.href} />} className="max-w-40 truncate">
                    {c.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
