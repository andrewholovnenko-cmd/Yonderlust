import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { buttonClasses } from '@/components/ui/Button';

export function CtaBand() {
  return (
    <section className="pb-8 pt-4">
      <Container>
        <div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-16 text-center sm:px-16">
          <h2 className="mx-auto max-w-2xl font-serif text-display-md text-bg">
            Stop scrolling for a destination. Start with how you want to feel.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-bg/70">It takes about a minute.</p>
          <Link href="/discover" className={buttonClasses('primary', 'lg', 'mt-8')}>
            Plan my trip
          </Link>
        </div>
      </Container>
    </section>
  );
}
