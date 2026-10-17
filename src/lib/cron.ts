import "server-only";
import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

/**
 * Vercel Cron sends "Authorization: Bearer <CRON_SECRET>". Without a
 * configured secret, cron routes refuse to run.
 */
export function isAuthorizedCron(request: Request): boolean {
  const { cronSecret } = serverEnv();
  if (!cronSecret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
