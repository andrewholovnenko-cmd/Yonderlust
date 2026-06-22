'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Wordmark } from '@/components/brand/Wordmark';
import { AuthControls } from '@/features/auth/AuthControls';
import { cn } from '@/lib/utils';

const links = [
  { href: '/discover', label: 'Discover' },
  { href: '/plan', label: 'Plan' },
  { href: '/saved', label: 'Saved' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Yonderlust home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition-colors',
                  active ? 'bg-ink/5 text-ink' : 'text-ink-2 hover:text-ink',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <AuthControls />
      </Container>
    </header>
  );
}
