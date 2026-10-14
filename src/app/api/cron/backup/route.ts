import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBackupZip } from "@/lib/backup";
import { isAuthorizedCron } from "@/lib/cron";
import { sendEmail } from "@/lib/email";
import { serverEnv } from "@/lib/env";
import { formatFCFA, todayISO } from "@/lib/format";
import { fetchAll } from "@/lib/fetch-all";

export const maxDuration = 60;

const KEEP_BACKUPS = 12;

// FR-X2 weekly backup (Vercel Cron, Monday morning): zip of every table stored
// in the private "backups" bucket, emailed to BACKUP_EMAIL, plus the weekly
// summary for the owner (REPORT_EMAILS).
export async function GET(request: Request) {
  if (!isAuthorizedCron(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const env = serverEnv();
  const admin = createAdminClient();

  const { zip, filename, counts } = await buildBackupZip(admin);
  const { error: uploadError } = await admin.storage
    .from("backups")
    .upload(filename, zip, { contentType: "application/zip", upsert: true });
  if (uploadError) console.error("[cron/backup] upload failed", uploadError.message);

  // Keep only the most recent backups in storage.
  const { data: files } = await admin.storage
    .from("backups")
    .list("", { limit: 100, sortBy: { column: "name", order: "desc" } });
  const old = (files ?? []).filter((f) => f.name.endsWith(".zip")).slice(KEEP_BACKUPS);
  if (old.length) await admin.storage.from("backups").remove(old.map((f) => f.name));

  const { data: settings } = await admin.from("settings").select("school_name").single();
  const school = settings?.school_name ?? "E-skool";
  const emailedBackup = env.backupEmail
    ? await sendEmail({
        to: [env.backupEmail],
        subject: `${school} : sauvegarde du ${todayISO()}`,
        text: `Sauvegarde hebdomadaire en pièce jointe (${counts.payments ?? 0} paiements, ${counts.pupils ?? 0} élèves). Conservez ce fichier.`,
        attachments: [{ filename, content: zip }],
      })
    : false;

  const summary = await weeklySummary(admin, school);
  const emailedSummary = env.reportEmails.length
    ? await sendEmail({
        to: env.reportEmails,
        subject: `${school} : les chiffres de la semaine`,
        text: summary,
      })
    : false;

  return NextResponse.json({
    ok: !uploadError,
    filename,
    stored: !uploadError,
    emailedBackup,
    emailedSummary,
    counts,
  });
}

async function weeklySummary(
  admin: ReturnType<typeof createAdminClient>,
  school: string,
): Promise<string> {
  const today = todayISO();
  const weekAgo = new Date(Date.parse(`${today}T00:00:00Z`) - 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const [payments, expenses, { data: year }] = await Promise.all([
    fetchAll<{ amount: number }>((a, b) =>
      admin
        .from("payments")
        .select("amount")
        .eq("voided", false)
        .gte("paid_at", weekAgo)
        .order("id")
        .range(a, b),
    ),
    fetchAll<{ amount: number }>((a, b) =>
      admin
        .from("expenses")
        .select("amount")
        .eq("voided", false)
        .gte("spent_on", weekAgo)
        .order("id")
        .range(a, b),
    ),
    admin.from("school_years").select("id, label").eq("is_current", true).maybeSingle(),
  ]);
  const lines = [
    `${school} - semaine du ${weekAgo} au ${today}`,
    "",
    `Encaissé cette semaine : ${formatFCFA(payments.reduce((s, p) => s + p.amount, 0))} (${payments.length} paiements)`,
    `Dépenses cette semaine : ${formatFCFA(expenses.reduce((s, e) => s + e.amount, 0))}`,
  ];
  if (year) {
    const { data } = await admin.rpc("dashboard_stats", { p_school_year_id: year.id });
    const s = data as {
      due: number;
      applied: number;
      remaining: number;
      due_to_date: number;
      applied_to_date: number;
    } | null;
    if (s) {
      const rate = s.due_to_date > 0 ? Math.round((s.applied_to_date / s.due_to_date) * 100) : 100;
      lines.push(
        "",
        `Année ${year.label} :`,
        `  Attendu : ${formatFCFA(s.due)}`,
        `  Payé : ${formatFCFA(s.applied)}`,
        `  Reste : ${formatFCFA(s.remaining)}`,
        `  Échéances passées payées : ${rate} %`,
      );
    }
  }
  lines.push("", "Détails dans l'application, rubrique Finances.");
  return lines.join("\n");
}
