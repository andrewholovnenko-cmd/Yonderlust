import { Container } from '@/components/ui/Container';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/70 py-10">
      <Container className="flex flex-col items-center justify-between gap-3 text-sm text-ink-3 sm:flex-row">
        <p className="font-serif text-base text-ink-2">Yonderlust</p>
        <p>You tell us when. We tell you where.</p>
        <p>Prototype — sample data</p>
      </Container>
    </footer>
  );
}
