'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '@/services/types';
import {
  getCurrentUser,
  isSupabaseConfigured,
  onAuthChange,
  signInWithGoogle,
  signOut as serviceSignOut,
} from '@/services/authService';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unconfigured';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isConfigured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? 'loading' : 'unconfigured',
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    getCurrentUser()
      .then((u) => {
        if (!active) return;
        setUser(u);
        setStatus(u ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (active) setStatus('unauthenticated');
      });

    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setStatus(u ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isConfigured: isSupabaseConfigured,
      signIn: async () => {
        if (!isSupabaseConfigured) return;
        const base = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
        const next = encodeURIComponent(window.location.pathname);
        await signInWithGoogle(`${base}/auth/callback?next=${next}`);
      },
      signOut: async () => {
        await serviceSignOut();
        setUser(null);
        setStatus('unauthenticated');
      },
    }),
    [user, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
