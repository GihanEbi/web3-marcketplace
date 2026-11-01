import { SEED_NOW, SKILLS } from "@/lib/constants";

/**
 * Deterministic helpers for the seed data layer.
 * Nothing in here reads the wall clock or Math.random, so server and client
 * always produce byte-identical output.
 */

const BASE_MS = Date.parse(SEED_NOW);
const DAY_MS = 86_400_000;

/** Union of every skill string the app knows about. */
export type Skill = (typeof SKILLS)[number];

/** Type-checked skill list builder: typos in skill names fail at compile time. */
export function sk(...skills: Skill[]): string[] {
  return skills;
}

function shiftedIso(offsetDays: number, hour: number): string {
  const d = new Date(BASE_MS + offsetDays * DAY_MS);
  const wholeHours = Math.floor(hour);
  const minutes = Math.round((hour - wholeHours) * 60);
  d.setUTCHours(wholeHours, minutes, 0, 0);
  return d.toISOString();
}

/** ISO timestamp `n` days before SEED_NOW at `hour` UTC (fractions allowed, e.g. 14.5 = 14:30). */
export function daysAgo(n: number, hour = 9): string {
  return shiftedIso(-n, hour);
}

/** ISO timestamp `n` days after SEED_NOW at `hour` UTC. */
export function daysFromNow(n: number, hour = 9): string {
  return shiftedIso(n, hour);
}

/** Small seeded PRNG (mulberry32) returning uint32 words. */
function wordStream(seed: number): () => number {
  let a = Math.imul(seed + 1, 0x9e3779b1) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
}

function hex(seed: number, chars: number): string {
  const next = wordStream(seed);
  let out = "";
  while (out.length < chars) {
    out += next().toString(16).padStart(8, "0");
  }
  return out.slice(0, chars);
}

/** 0x + 40 hex chars. Clearly fake, stable for a given seed. */
export function mockAddress(seed: number): string {
  return `0x${hex(seed, 40)}`;
}

/** 0x + 64 hex chars. Clearly fake, stable for a given seed. */
export function mockTxHash(seed: number): string {
  return `0x${hex(seed + 7_919, 64)}`;
}

export function pad(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}

export function sum(values: number[]): number {
  return values.reduce((total, v) => total + v, 0);
}
