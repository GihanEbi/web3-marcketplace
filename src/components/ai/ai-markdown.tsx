import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Tiny, dependency-free and injection-safe markdown renderer for assistant replies.
 * Supports: **bold**, `code`, bullet lines (•, -, *), numbered lines (1.) and paragraphs.
 * Everything is rendered as React text nodes, so no HTML can ever be injected.
 */

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[]; start: number };

const BULLET = /^\s*[•\-*]\s+(.*)$/;
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    if (!raw.trim()) {
      current = null;
      continue;
    }
    const bullet = BULLET.exec(raw);
    if (bullet) {
      if (current?.type === "ul") current.items.push(bullet[1]);
      else {
        current = { type: "ul", items: [bullet[1]] };
        blocks.push(current);
      }
      continue;
    }
    const numbered = NUMBERED.exec(raw);
    if (numbered) {
      if (current?.type === "ol") current.items.push(numbered[2]);
      else {
        current = { type: "ol", items: [numbered[2]], start: Number(numbered[1]) };
        blocks.push(current);
      }
      continue;
    }
    if (current?.type === "p") current.lines.push(raw.trim());
    else {
      current = { type: "p", lines: [raw.trim()] };
      blocks.push(current);
    }
  }
  return blocks;
}

const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/** Strip markdown markers (used for "copy" so the clipboard gets clean text). */
export function stripMarkdown(text: string): string {
  return text.replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/`([^`\n]+)`/g, "$1");
}

export function AIMarkdown({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className={cn("space-y-2.5 text-sm leading-relaxed wrap-break-word", className)}>
      {blocks.map((block, bi) => {
        const key = `b${bi}`;
        if (block.type === "ul") {
          return (
            <ul key={key} className="list-disc space-y-1 pl-5 marker:text-primary">
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={key} start={block.start} className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-primary">
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={key} className="whitespace-pre-line">
            {renderInline(block.lines.join("\n"), key)}
          </p>
        );
      })}
    </div>
  );
}
