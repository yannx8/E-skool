import { databaseStatus } from "@/modules/core";

export const dynamic = "force-dynamic";

// For uptime checks: 200 when the database answers, 503 when it does not.
export async function GET() {
  const status = await databaseStatus();
  return Response.json({ ok: status.ok }, { status: status.ok ? 200 : 503 });
}
