'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BedDouble, Camera, Check, Minus, Pencil, Plane, Plus, Wallet } from 'lucide-react';
import { tripService } from '@/services';
import { Container } from '@/components/ui/Container';
import { Photo } from '@/components/ui/Photo';
import { Stars } from '@/components/ui/Stars';
import { Button } from '@/components/ui/Button';
import { TripCardSkeleton } from '@/components/trip/TripCard';
import { cn, formatDuration, formatMoney } from '@/lib/utils';

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-2">{label}</span>
      <div className="inline-flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid size-7 place-items-center rounded-full border border-line transition-colors hover:bg-surface-2"
          aria-label={`Fewer ${label}`}
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-6 text-center font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid size-7 place-items-center rounded-full border border-line transition-colors hover:bg-surface-2"
          aria-label={`More ${label}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ManualPlanner({ initialDestinationId }: { initialDestinationId: string | null }) {
  const [destId, setDestId] = useState<string | null>(initialDestinationId);
  const [budget, setBudget] = useState(1500);
  const [nights, setNights] = useState(6);
  const [travelers, setTravelers] = useState(2);
  const [flightIdx, setFlightIdx] = useState<number | null>(null);
  const [stayIdx, setStayIdx] = useState<number | null>(null);
  const [activityIds, setActivityIds] = useState<string[]>([]);

  const destinationsQ = useQuery({
    queryKey: ['destinations'],
    queryFn: () => tripService.listDestinations(),
  });
  const flightsQ = useQuery({
    queryKey: ['flights', destId],
    queryFn: () => tripService.getFlights('', destId as string),
    enabled: destId !== null,
  });
  const staysQ = useQuery({
    queryKey: ['stays', destId],
    queryFn: () => tripService.getStays(destId as string),
    enabled: destId !== null,
  });
  const activitiesQ = useQuery({
    queryKey: ['activities', destId],
    queryFn: () => tripService.getActivities(destId as string),
    enabled: destId !== null,
  });

  const destination = destinationsQ.data?.find((d) => d.id === destId) ?? null;
  const flight = flightIdx !== null ? (flightsQ.data?.[flightIdx] ?? null) : null;
  const stay = stayIdx !== null ? (staysQ.data?.[stayIdx] ?? null) : null;
  const activities = activitiesQ.data ?? [];
  const chosenActivities = activities.filter((a) => activityIds.includes(a.id));

  const flightsCost = flight ? flight.price.amount * travelers : 0;
  const stayCost = stay ? stay.pricePerNight.amount * nights : 0;
  const activitiesCost = chosenActivities.reduce(
    (sum, a) => sum + (a.price?.amount ?? 0) * travelers,
    0,
  );
  const total = flightsCost + stayCost + activitiesCost;
  const pct = budget > 0 ? (total / budget) * 100 : 0;
  const over = total > budget;

  function toggleActivity(id: string) {
    setActivityIds((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  }
  function chooseDestination(id: string) {
    setDestId(id);
    setFlightIdx(null);
    setStayIdx(null);
    setActivityIds([]);
  }

  // ── destination picker ──
  if (destId === null) {
    return (
      <Container className="py-10 sm:py-16">
        <header className="mb-8 max-w-2xl">
          <h1 className="text-display-md">Plan it yourself</h1>
          <p className="mt-2 text-pretty text-ink-2">
            Already have a place in mind? Pick it and assemble the trip to your budget.
          </p>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinationsQ.isLoading
            ? Array.from({ length: 6 }).map((_, i) => <TripCardSkeleton key={i} />)
            : destinationsQ.data?.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => chooseDestination(d.id)}
                  className="group overflow-hidden rounded-lg border border-line bg-surface text-left shadow-soft transition-all duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-lift"
                >
                  <Photo
                    src={d.image}
                    alt={d.city}
                    className="aspect-[4/3]"
                    sizes="(max-width: 768px) 100vw, 360px"
                  />
                  <div className="p-5">
                    <h3 className="font-serif text-xl">{d.city}</h3>
                    <p className="text-sm text-ink-3">{d.country}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-2">{d.blurb}</p>
                  </div>
                </button>
              ))}
        </div>
      </Container>
    );
  }

  const loadingBlocks = flightsQ.isLoading || staysQ.isLoading || activitiesQ.isLoading;

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-display-md">{destination?.city}</h1>
          <p className="mt-1 text-ink-3">{destination?.country}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setDestId(null)}>
          <Pencil className="size-4" />
          Change
        </Button>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        {/* selections */}
        <div className="space-y-10 lg:col-span-2">
          <section>
            <h2 className="flex items-center gap-2 font-serif text-xl">
              <Plane className="size-5 text-ink-3" />
              Flight
            </h2>
            <div className="mt-4 space-y-3">
              {loadingBlocks
                ? null
                : flightsQ.data?.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFlightIdx(i)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors',
                        flightIdx === i ? 'border-accent bg-accent/5' : 'border-line hover:border-ink/30',
                      )}
                    >
                      <div>
                        <div className="font-medium">{f.carrier}</div>
                        <div className="text-sm text-ink-3">
                          {formatDuration(f.durationMinutes)} ·{' '}
                          {f.stops === 0 ? 'direct' : `${f.stops} stop`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-lg">{formatMoney(f.price.amount)}</div>
                        <div className="text-xs text-ink-3">per person</div>
                      </div>
                    </button>
                  ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 font-serif text-xl">
              <BedDouble className="size-5 text-ink-3" />
              Stay
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {staysQ.data?.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStayIdx(i)}
                  className={cn(
                    'overflow-hidden rounded-lg border text-left transition-colors',
                    stayIdx === i ? 'border-accent' : 'border-line hover:border-ink/30',
                  )}
                >
                  <Photo src={s.image} alt={s.name} className="aspect-[3/2]" sizes="240px" />
                  <div className="p-3">
                    <div className="font-medium leading-snug">{s.name}</div>
                    <div className="text-sm capitalize text-ink-3">
                      {s.type} · {s.area}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <Stars rating={s.rating} />
                      <span className="text-sm text-ink-2">
                        {formatMoney(s.pricePerNight.amount)}/night
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 font-serif text-xl">
              <Camera className="size-5 text-ink-3" />
              Things to add
            </h2>
            <div className="mt-4 space-y-2">
              {activities.map((a) => {
                const on = activityIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleActivity(a.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      on ? 'border-accent bg-accent/5' : 'border-line hover:border-ink/30',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-5 shrink-0 place-items-center rounded-md border',
                        on ? 'border-accent bg-accent text-accent-foreground' : 'border-line',
                      )}
                    >
                      {on && <Check className="size-3.5" />}
                    </span>
                    <span className="flex-1">
                      <span className="font-medium">{a.title}</span>
                      <span className="block text-sm text-ink-3">
                        {formatDuration(Math.round(a.durationHours * 60))}
                      </span>
                    </span>
                    <span className="text-sm text-ink-2">
                      {a.price ? formatMoney(a.price.amount) : 'Free'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* budget summary */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-soft">
            <div className="space-y-3 border-b border-line pb-4">
              <div className="flex items-baseline justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                  <Wallet className="size-4 text-ink-3" />
                  Budget
                </span>
                <span className="font-serif text-xl">{formatMoney(budget)}</span>
              </div>
              <input
                type="range"
                min={300}
                max={6000}
                step={100}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <Stepper label="Nights" value={nights} min={1} max={21} onChange={setNights} />
              <Stepper label="Travellers" value={travelers} min={1} max={8} onChange={setTravelers} />
            </div>

            <div className="py-4">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm text-ink-2">Trip total</span>
                <span className={cn('font-serif text-2xl', over ? 'text-danger' : 'text-ink')}>
                  {formatMoney(total)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: over ? 'rgb(var(--color-danger))' : 'rgb(var(--color-accent))',
                  }}
                  animate={{ width: `${Math.min(100, pct)}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
              <p className={cn('mt-2 text-xs', over ? 'text-danger' : 'text-ink-3')}>
                {over
                  ? `${formatMoney(total - budget)} over budget`
                  : `${formatMoney(budget - total)} left to spend`}
              </p>
            </div>

            <dl className="space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-2">Flights ({travelers})</dt>
                <dd>{formatMoney(flightsCost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Stay ({nights} nights)</dt>
                <dd>{formatMoney(stayCost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Activities ({chosenActivities.length})</dt>
                <dd>{formatMoney(activitiesCost)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </Container>
  );
}
