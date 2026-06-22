'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { savedService } from '@/services';
import { TripCard, TripCardSkeleton } from '@/components/trip/TripCard';
import { Container } from '@/components/ui/Container';
import { buttonClasses } from '@/components/ui/Button';

export function SavedList() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['saved', user?.id],
    queryFn: () => savedService.list(user!.id),
    enabled: user !== null,
  });

  async function remove(savedId: string) {
    if (!user) return;
    await savedService.remove(user.id, savedId);
    qc.invalidateQueries({ queryKey: ['saved', user.id] });
  }

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-display-md">Saved trips</h1>
      <p className="mt-2 text-ink-2">Ideas you have kept for later.</p>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <TripCardSkeleton key={i} />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-12 text-center">
            <h2 className="font-serif text-xl">Nothing saved yet</h2>
            <p className="mt-2 text-pretty text-ink-2">
              When you find a trip you like, tap Save and it lands here.
            </p>
            <Link href="/discover" className={buttonClasses('primary', 'md', 'mt-6')}>
              Discover trips
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((s) => (
              <TripCard
                key={s.id}
                idea={s.idea}
                action={
                  <button
                    type="button"
                    onClick={() => void remove(s.id)}
                    className="grid size-9 place-items-center rounded-full bg-surface/90 text-ink-2 shadow-soft backdrop-blur transition-colors hover:text-danger"
                    aria-label="Remove from saved"
                  >
                    <Trash2 className="size-4" />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
