'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Search } from 'lucide-react';
import type { DiscoverQuery, VibeId } from '@/services/types';
import { VIBES } from '@/lib/vibes';
import { Button } from '@/components/ui/Button';
import { DateRangeCalendar } from '@/components/ui/DateRangeCalendar';
import { addIsoDays, cn, formatMoney, isoDate } from '@/lib/utils';

const MAX_DURATION_DAYS = 21;

const STEPS = ['Where from', 'Budget', 'Dates', 'Travellers', 'Vibe'] as const;

export function PlannerForm({ onSubmit }: { onSubmit: (q: DiscoverQuery) => void }) {
  const today = useMemo(() => isoDate(new Date()), []);
  const [step, setStep] = useState(0);
  const [origin, setOrigin] = useState('Vienna');
  const [budget, setBudget] = useState(1500);
  const [start, setStart] = useState(addIsoDays(today, 14));
  const [end, setEnd] = useState(addIsoDays(today, 35));
  const [durationDays, setDurationDays] = useState(5);
  const [flexible, setFlexible] = useState(true);
  const [travelers, setTravelers] = useState(2);
  const [vibes, setVibes] = useState<VibeId[]>([]);

  const last = STEPS.length - 1;
  const canContinue =
    (step === 0 && origin.trim().length > 0) ||
    (step === 1 && budget > 0) ||
    (step === 2 && start <= end) ||
    (step === 3 && travelers >= 1) ||
    step === 4;

  function toggleVibe(id: VibeId) {
    setVibes((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  }

  function next() {
    if (!canContinue) return;
    if (step < last) setStep((s) => s + 1);
    else
      onSubmit({
        origin: origin.trim(),
        budget: { amount: budget, currency: 'EUR' },
        dates: { start, end },
        datesFlexible: flexible,
        durationDays,
        travelers,
        vibes,
      });
  }

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-display-md">Where should you go?</h1>
        <p className="mt-2 text-pretty text-ink-2">
          Answer a few quick things and we will find the trips that fit.
        </p>
      </header>

      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col gap-1.5">
            <div
              className={cn(
                'h-1 rounded-full transition-colors duration-300',
                i <= step ? 'bg-accent' : 'bg-line',
              )}
            />
            <span className={cn('text-xs', i === step ? 'text-ink' : 'text-ink-3')}>{s}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-soft sm:p-8">
        {step === 0 && (
          <label className="block">
            <span className="text-sm font-medium text-ink">Which city will you fly from?</span>
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              placeholder="e.g. Vienna"
              className="mt-3 w-full rounded-lg border border-line bg-bg px-4 py-3 text-lg outline-none transition-colors focus:border-accent"
              autoFocus
            />
          </label>
        )}

        {step === 1 && (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink">Total budget for the trip</span>
              <span className="font-serif text-2xl text-ink">{formatMoney(budget)}</span>
            </div>
            <input
              type="range"
              min={50}
              max={5000}
              step={50}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-5 w-full accent-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-ink-3">
              <span>€50</span>
              <span>€5,000+</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <span className="text-sm font-medium text-ink">When could you travel?</span>
              <div className="mt-3">
                <DateRangeCalendar
                  start={start}
                  end={end}
                  minDate={today}
                  onChange={(s, e) => {
                    setStart(s);
                    setEnd(e);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-line bg-bg p-3">
              <div>
                <span className="text-sm font-medium text-ink">How many days?</span>
                <p className="text-xs text-ink-3">
                  {durationDays === 1
                    ? 'Day trip — arrive and leave the same day, no hotel.'
                    : `${durationDays - 1} night${durationDays - 1 === 1 ? '' : 's'} away.`}
                </p>
              </div>
              <div className="inline-flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setDurationDays((d) => Math.max(1, d - 1))}
                  className="grid size-9 place-items-center rounded-full border border-line transition-colors hover:bg-surface-2"
                  aria-label="Fewer days"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center font-serif text-2xl">{durationDays}</span>
                <button
                  type="button"
                  onClick={() => setDurationDays((d) => Math.min(MAX_DURATION_DAYS, d + 1))}
                  className="grid size-9 place-items-center rounded-full border border-line transition-colors hover:bg-surface-2"
                  aria-label="More days"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-line bg-bg p-3">
              <input
                type="checkbox"
                checked={flexible}
                onChange={(e) => setFlexible(e.target.checked)}
                className="size-4 accent-accent"
              />
              <span className="text-sm text-ink-2">
                My dates are flexible — shift by a few weeks if it&apos;s cheaper
              </span>
            </label>
            {start > end && (
              <p className="text-sm text-danger">Pick a latest date on or after the earliest one.</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <span className="text-sm font-medium text-ink">How many of you are going?</span>
            <div className="mt-6 inline-flex items-center gap-6">
              <button
                type="button"
                onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:bg-surface-2"
                aria-label="Fewer travellers"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-12 font-serif text-4xl">{travelers}</span>
              <button
                type="button"
                onClick={() => setTravelers((t) => Math.min(8, t + 1))}
                className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:bg-surface-2"
                aria-label="More travellers"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <span className="text-sm font-medium text-ink">What are you in the mood for?</span>
            <p className="mt-1 text-sm text-ink-3">Pick as many as you like. Optional.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {VIBES.map((v) => {
                const on = vibes.includes(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleVibe(v.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors',
                      on
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-line text-ink-2 hover:border-ink/30',
                    )}
                  >
                    {on && <Check className="size-3.5" />}
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button onClick={next} disabled={!canContinue}>
            {step < last ? (
              <>
                Continue
                <ArrowRight className="size-4" />
              </>
            ) : (
              <>
                <Search className="size-4" />
                Find trips
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
