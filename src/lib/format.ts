import { format, formatDistance, isValid, parseISO } from "date-fns";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { appNow } from "@/lib/clock";
import type { Job, SalaryCurrency, SalaryPeriod } from "@/types";

function toDate(value: string | Date): Date | null {
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

/** "Oct 28, 2026" */
export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy") : "—";
}

/** "Oct 28, 2026 · 2:30 PM" */
export function formatDateTime(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy · h:mm a") : "—";
}

/** "2:30 PM" */
export function formatTime(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = toDate(value);
  return d ? format(d, "h:mm a") : "—";
}

/** "3 days ago" / "in 2 weeks" – relative to the virtual app clock */
export function formatRelative(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = toDate(value);
  return d ? formatDistance(d, appNow(), { addSuffix: true }) : "—";
}

/** Whole days between the app clock and a date (negative = past) */
export function daysUntil(value: string): number {
  const d = toDate(value);
  if (!d) return 0;
  return Math.ceil((d.getTime() - appNow().getTime()) / 86_400_000);
}

export function formatNumber(n: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(n);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatCurrency(amount: number, currency: string = "USD", maximumFractionDigits = 0): string {
  if (currency === "USD" || currency === "USDC" || currency === "DAI") {
    const base = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits,
    }).format(amount);
    return currency === "USD" ? base : `${base} ${currency}`;
  }
  return `${formatNumber(amount, Math.max(maximumFractionDigits, amount < 100 ? 2 : 0))} ${currency}`;
}

function shortAmount(n: number): string {
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`.replace(".0k", "k");
  return String(n);
}

const PERIOD_LABEL: Record<SalaryPeriod, string> = { year: "yr", month: "mo", hour: "hr" };

/** "$140k – $180k / yr" */
export function formatSalaryRange(
  min: number,
  max: number,
  currency: SalaryCurrency,
  period: SalaryPeriod = "year",
): string {
  const sym = CURRENCY_SYMBOL[currency] ?? "";
  const suffix = currency === "USD" || currency === sym ? "" : ` ${currency}`;
  const lo = period === "hour" ? String(min) : shortAmount(min);
  const hi = period === "hour" ? String(max) : shortAmount(max);
  return `${sym}${lo} – ${sym}${hi}${suffix} / ${PERIOD_LABEL[period]}`;
}

export function formatJobSalary(job: Pick<Job, "salaryMin" | "salaryMax" | "currency" | "salaryPeriod">): string {
  return formatSalaryRange(job.salaryMin, job.salaryMax, job.currency, job.salaryPeriod);
}

export function shortenAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return "—";
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
