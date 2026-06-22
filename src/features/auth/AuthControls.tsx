'use client';

import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/Button';

export function AuthControls() {
  const { status, user, signIn, signOut, isConfigured } = useAuth();

  if (status === 'authenticated' && user) {
    const initial = (user.name ?? user.email ?? 'Y').slice(0, 1).toUpperCase();
    return (
      <div className="flex items-center gap-3">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name ?? 'You'}
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-accent/12 text-sm font-medium text-accent">
            {initial}
          </span>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-ink-2 transition-colors hover:text-ink"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void signIn()}
      disabled={status === 'loading' || !isConfigured}
      title={isConfigured ? undefined : 'Configure Supabase to enable sign in'}
    >
      Sign in
    </Button>
  );
}
