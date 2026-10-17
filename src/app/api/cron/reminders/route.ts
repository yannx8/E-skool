import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/cron";
import { sendWhatsappTemplate, whatsappConfigured } from "@/lib/whatsapp";
import { formatFCFA } from "@/lib/format";
import { termName } from "@/lib/labels";

export const maxDuration = 60;

// V2 automatic reminders, run daily by Vercel Cron. Off unless enabled in
// Configuration > Modules AND the WhatsApp Cloud API variables are set.
// At most 50 messages per run to cap cost.
export async function GET(request: Request) {
  if (!isAuthorizedCron(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: settings } = await admin.from("settings").select("*").single();
  if (!settings?.auto_reminders_enabled) return NextResponse.json({ skipped: "disabled" });
  if (!whatsappConfigured()) return NextResponse.json({ skipped: "whatsapp not configured" });

  const { data: candidates, error } = await admin.rpc("due_auto_reminders", { p_limit: 50 });
  if (error) {
    console.error("[cron/reminders]", error.message);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  for (const c of candidates ?? []) {
    const period =
      c.term == null ? "frais uniques" : termName(c.term, settings.term_label).toLowerCase();
    const params: [string, string, string, string, string] = [
      c.parent_name || "Parent",
      `${c.last_name} ${c.first_name}`.trim(),
      formatFCFA(c.remaining),
      period,
      settings.school_name,
    ];
    const { data: job } = await admin
      .from("message_jobs")
      .insert({
        pupil_id: c.pupil_id,
        school_year_id: c.school_year_id,
        term: c.term,
        to_phone: c.parent_phone,
        payload: { params },
      })
      .select("id")
      .single();
    try {
      const messageId = await sendWhatsappTemplate(c.parent_phone, params);
      sent += 1;
      await Promise.all([
        job &&
          admin
            .from("message_jobs")
            .update({
              status: "sent",
              provider_message_id: messageId,
              sent_at: new Date().toISOString(),
            })
            .eq("id", job.id),
        admin.from("reminder_log").insert({
          pupil_id: c.pupil_id,
          school_year_id: c.school_year_id,
          term: c.term,
          channel: "whatsapp_api",
          amount_due: c.remaining,
        }),
      ]);
    } catch (e) {
      failed += 1;
      if (job) {
        await admin
          .from("message_jobs")
          .update({
            status: "failed",
            error: e instanceof Error ? e.message.slice(0, 500) : "unknown",
          })
          .eq("id", job.id);
      }
    }
  }
  return NextResponse.json({ candidates: candidates?.length ?? 0, sent, failed });
}
