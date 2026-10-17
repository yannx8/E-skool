import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { buildBackupZip } from "@/lib/backup";

// FR-X3: manual export of all data the user can read, as a zip of CSV files.
export const maxDuration = 60;

export async function GET() {
  const user = await getAppUser();
  if (!user?.role || !can(user.role, "exportData")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const supabase = await createClient();
  const { zip, filename } = await buildBackupZip(supabase);
  return new Response(Buffer.from(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
