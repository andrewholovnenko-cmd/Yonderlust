import type { Savings } from '@/lib/tura/types';

/**
 * Savings = the "naive" booking (direct flights + a typical hotel) minus
 * ours. Never negative: if optimizing didn't help, saved = 0.
 */
export function computeSavings(naiveTotal: number, optimizedTotal: number): Savings {
  const naive = Math.round(naiveTotal);
  const optimized = Math.round(optimizedTotal);
  const saved = Math.max(0, naive - optimized);
  const percent = naive > 0 ? Math.round((saved / naive) * 100) : 0;
  return { naiveTotal: naive, optimizedTotal: optimized, saved, percent };
}
