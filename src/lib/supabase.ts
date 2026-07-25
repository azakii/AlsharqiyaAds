import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** true when Supabase env vars are configured; otherwise the app falls back to seed data. */
export const supabaseEnabled = Boolean(url && anonKey);

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

/** true when the service-role key is configured (required for admin writes to bypass RLS). */
export const serviceRoleEnabled = Boolean(url && serviceKey);

/**
 * Server-only client with elevated privileges for admin writes (approve/reject/delete/edit).
 * Deliberately does NOT fall back to the anon key: without the service-role key, writes would
 * be silently blocked by Row Level Security (no error, zero rows affected) which is exactly the
 * "الأزرار مش شغالة" symptom. Callers must check for null and surface a clear message instead.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
