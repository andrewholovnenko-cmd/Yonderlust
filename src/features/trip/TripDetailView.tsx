'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BedDouble,
  Bus,
  Camera,
  CloudSun,
  Compass,
  Plane,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import type { ItineraryItemKind, Money } from '@/services/types';
import { tripService } from '@/services';
import { Container } from '@/components/ui/Container';
import { Photo } from '@/components/ui/Photo';
import { Badge } from '@/components/ui/Badge';
import { Stars } from '@/components/ui/Stars';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonClasses } from '@/components/ui/Button';
import { SaveButton } from '@/features/saved/SaveButton';
import { formatDateRange, formatDuration, formatMoney } from '@/lib/utils';

const kindIcon: Record<ItineraryItemKind, typeof Plane> = {
  flight: Plane,
  stay: BedDouble,
  activity: Camera,
  food: UtensilsCrossed,
  transport: Bus,
  free: Sparkles,
};

export function TripDetailView({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripService.getTripById(id),
  });

  if (isLoading) {
    return (
      <Container className="py-10">
        <Skeleton className="aspect-[21/9] w-full rounded-2xl" />
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container className="grid min-h-[50vh] place-items-center text-center">
        <div>
          <h1 className="text-display-md">Trip not found</h1>
          <p className="mt-2 text-ink-2">This idea may have expired. Try discovering a new one.</p>
          <Link href="/discover" className={buttonClasses('primary', 'md', 'mt-6')}>
            Discover trips
          </Link>
        </div>
      </Container>
    );
  }

  const trip = data;
  const costRows: Array<[string, Money]> = [
    ['Flights', trip.cost.flights],
    ['Stay', trip.cost.stay],
    ['Activities', trip.cost.activities],
    ['Food & extras', trip.cost.food],
  ];

  return (
    <Container className="py-8 sm:py-10">
      <Link
        href="/discover"
        className="inline-flex items-center gap-2 text-sm text-ink-2 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Back to ideas
      </Link>

      {/* hero */}
      <div className="relative mt-4 overflow-hidden rounded-2xl">
        <Photo
          src={trip.images[0]}
          alt={`${trip.destination.city}, ${trip.destination.country}`}
          className="aspect-[16/10] sm:aspect-[21/9]"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-bg sm:p-10">
          <Badge tone="ink">{trip.matchScore}% match</Badge>
          <h1 className="mt-3 max-w-3xl font-serif text-display-lg text-bg">{trip.title}</h1>
          <p className="mt-2 text-bg/80">
            {trip.destination.city}, {trip.destination.country} ·{' '}
            {formatDateRange(trip.dates.start, trip.dates.end)} · {trip.nights} nights
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* main */}
        <div className="space-y-12 lg:col-span-2">
          <section>
            <p className="text-pretty text-lg text-ink-2">{trip.summary}</p>
            <div className="mt-5 rounded-xl border border-line bg-surface-2/50 p-5">
              <h2 className="text-sm font-medium uppercase tracking-wide text-accent">
                Why this fits
              </h2>
              <ul className="mt-3 space-y-2">
                {trip.matchReasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-ink">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-display-md">Your days</h2>
            <ol className="relative mt-6 space-y-7 border-l border-line pl-7">
              {trip.itinerary.map((day) => (
                <li key={day.day} className="relative">
                  <span className="absolute -left-[2.05rem] top-0.5 grid size-6 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {day.day}
                  </span>
                  <h3 className="font-serif text-lg">{day.title}</h3>
                  <ul className="mt-2 space-y-2">
                    {day.items.map((item, idx) => {
                      const Icon = kindIcon[item.kind];
                      return (
                        <li key={`${day.day}-${idx}`} className="flex gap-3 text-sm">
                          <Icon className="mt-0.5 size-4 shrink-0 text-ink-3" />
                          <div>
                            <span className="text-ink">
                              {item.time ? <span className="text-ink-3">{item.time} · </span> : null}
                              {item.title}
                            </span>
                            {item.description ? (
                              <p className="text-ink-2">{item.description}</p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-display-md">Things to do</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {trip.activities.map((a) => (
                <div key={a.id} className="flex gap-4 rounded-lg border border-line bg-surface p-3">
                  {a.image ? (
                    <Photo
                      src={a.image}
                      alt={a.title}
                      className="size-20 shrink-0 rounded-md"
                      sizes="80px"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <Badge tone="accent">{a.category}</Badge>
                    <h4 className="mt-1.5 font-medium leading-snug">{a.title}</h4>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-2">{a.description}</p>
                    <p className="mt-1 text-xs text-ink-3">
                      {formatDuration(Math.round(a.durationHours * 60))} ·{' '}
                      {a.price ? formatMoney(a.price.amount, a.price.currency) : 'Free'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-surface p-5 shadow-soft">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-2">Estimated total</span>
                <span className="font-serif text-2xl">
                  {formatMoney(trip.cost.total.amount, trip.cost.total.currency)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-3">
                {trip.nights} nights · {trip.travelers} travellers
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                {costRows.map(([label, money]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-ink-2">{label}</dt>
                    <dd className="text-ink">{formatMoney(money.amount, money.currency)}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex flex-col gap-2">
                <SaveButton idea={trip} className="w-full" />
                <Link
                  href={`/plan?destination=${trip.destination.id}`}
                  className={buttonClasses('primary', 'md', 'w-full')}
                >
                  Build in planner
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
                <Plane className="size-4 text-ink-3" />
                Flight
              </h3>
              <p className="mt-2 text-sm text-ink-2">
                {trip.flights.fromCity} ({trip.flights.fromCode}) → {trip.flights.toCity} (
                {trip.flights.toCode})
              </p>
              <p className="mt-1 text-sm text-ink-3">
                {trip.flights.carrier} · {formatDuration(trip.flights.durationMinutes)} ·{' '}
                {trip.flights.stops === 0
                  ? 'direct'
                  : `${trip.flights.stops} stop${trip.flights.stops > 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
                <BedDouble className="size-4 text-ink-3" />
                Stay
              </h3>
              <p className="mt-2 text-sm text-ink">{trip.stay.name}</p>
              <p className="mt-0.5 text-sm text-ink-3 capitalize">
                {trip.stay.type} · {trip.stay.area}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <Stars rating={trip.stay.rating} />
                <span className="text-sm text-ink-2">
                  {formatMoney(trip.stay.pricePerNight.amount, trip.stay.pricePerNight.currency)}
                  /night
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
                <CloudSun className="size-4 text-ink-3" />
                {trip.weather.season}
              </h3>
              <p className="mt-2 text-sm text-ink-2">
                {trip.weather.avgHighC}° / {trip.weather.avgLowC}° · {trip.weather.note}
              </p>
              <h3 className="mt-4 flex items-center gap-2 text-sm font-medium text-ink">
                <Compass className="size-4 text-ink-3" />
                Getting around
              </h3>
              <p className="mt-2 text-sm text-ink-2">{trip.gettingAround}</p>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
