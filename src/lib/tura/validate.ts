import type { DateWindow, SearchRequest, Vibe } from '@/lib/tura/types';
import { VIBES } from '@/lib/tura/types';

const ALL_VIBES = new Set<Vibe>([...VIBES, 'any']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ValidationResult = { ok: true; value: SearchRequest } | { ok: false; error: string };

function isDate(s: unknown): s is string {
  return typeof s === 'string' && DATE_RE.test(s);
}

/** Validates and normalizes a /api/tura/search request body. */
export function validateSearchRequest(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Request body must be an object' };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.origin !== 'string' || b.origin.trim().length < 2) {
    return { ok: false, error: 'origin: departure city/code required (e.g. BER)' };
  }

  if (!Array.isArray(b.dateWindows) || b.dateWindows.length === 0) {
    return { ok: false, error: 'dateWindows: at least one window required' };
  }
  const dateWindows: DateWindow[] = [];
  for (const w of b.dateWindows) {
    if (typeof w !== 'object' || w === null) {
      return { ok: false, error: 'dateWindows: each window must be {from,to}' };
    }
    const ww = w as Record<string, unknown>;
    if (!isDate(ww.from) || !isDate(ww.to)) {
      return { ok: false, error: 'dateWindows: from/to must be YYYY-MM-DD' };
    }
    if (ww.from > ww.to) {
      return { ok: false, error: 'dateWindows: from cannot be after to' };
    }
    dateWindows.push({ from: ww.from, to: ww.to });
  }

  const durationDays = Number(b.durationDays);
  if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 30) {
    return { ok: false, error: 'durationDays: number of days 1..30' };
  }

  const vibe = (typeof b.vibe === 'string' ? b.vibe : 'any') as Vibe;
  if (!ALL_VIBES.has(vibe)) {
    return { ok: false, error: `vibe: one of ${[...ALL_VIBES].join(', ')}` };
  }

  const budget = Number(b.budget);
  if (!Number.isFinite(budget) || budget <= 0) {
    return { ok: false, error: 'budget: positive number (for the whole group)' };
  }

  const groupSize = Number(b.groupSize ?? 1);
  if (!Number.isFinite(groupSize) || groupSize < 1 || groupSize > 20) {
    return { ok: false, error: 'groupSize: number of people 1..20' };
  }

  return {
    ok: true,
    value: {
      origin: b.origin.trim().toUpperCase(),
      dateWindows,
      durationDays: Math.round(durationDays),
      vibe,
      budget: Math.round(budget),
      groupSize: Math.round(groupSize),
    },
  };
}
