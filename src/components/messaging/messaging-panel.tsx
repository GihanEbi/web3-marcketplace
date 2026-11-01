"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CompanyLogo } from "@/components/shared/company-logo";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDate, formatRelative, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser, useHydrated, useMyConversations } from "@/store/hooks";
import type { Conversation } from "@/types";

type Viewer = "seeker" | "employer";

interface Counterpart {
  name: string;
  subtitle: string;
  avatar: React.ReactNode;
}

function useCounterpart(viewer: Viewer) {
  const companies = useAppStore((s) => s.companies);
  const candidates = useAppStore((s) => s.candidates);
  const users = useAppStore((s) => s.users);
  return useMemo(
    () =>
      (c: Conversation): Counterpart => {
        if (viewer === "seeker") {
          const company = companies.find((x) => x.id === c.companyId);
          const employer = users.find((u) => u.id === c.employerUserId);
          return {
            name: company?.name ?? "Company",
            subtitle: employer ? `${employer.name}${employer.title ? ` · ${employer.title}` : ""}` : "Recruiter",
            avatar: company ? <CompanyLogo company={company} size="md" /> : <UserAvatar name="Company" />,
          };
        }
        const candidate = candidates.find((x) => x.id === c.candidateId);
        return {
          name: candidate?.name ?? "Candidate",
          subtitle: candidate?.headline ?? "Candidate",
          avatar: <UserAvatar name={candidate?.name ?? "Candidate"} src={candidate?.avatar} size="md" />,
        };
      },
    [viewer, companies, candidates, users],
  );
}

/** Two-pane messaging UI shared by the seeker and employer inboxes. */
export function MessagingPanel({ viewer, initialConversationId }: { viewer: Viewer; initialConversationId?: string | null }) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const conversations = useMyConversations();
  const jobs = useAppStore((s) => s.jobs);
  const applications = useAppStore((s) => s.applications);
  const markRead = useAppStore((s) => s.markConversationRead);
  const counterpart = useCounterpart(viewer);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileThread, setMobileThread] = useState(Boolean(initialConversationId));
  const bottomRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const cp = counterpart(c);
      const last = c.messages[c.messages.length - 1]?.text ?? "";
      return `${cp.name} ${c.subject} ${last}`.toLowerCase().includes(q);
    });
  }, [conversations, query, counterpart]);

  const effectiveId = selectedId ?? (filtered[0]?.id ?? null);
  const selected = useMemo(() => conversations.find((c) => c.id === effectiveId) ?? null, [conversations, effectiveId]);
  const unreadForSelected = selected ? selected.unread[viewer] : 0;
  const messageCount = selected?.messages.length ?? 0;

  useEffect(() => {
    if (selected && unreadForSelected > 0) markRead(selected.id, viewer);
  }, [selected, unreadForSelected, markRead, viewer]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [effectiveId, messageCount]);

  async function handleSend() {
    const text = draft.trim();
    if (!selected || !text || !user) return;
    setSending(true);
    try {
      await sendMessage(selected.id, viewer, user.name, text);
      setDraft("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Message could not be sent");
    } finally {
      setSending(false);
    }
  }

  if (!hydrated) return <LoadingSkeleton variant="chat" />;

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description={
          viewer === "employer"
            ? "Open an applicant and choose “Send message” to start a conversation."
            : "When an employer messages you about an application, it will appear here."
        }
      />
    );
  }

  const job = selected?.jobId ? jobs.find((j) => j.id === selected.jobId) : undefined;
  const application = selected?.applicationId ? applications.find((a) => a.id === selected.applicationId) : undefined;
  const cp = selected ? counterpart(selected) : null;

  return (
    <div className="grid h-[calc(100dvh-14rem)] min-h-[32rem] overflow-hidden rounded-xl border bg-card lg:grid-cols-[22rem_1fr]">
      {/* conversation list */}
      <aside className={cn("flex min-h-0 flex-col border-r", mobileThread && "hidden lg:flex")} aria-label="Conversations">
        <div className="space-y-3 border-b p-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search conversations…" aria-label="Search conversations" />
        </div>
        <ul className="min-h-0 flex-1 divide-y overflow-y-auto scrollbar-thin">
          {filtered.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No conversations match “{query}”.</li>}
          {filtered.map((c) => {
            const info = counterpart(c);
            const last = c.messages[c.messages.length - 1];
            const unread = c.unread[viewer];
            const active = c.id === effectiveId;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(c.id);
                    setMobileThread(true);
                  }}
                  aria-current={active}
                  className={cn("flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/60", active && "bg-primary/10")}
                >
                  <span className="shrink-0">{info.avatar}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{info.name}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelative(c.updatedAt).replace("about ", "")}</span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{c.subject}</span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className={cn("truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>
                        {last ? `${last.senderRole === viewer ? "You: " : ""}${last.text}` : "No messages yet"}
                      </span>
                      {unread > 0 && (
                        <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-5 text-primary-foreground" aria-label={`${unread} unread messages`}>
                          {unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* thread */}
      <section className={cn("flex min-h-0 flex-col", !mobileThread && "hidden lg:flex")} aria-label="Conversation thread">
        {selected && cp ? (
          <>
            <header className="flex items-center gap-3 border-b p-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileThread(false)} aria-label="Back to conversations">
                <ArrowLeft />
              </Button>
              {cp.avatar}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{cp.name}</p>
                <p className="truncate text-xs text-muted-foreground">{cp.subtitle}</p>
              </div>
              {job && (
                <Link
                  href={viewer === "seeker" ? `/jobs/${job.id}` : `/employer/jobs/${job.id}/applicants`}
                  className="hidden max-w-60 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs hover:border-primary/40 sm:flex"
                >
                  <Briefcase className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate font-medium">{job.title}</span>
                  {application && <StatusBadge status={application.status} context={viewer === "employer" ? "ats" : "candidate"} size="sm" />}
                </Link>
              )}
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin" role="log" aria-live="polite" aria-label="Messages">
              <p className="text-center text-xs text-muted-foreground">{selected.subject}</p>
              {selected.messages.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Say hello 👋 — this is the start of your conversation.</p>}
              {selected.messages.map((m, i) => {
                const mine = m.senderRole === viewer;
                const prev = selected.messages[i - 1];
                const showDay = !prev || formatDate(prev.at) !== formatDate(m.at);
                return (
                  <div key={m.id}>
                    {showDay && <p className="my-3 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">{formatDate(m.at)}</p>}
                    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[70%]", mine ? "rounded-br-md bg-linear-to-br from-indigo-500 to-violet-600 text-white" : "rounded-bl-md bg-muted")}>
                        {!mine && <p className="mb-0.5 text-[11px] font-semibold text-primary">{m.senderName}</p>}
                        <p className="whitespace-pre-wrap wrap-break-word">{m.text}</p>
                        <p className={cn("mt-1 text-right text-[10px]", mine ? "text-white/70" : "text-muted-foreground")}>{formatTime(m.at)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form
              className="flex items-end gap-2 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
            >
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
                aria-label="Message"
                rows={1}
                className="max-h-32 min-h-10 resize-none"
              />
              <Button type="submit" variant="gradient" size="icon-lg" disabled={!draft.trim() || sending} aria-label="Send message">
                <Send />
              </Button>
            </form>
          </>
        ) : (
          <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a conversation from the list to read and reply." />
        )}
      </section>
    </div>
  );
}
