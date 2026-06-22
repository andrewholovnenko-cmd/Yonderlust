import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when Supabase env vars are present, so the UI can gate auth gracefully. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser Supabase client (cookie-based session via @supabase/ssr).
 * Only call when `isSupabaseConfigured` is true.
 */
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    );
  }
  return createBrowserClient(url as string, anonKey as string);
}
