"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import type { Application, Candidate, Company, Job, Role, User } from "@/types";

/**
 * Read hooks. RULE: never return a freshly-created array/object from a zustand
 * selector (it causes infinite re-renders) – select raw slices and derive with useMemo.
 */

/** true once localStorage state has been merged in (after first client effect) */
export const useHydrated = (): boolean => useAppStore((s) => s.hydrated);

export function useCurrentUser(): User | null {
  const users = useAppStore((s) => s.users);
  const id = useAppStore((s) => s.currentUserId);
  return useMemo(() => users.find((u) => u.id === id) ?? null, [users, id]);
}

export function useRole(): Role | null {
  return useCurrentUser()?.role ?? null;
}

export function useCurrentCandidate(): Candidate | null {
  const user = useCurrentUser();
  const candidates = useAppStore((s) => s.candidates);
  return useMemo(
    () => (user?.candidateId ? (candidates.find((c) => c.id === user.candidateId) ?? null) : null),
    [candidates, user],
  );
}

export function useCurrentCompany(): Company | null {
  const user = useCurrentUser();
  const companies = useAppStore((s) => s.companies);
  return useMemo(
    () => (user?.companyId ? (companies.find((c) => c.id === user.companyId) ?? null) : null),
    [companies, user],
  );
}

export function useJob(id: string | undefined): Job | undefined {
  const jobs = useAppStore((s) => s.jobs);
  return useMemo(() => jobs.find((j) => j.id === id), [jobs, id]);
}

export function useCompany(id: string | undefined): Company | undefined {
  const companies = useAppStore((s) => s.companies);
  return useMemo(() => companies.find((c) => c.id === id), [companies, id]);
}

export function useCandidate(id: string | undefined): Candidate | undefined {
  const candidates = useAppStore((s) => s.candidates);
  return useMemo(() => candidates.find((c) => c.id === id), [candidates, id]);
}

export function useApplication(id: string | undefined): Application | undefined {
  const apps = useAppStore((s) => s.applications);
  return useMemo(() => apps.find((a) => a.id === id), [apps, id]);
}

/** Saved job ids of the current candidate (empty array if not a seeker) */
export function useSavedJobIds(): string[] {
  const candidate = useCurrentCandidate();
  const saved = useAppStore((s) => s.savedJobs);
  return useMemo(() => (candidate ? (saved[candidate.id] ?? []) : []), [saved, candidate]);
}

/** Applications visible to the current user (seeker: own, employer: company's) */
export function useMyApplications(): Application[] {
  const user = useCurrentUser();
  const apps = useAppStore((s) => s.applications);
  return useMemo(() => {
    if (!user) return [];
    if (user.role === "seeker") return apps.filter((a) => a.candidateId === user.candidateId);
    if (user.role === "employer") return apps.filter((a) => a.companyId === user.companyId);
    return apps;
  }, [apps, user]);
}

export function useRoleNotifications() {
  const role = useRole();
  const notifications = useAppStore((s) => s.notifications);
  return useMemo(
    () =>
      role
        ? notifications.filter((n) => n.role === role).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        : [],
    [notifications, role],
  );
}

/** Conversations for the current user, newest first */
export function useMyConversations() {
  const user = useCurrentUser();
  const conversations = useAppStore((s) => s.conversations);
  return useMemo(() => {
    if (!user) return [];
    const list =
      user.role === "seeker"
        ? conversations.filter((c) => c.candidateId === user.candidateId)
        : user.role === "employer"
          ? conversations.filter((c) => c.companyId === user.companyId)
          : conversations;
    return [...list].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [conversations, user]);
}

export function useUnreadMessages(): number {
  const user = useCurrentUser();
  const conversations = useMyConversations();
  return useMemo(() => {
    if (!user || user.role === "admin") return 0;
    return conversations.reduce((sum, c) => sum + c.unread[user.role as "seeker" | "employer"], 0);
  }, [conversations, user]);
}
