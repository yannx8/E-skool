import { publicEnv } from "@/lib/env";

/** Public URL of the school logo stored in the "branding" bucket. */
export function logoUrl(path: string | null | undefined): string | null {
  if (!path || !publicEnv.supabaseUrl) return null;
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/branding/${path.split("/").map(encodeURIComponent).join("/")}`;
}
