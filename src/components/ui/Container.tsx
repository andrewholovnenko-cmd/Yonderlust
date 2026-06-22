import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Container({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return <As className={cn('mx-auto w-full max-w-content px-5 sm:px-8', className)}>{children}</As>;
}
