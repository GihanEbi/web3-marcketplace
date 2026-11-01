import { SEED_NOW } from "@/lib/constants";

/**
 * Virtual app clock.
 *
 * Seed data is anchored around SEED_NOW. To stop seeded dates from drifting
 * ("posted 4 months ago", deadlines in the past) as real time passes, the app
 * clock is `real time - offset`, where the offset is captured on first visit
 * and persisted in localStorage. It keeps ticking continuously across reloads.
 *
 * ALWAYS use `appNow()` / `nowIso()` instead of `new Date()` / `Date.now()`.
 */
const CLOCK_KEY = "web3-marketplace-clock-offset";
let cachedOffset: number | null = null;

function readOffset(): number {
  if (cachedOffset !== null) return cachedOffset;
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(CLOCK_KEY);
    if (raw !== null && !Number.isNaN(Number(raw))) {
      cachedOffset = Number(raw);
      return cachedOffset;
    }
    const offset = Date.now() - Date.parse(SEED_NOW);
    window.localStorage.setItem(CLOCK_KEY, String(offset));
    cachedOffset = offset;
    return offset;
  } catch {
    cachedOffset = Date.now() - Date.parse(SEED_NOW);
    return cachedOffset;
  }
}

export function appNow(): Date {
  if (typeof window === "undefined") return new Date(SEED_NOW);
  return new Date(Date.now() - readOffset());
}

export function nowIso(): string {
  return appNow().toISOString();
}

export function addDaysIso(days: number, from: Date = appNow()): string {
  return new Date(from.getTime() + days * 86_400_000).toISOString();
}

/** Called by "Reset demo data" so the clock re-anchors to the seed date. */
export function resetClock(): void {
  cachedOffset = null;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLOCK_KEY);
  } catch {
    /* ignore */
  }
}
