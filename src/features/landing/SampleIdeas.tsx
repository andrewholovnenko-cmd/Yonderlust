'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { tripService } from '@/services';
import { TripCard, TripCardSkeleton } from '@/components/trip/TripCard';
import { Container } from '@/components/ui/Container';
import { buttonClasses } from '@/components/ui/Button';

export function SampleIdeas() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sample-ideas'],
    queryFn: () => tripService.getSampleIdeas(),
  });

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-accent">
              Where people are going
            </p>
            <h2 className="mt-2 text-display-md">A few ideas to start</h2>
          </div>
          <Link href="/discover" className={buttonClasses('outline', 'md', 'hidden sm:inline-flex')}>
            Find yours
          </Link>
        </div>

        {isError ? (
          <p className="text-ink-2">Could not load ideas right now. Please try again.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <TripCardSkeleton key={i} />)
              : data?.map((idea, i) => <TripCard key={idea.id} idea={idea} priority={i < 3} />)}
          </div>
        )}
      </Container>
    </section>
  );
}
