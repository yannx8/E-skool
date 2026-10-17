import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertPublicEnv, publicEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/** Supabase client acting as the signed-in user: RLS applies. */
export async function createClient() {
  assertPublicEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Anonymous client without cookies (parent portal). */
export function createAnonClient() {
  assertPublicEnv();
  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
