import Link from 'next/link';
import type { ReactNode } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import type { TripIdea } from '@/services/types';
import { Photo } from '@/components/ui/Photo';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateRange, formatDuration, formatMoney, transportIcon } from '@/lib/utils';

interface TripCardProps {
  idea: TripIdea;
  action?: ReactNode;
  priority?: boolean;
}

export function TripCard({ idea, action, priority }: TripCardProps) {
  const TransportIcon = transportIcon(idea.flights.legs?.[0]?.mode ?? 'flight');
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-soft transition-all duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-lift">
      <div className="relative">
        <Photo
          src={idea.images[0]}
          alt={`${idea.destination.city}, ${idea.destination.country}`}
          className="aspect-[4/3]"
          sizes="(max-width: 768px) 100vw, 380px"
          priority={priority}
        />
        <div className="absolute left-3 top-3">
          <Badge tone="ink">{idea.matchScore}% match</Badge>
        </div>
        {action ? <div className="absolute right-3 top-3 z-10">{action}</div> : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-sm text-ink-3">
          <MapPin className="size-3.5" />
          {idea.destination.city}, {idea.destination.country}
        </div>

        <h3 className="mt-1.5 text-pretty font-serif text-xl leading-tight">
          <Link href={`/trip/${idea.id}`} className="after:absolute after:inset-0">
            {idea.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-sm text-ink-2">{idea.summary}</p>

        <ul className="mt-3 space-y-1.5">
          {idea.matchReasons.slice(0, 2).map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-sm text-ink-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
              {reason}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
          <div className="flex flex-col gap-1 text-xs text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatDateRange(idea.dates.start, idea.dates.end)} · {idea.nights} nights
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TransportIcon className="size-3.5" />
              {formatDuration(idea.flights.durationMinutes)} from {idea.flights.fromCity}
            </span>
          </div>
          <div className="text-right">
            <div className="font-serif text-xl text-ink">
              {formatMoney(idea.cost.total.amount, idea.cost.total.currency)}
            </div>
            <div className="text-xs text-ink-3">est. total · {idea.travelers} travellers</div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function TripCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}
