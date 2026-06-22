import { cn } from '@/lib/utils';

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="6" className="fill-accent/15 stroke-accent" strokeWidth="1.5" />
        <circle cx="12" cy="3.5" r="2" className="fill-accent" />
      </svg>
      <span className="font-serif text-xl font-semibold tracking-tight text-ink">Yonderlust</span>
    </span>
  );
}
