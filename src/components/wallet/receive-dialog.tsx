"use client";

import { useMemo } from "react";
import { FlaskConical } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CopyButton } from "@/components/shared/copy-button";
import type { Network } from "@/types";

const SIZE = 25;
const FINDER = 7;

function isFinderCell(x: number, y: number): boolean | null {
  // returns true/false for cells inside a finder pattern (+1 module separator), null elsewhere
  const corners: [number, number][] = [
    [0, 0],
    [SIZE - FINDER, 0],
    [0, SIZE - FINDER],
  ];
  for (const [cx, cy] of corners) {
    const dx = x - cx;
    const dy = y - cy;
    if (dx >= -1 && dx <= FINDER && dy >= -1 && dy <= FINDER) {
      if (dx < 0 || dy < 0 || dx >= FINDER || dy >= FINDER) return false;
      const ring = dx === 0 || dy === 0 || dx === FINDER - 1 || dy === FINDER - 1;
      const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
      return ring || core;
    }
  }
  return null;
}

/** Deterministic QR-looking pattern derived from the address. NOT a real QR code. */
function buildPattern(seed: string): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  if (h === 0) h = 1;
  const next = () => {
    h = (h ^ (h << 13)) >>> 0;
    h = (h ^ (h >>> 17)) >>> 0;
    h = (h ^ (h << 5)) >>> 0;
    return h;
  };
  return Array.from({ length: SIZE }, (_, y) =>
    Array.from({ length: SIZE }, (_, x) => {
      const finder = isFinderCell(x, y);
      return finder !== null ? finder : next() % 100 < 48;
    }),
  );
}

/** Purely decorative pattern (hidden from assistive tech). */
export function DecorativeQr({ seed, className }: { seed: string; className?: string }) {
  const grid = useMemo(() => buildPattern(seed), [seed]);
  const quiet = 2;
  const total = SIZE + quiet * 2;
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={total} height={total} fill="#ffffff" rx={1} />
      {grid.flatMap((row, y) =>
        row.map((on, x) =>
          on ? <rect key={`${x}-${y}`} x={x + quiet} y={y + quiet} width={1} height={1} fill="#0f172a" /> : null,
        ),
      )}
    </svg>
  );
}

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  network: Network;
}

export function ReceiveDialog({ open, onOpenChange, address, network }: ReceiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Receive on {network}</DialogTitle>
          <DialogDescription>Share this demo address to receive (simulated) payouts.</DialogDescription>
        </DialogHeader>

        <div className="mx-auto w-48 overflow-hidden rounded-xl border border-border p-1.5 shadow-sm">
          <DecorativeQr seed={address} className="block h-auto w-full" />
        </div>
        <p className="text-center text-[11px] text-muted-foreground">Decorative pattern — not a scannable QR code.</p>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Demo wallet address</p>
          <div className="mt-1 flex items-start gap-1">
            <p className="font-mono text-xs leading-5 break-all">{address}</p>
            <CopyButton value={address} label="Wallet address" className="size-6 shrink-0" />
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>This address was generated locally. Never send real crypto to it — nothing on any blockchain can reach this wallet.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
