import "server-only";
import { createClient } from "@supabase/supabase-js";
import { assertPublicEnv, publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Service-role client. Bypasses RLS: only use it after checking the caller's
 * role yourself, or from cron routes authenticated with CRON_SECRET.
 */
export function createAdminClient() {
  assertPublicEnv();
  const { serviceRoleKey } = serverEnv();
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is not set.");
  }
  return createClient<Database>(publicEnv.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
