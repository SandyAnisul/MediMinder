import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only routes (cron tick, Telegram webhook).
 * Bypasses RLS — never import this into client components or expose the key to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
