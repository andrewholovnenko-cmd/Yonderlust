'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, isoDate } from '@/lib/utils';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_FMT = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
/** Mon=0..Sun=6, matching WEEKDAYS order (JS getDay() is Sun=0). */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

interface DateRangeCalendarProps {
  start: string;
  end: string;
  minDate: string;
  onChange: (start: string, end: string) => void;
}

/** Click-to-pick range calendar: first click sets the range start, second
 * click (on or after it) confirms the end — replaces the native <input
 * type=date> pair, which can't show both ends of the range at a glance or
 * preview the nights in between. */
export function DateRangeCalendar({ start, end, minDate, onChange }: DateRangeCalendarProps) {
  const [view, setView] = useState(() => startOfMonth(new Date(start + 'T00:00:00')));
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const rangeStart = pendingStart ?? start;
  const rangeEnd = pendingStart ? (hover && hover > pendingStart ? hover : pendingStart) : end;

  function pick(day: string) {
    if (day < minDate) return;
    if (pendingStart === null) {
      setPendingStart(day);
      return;
    }
    if (day < pendingStart) {
      setPendingStart(day);
      return;
    }
    onChange(pendingStart, day);
    setPendingStart(null);
  }

  const monthStart = view;
  const leading = mondayIndex(monthStart);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayIso = isoDate(new Date());
  const minMonth = startOfMonth(new Date(minDate + 'T00:00:00'));
  const canGoBack = view > minMonth;

  return (
    <div className="rounded-lg border border-line bg-bg p-4" onMouseLeave={() => setHover(null)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView((v) => addMonths(v, -1))}
          disabled={!canGoBack}
          className="grid size-8 place-items-center rounded-full transition-colors hover:bg-surface-2 disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-medium text-ink">{MONTH_FMT.format(monthStart)}</span>
        <button
          type="button"
          onClick={() => setView((v) => addMonths(v, 1))}
          className="grid size-8 place-items-center rounded-full transition-colors hover:bg-surface-2"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-xs font-medium text-ink-3">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const iso = isoDate(d);
          const disabled = iso < minDate;
          const inRange = iso >= rangeStart && iso <= rangeEnd;
          const isEdge = iso === rangeStart || iso === rangeEnd;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => pick(iso)}
              onMouseEnter={() => setHover(iso)}
              className={cn(
                'relative m-px aspect-square rounded-full text-sm transition-colors',
                disabled && 'cursor-not-allowed text-ink-3/40',
                !disabled && !inRange && 'text-ink hover:bg-surface-2',
                !disabled && inRange && !isEdge && 'bg-accent/15 text-ink',
                isEdge && !disabled && 'bg-accent text-accent-foreground',
                iso === todayIso && !isEdge && 'font-semibold',
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-ink-3">
        {pendingStart
          ? 'Pick the latest date you could travel back.'
          : 'Pick the earliest date you could travel.'}
      </p>
    </div>
  );
}
