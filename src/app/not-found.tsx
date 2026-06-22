import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { buttonClasses } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <Container className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="font-serif text-display-lg text-accent">404</p>
        <h1 className="mt-2 text-display-md">This page wandered off</h1>
        <p className="mt-2 text-pretty text-ink-2">The page you are looking for is not here.</p>
        <Link href="/" className={buttonClasses('primary', 'md', 'mt-6')}>
          Back home
        </Link>
      </div>
    </Container>
  );
}
