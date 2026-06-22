import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format an integer amount as currency, no decimals (e.g. €1,240). */
export function formatMoney(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const DATE_FMT_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** "Jul 4 – 10" or "Dec 30 – Jan 5, 2027" when months/years differ. */
export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = DATE_FMT.format(start);
  const endStr = sameYear ? DATE_FMT.format(end) : DATE_FMT_YEAR.format(end);
  const startWithYear = sameYear ? startStr : DATE_FMT_YEAR.format(start);
  return `${sameYear ? startStr : startWithYear} – ${endStr}`;
}

/** Whole nights between two ISO dates. */
export function nightsBetween(startISO: string, endISO: string): number {
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Promise-based delay, used by the mock service to exercise loading states. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Deterministic-ish pseudo delay within a range, for realistic mock latency. */
export function mockLatency(min = 600, max = 1200): Promise<void> {
  return delay(Math.round(min + Math.random() * (max - min)));
}

/** Minutes to "2h 40m" / "50m" / "3h". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
