'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PhotoProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/** Image with a skeleton, blur-up fade-in, and a graceful gradient fallback. */
export function Photo({ src, alt, className, sizes = '100vw', priority }: PhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-surface-2', className)}>
      {!errored ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            'object-cover transition-all duration-700 ease-out-soft',
            loaded ? 'scale-100 opacity-100 blur-0' : 'scale-105 opacity-0 blur-md',
          )}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-surface-2 to-accent/15">
          <span className="font-serif text-3xl text-ink-3">{alt.slice(0, 1).toUpperCase()}</span>
        </div>
      )}
      {!loaded && !errored && <div className="absolute inset-0 animate-pulse bg-surface-2" />}
    </div>
  );
}
