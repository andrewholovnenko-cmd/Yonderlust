'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <h1 className="text-display-md">Something went off course</h1>
        <p className="mt-2 text-pretty text-ink-2">
          An unexpected error happened. Let us try that again.
        </p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </Container>
  );
}
