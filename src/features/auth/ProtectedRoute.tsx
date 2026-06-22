'use client';

import type { ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { OrbitLoader } from '@/components/loaders/OrbitLoader';
import { Button } from '@/components/ui/Button';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, signIn, isConfigured } = useAuth();

  if (status === 'loading') {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <OrbitLoader label="Checking your account" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  return (
    <div className="grid min-h-[50vh] place-items-center px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-accent/12 text-accent">
          <LockKeyhole className="size-5" />
        </div>
        <h2 className="text-display-md">Sign in to keep your trips</h2>
        <p className="mt-3 text-pretty text-ink-2">
          Save the ideas you like and find them here on any device.
        </p>
        <div className="mt-6">
          <Button size="lg" onClick={() => void signIn()} disabled={!isConfigured}>
            Continue with Google
          </Button>
          {!isConfigured && (
            <p className="mt-3 text-sm text-ink-3">
              Set Supabase keys in <code>.env.local</code> to enable sign in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
