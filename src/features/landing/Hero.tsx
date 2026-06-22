import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { HeroGlobe } from '@/components/HeroGlobe';
import { buttonClasses } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Container className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink-2">
            <Sparkles className="size-3.5 text-accent" />
            AI travel concierge
          </span>

          <h1 className="mt-6 text-display-xl">
            You tell us <span className="italic text-accent">when</span>.
            <br className="hidden sm:block" /> We tell you <span className="italic text-accent">where</span>.
          </h1>

          <p className="mt-6 max-w-md text-pretty text-lg text-ink-2">
            For when you want to go somewhere but have no idea where. Give Yonderlust your free
            days, budget and mood — it finds trips worth taking and builds them end to end.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/discover" className={buttonClasses('primary', 'lg')}>
              Plan my trip
            </Link>
            <Link href="#how" className={buttonClasses('ghost', 'lg')}>
              How it works
            </Link>
          </div>
        </div>

        <HeroGlobe />
      </Container>
    </section>
  );
}
