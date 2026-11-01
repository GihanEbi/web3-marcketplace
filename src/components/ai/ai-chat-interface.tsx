"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUp, Briefcase, Eraser, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { CopyButton } from "@/components/shared/copy-button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { nowIso } from "@/lib/clock";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { generateMockAIResponse } from "@/services";
import { makeId } from "@/store/app-store";
import { useHydrated } from "@/store/hooks";
import type { AIChatMessage, AISuggestionCard } from "@/types";
import { AIAvatar } from "./ai-avatar";
import { AIMarkdown, stripMarkdown } from "./ai-markdown";

export interface AIChatInterfaceProps {
  role: "seeker" | "employer";
  suggestions: readonly string[];
  placeholder?: string;
  candidateId?: string | null;
  companyId?: string | null;
  /** used to personalise the welcome message */
  firstName?: string;
  /** overrides the default welcome copy */
  welcome?: string;
  /** sessionStorage key; the conversation survives navigation within the browser tab */
  storageKey?: string;
  /** Tailwind height classes for the chat card */
  heightClassName?: string;
  className?: string;
}

const MAX_STORED = 60;

function readStored(key: string | undefined): AIChatMessage[] {
  // Only called from a lazy state initialiser of a component that mounts after hydration.
  if (!key || typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is AIChatMessage =>
        typeof m === "object" && m !== null && typeof (m as AIChatMessage).id === "string" && typeof (m as AIChatMessage).text === "string" && ((m as AIChatMessage).from === "user" || (m as AIChatMessage).from === "assistant"),
    );
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function SuggestionCards({ cards }: { cards: AISuggestionCard[] }) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Suggestions">
      {cards.map((card) => {
        const Icon = card.kind === "job" ? Briefcase : card.kind === "tip" ? Lightbulb : ArrowRight;
        const body = (
          <>
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                card.kind === "job" ? "bg-primary/15 text-primary" : card.kind === "tip" ? "bg-warning/15 text-warning" : "bg-success/15 text-success",
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{card.title}</span>
              {card.subtitle && <span className="block truncate text-xs text-muted-foreground">{card.subtitle}</span>}
            </span>
            {card.href && <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/card:translate-x-0.5 group-hover/card:text-primary" aria-hidden />}
          </>
        );
        return (
          <li key={card.id}>
            {card.href ? (
              <Link
                href={card.href}
                className="group/card flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors outline-none hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {body}
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5" role="status" aria-label="Assistant is typing">
      <AIAvatar size="sm" thinking />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 rounded-full bg-muted-foreground/70 motion-safe:animate-bounce"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">Assistant is typing</span>
    </div>
  );
}

function Message({ message, reduceMotion }: { message: AIChatMessage; reduceMotion: boolean }) {
  const mine = message.from === "user";
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex gap-2.5", mine ? "justify-end" : "items-start")}
    >
      {!mine && <AIAvatar size="sm" className="mt-0.5" />}
      <div className={cn("min-w-0 max-w-[88%] sm:max-w-[78%]", mine && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 shadow-sm",
            mine ? "rounded-br-md bg-linear-to-br from-indigo-500 to-violet-600 text-white" : "rounded-bl-md bg-muted",
          )}
        >
          {mine ? <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.text}</p> : <AIMarkdown text={message.text} />}
        </div>
        {!mine && message.cards && message.cards.length > 0 && <SuggestionCards cards={message.cards} />}
        <div className={cn("mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground", mine && "justify-end")}>
          <span>{mine ? "You" : "Chainhire AI"}</span>
          <span aria-hidden>·</span>
          <time dateTime={message.at}>{formatTime(message.at)}</time>
          {!mine && <CopyButton value={stripMarkdown(message.text)} label="Reply" />}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

function ChatSession({
  role,
  suggestions,
  placeholder,
  candidateId,
  companyId,
  firstName,
  welcome,
  storageKey,
  heightClassName = "h-[calc(100dvh-15rem)] min-h-[34rem]",
  className,
}: AIChatInterfaceProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [messages, setMessages] = useState<AIChatMessage[]>(() => readStored(storageKey));
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [failedPrompt, setFailedPrompt] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mountedRef = useRef(true);
  const epochRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // persist the conversation for this browser tab
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      /* storage unavailable – conversation just isn't persisted */
    }
  }, [messages, storageKey]);

  // keep the newest message in view
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages.length, pending, reduceMotion]);

  const greetingName = firstName?.trim() || "there";
  const welcomeText =
    welcome ??
    (role === "seeker"
      ? `Hi ${greetingName}! I'm your Chainhire career assistant. I can find roles that match your skills, review your CV, polish your profile, draft cover letters and help you prepare for interviews.`
      : `Hi ${greetingName}! I'm your recruiting copilot. I can summarise and compare candidates, draft job descriptions, suggest interview questions and surface pipeline insights.`);

  async function ask(prompt: string) {
    const epoch = epochRef.current;
    setPending(true);
    setFailedPrompt(null);
    try {
      const reply = await generateMockAIResponse(prompt, { role, candidateId, companyId });
      if (mountedRef.current && epoch === epochRef.current) setMessages((prev) => [...prev, reply]);
    } catch (e) {
      if (mountedRef.current && epoch === epochRef.current) {
        setFailedPrompt(prompt);
        toast.error(e instanceof Error ? e.message : "The assistant couldn't answer right now");
      }
    } finally {
      if (mountedRef.current && epoch === epochRef.current) {
        setPending(false);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }
  }

  function send(text: string) {
    const prompt = text.trim();
    if (!prompt || pending) return;
    const userMessage: AIChatMessage = { id: makeId("aimsg"), from: "user", text: prompt, at: nowIso() };
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    void ask(prompt);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  }

  function clearConversation() {
    epochRef.current += 1;
    setMessages([]);
    setPending(false);
    setFailedPrompt(null);
    setDraft("");
    toast.success("Conversation cleared");
  }

  const empty = messages.length === 0;

  return (
    <section
      aria-label="AI assistant chat"
      className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", heightClassName, className)}
    >
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <AIAvatar size="md" thinking={pending} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{role === "seeker" ? "Career assistant" : "Recruiting copilot"}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            {pending ? "Thinking…" : "Online · simulated AI"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirmClear(true)}
          disabled={empty && !pending}
          aria-label="Clear conversation"
        >
          <Eraser aria-hidden />
          <span className="hidden sm:inline">Clear conversation</span>
        </Button>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation with the AI assistant"
        tabIndex={0}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 outline-none scrollbar-thin focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        {/* welcome (always first, not part of the stored conversation) */}
        <div className="flex items-start gap-2.5">
          <AIAvatar size="sm" className="mt-0.5" />
          <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm sm:max-w-[78%]">
            <p className="text-pretty">{welcomeText}</p>
            <p className="mt-2 text-xs text-muted-foreground">Pick a suggestion or type your own question below.</p>
          </div>
        </div>

        {empty && (
          <div className="pl-10">
            <ul className="flex flex-wrap gap-2" aria-label="Suggested prompts">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => send(s)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors outline-none hover:border-primary/50 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50 sm:text-sm"
                  >
                    <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m) => (
          <Message key={m.id} message={m} reduceMotion={reduceMotion} />
        ))}

        {pending && <TypingIndicator />}

        {failedPrompt && !pending && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm">
            <span className="text-destructive">The assistant couldn&apos;t answer that.</span>
            <Button type="button" size="sm" variant="outline" onClick={() => void ask(failedPrompt)}>
              <RotateCcw aria-hidden />
              Try again
            </Button>
          </div>
        )}
      </div>

      <div className="border-t bg-card/60 p-3">
        {!empty && (
          <ul className="mb-2.5 flex gap-2 overflow-x-auto pb-1 scrollbar-thin" aria-label="Suggested prompts">
            {suggestions.map((s) => (
              <li key={s} className="shrink-0">
                <button
                  type="button"
                  onClick={() => send(s)}
                  disabled={pending}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs whitespace-nowrap text-muted-foreground transition-colors outline-none hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <label htmlFor={`ai-chat-input-${role}`} className="sr-only">
            Message the AI assistant
          </label>
          <Textarea
            id={`ai-chat-input-${role}`}
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={pending}
            rows={1}
            maxLength={600}
            placeholder={pending ? "Waiting for the assistant…" : (placeholder ?? "Ask anything… (Enter to send, Shift+Enter for a new line)")}
            className="max-h-32 min-h-10 resize-none"
          />
          <Button type="submit" variant="gradient" size="icon-lg" disabled={pending || !draft.trim()} aria-label="Send message">
            <ArrowUp aria-hidden />
          </Button>
        </form>
      </div>

      <ConfirmationDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear this conversation?"
        description="Your messages with the assistant in this tab will be removed. Your AI activity history is kept."
        confirmLabel="Clear conversation"
        destructive
        onConfirm={clearConversation}
      />
    </section>
  );
}

/**
 * Reusable chat UI for both roles. Replies come from the deterministic mock
 * `generateMockAIResponse`, so the same prompt always yields the same answer.
 */
export function AIChatInterface(props: AIChatInterfaceProps) {
  const hydrated = useHydrated();
  if (!hydrated) return <LoadingSkeleton variant="chat" count={3} />;
  return <ChatSession {...props} />;
}
