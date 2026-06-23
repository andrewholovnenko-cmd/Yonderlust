import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Bus, Plane, Train, type LucideIcon } from 'lucide-react';
import type { TransportMode } from '@/services/types';

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

/** "2026-07-04" for a Date, in local time (not UTC). */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Adds (or subtracts, if negative) whole days to an ISO date string. */
export function addIsoDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

/** Promise-based delay, used by the mock service to exercise loading states. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Icon for a transport leg: plane for flights, bus/train for ground legs. */
export function transportIcon(mode: TransportMode): LucideIcon {
  if (mode === 'bus') return Bus;
  if (mode === 'train') return Train;
  return Plane;
}

/** Minutes to "2h 40m" / "50m" / "3h". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
