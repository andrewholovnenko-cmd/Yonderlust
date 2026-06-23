import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Server-only Supabase client authenticated with the service-role key —
 * bypasses RLS so the engine can persist newly discovered destinations once
 * for every user to see, not just whoever searched first. Never import this
 * from a 'use client' component; SUPABASE_SERVICE_ROLE_KEY has no
 * NEXT_PUBLIC_ prefix specifically so it never reaches the browser bundle.
 * Returns null (not a thrown error) when unset, so discovery persistence
 * degrades to "not remembered for next time" rather than breaking search.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
