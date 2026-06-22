'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { DiscoverQuery, TripIdea } from '@/services/types';
import { TripCard } from '@/components/trip/TripCard';
import { Button } from '@/components/ui/Button';
import { vibeLabel } from '@/lib/vibes';
import { cn, formatMoney, nightsBetween } from '@/lib/utils';

type Sort = 'match' | 'price' | 'flight';

const sortLabels: Record<Sort, string> = {
  match: 'Best match',
  price: 'Lowest price',
  flight: 'Shortest flight',
};

interface ResultsBoardProps {
  query: DiscoverQuery;
  ideas: TripIdea[];
  isError: boolean;
  onReset: () => void;
}

export function ResultsBoard({ query, ideas, isError, onReset }: ResultsBoardProps) {
  const [sort, setSort] = useState<Sort>('match');
  const [withinBudget, setWithinBudget] = useState(false);

  const list = useMemo(() => {
    let l = [...ideas];
    if (withinBudget) l = l.filter((i) => i.cost.total.amount <= query.budget.amount);
    l.sort((a, b) => {
      if (sort === 'price') return a.cost.total.amount - b.cost.total.amount;
      if (sort === 'flight') return a.flights.durationMinutes - b.flights.durationMinutes;
      return b.matchScore - a.matchScore;
    });
    return l;
  }, [ideas, sort, withinBudget, query.budget.amount]);

  const summaryBits = [
    `from ${query.origin}`,
    `${nightsBetween(query.dates.start, query.dates.end)}-day window`,
    `~${formatMoney(query.budget.amount)}`,
    `${query.travelers} travellers`,
    ...(query.vibes.length ? [query.vibes.map(vibeLabel).join(', ').toLowerCase()] : []),
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display-md">{list.length} trips for you</h1>
          <p className="mt-2 text-pretty text-ink-2">{summaryBits.join(' · ')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="size-4" />
          Start over
        </Button>
      </div>

      <div className="sticky top-16 z-10 -mx-5 mb-8 mt-4 flex flex-wrap items-center gap-2 bg-bg/85 px-5 py-3 backdrop-blur">
        <span className="inline-flex items-center gap-1.5 text-sm text-ink-3">
          <SlidersHorizontal className="size-3.5" />
          Sort
        </span>
        {(Object.keys(sortLabels) as Sort[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              sort === s ? 'bg-ink text-bg' : 'text-ink-2 hover:bg-ink/5',
            )}
          >
            {sortLabels[s]}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            checked={withinBudget}
            onChange={(e) => setWithinBudget(e.target.checked)}
            className="size-4 accent-accent"
          />
          Within budget
        </label>
      </div>

      {isError ? (
        <p className="text-ink-2">Something went wrong finding trips. Please start over.</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center">
          <h3 className="font-serif text-xl">No trips within that budget</h3>
          <p className="mt-2 text-ink-2">Turn off the budget filter or raise your budget a little.</p>
        </div>
      ) : (
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {list.map((idea, i) => (
            <motion.div
              key={idea.id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <TripCard idea={idea} priority={i < 3} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
