'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DiscoverQuery } from '@/services/types';
import { tripService } from '@/services';
import { Container } from '@/components/ui/Container';
import { OrbitLoader } from '@/components/loaders/OrbitLoader';
import { PlannerForm } from './PlannerForm';
import { ResultsBoard } from './ResultsBoard';

export function DiscoverExperience() {
  const [query, setQuery] = useState<DiscoverQuery | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['discover', query],
    queryFn: () => tripService.discoverTrips(query as DiscoverQuery),
    enabled: query !== null,
  });

  if (query === null) {
    return (
      <Container className="py-10 sm:py-16">
        <PlannerForm onSubmit={setQuery} />
      </Container>
    );
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-5">
        <div className="text-center">
          <OrbitLoader size={120} />
          <h2 className="mt-8 text-display-md">Finding trips for you</h2>
          <p className="mt-2 text-pretty text-ink-2">
            Weighing season, budget and flight time across destinations…
          </p>
        </div>
      </div>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <ResultsBoard
        query={query}
        ideas={data ?? []}
        isError={isError}
        onReset={() => setQuery(null)}
      />
    </Container>
  );
}
