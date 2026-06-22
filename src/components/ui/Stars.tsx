import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-ink-2', className)}>
      <Star className="size-3.5 fill-accent text-accent" />
      <span className="text-sm font-medium text-ink">{rating.toFixed(1)}</span>
    </span>
  );
}
