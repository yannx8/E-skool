import "server-only";
import { publicEnv } from "@/lib/env";
import { formatDate, formatFCFA, fullName } from "@/lib/format";
import { termName } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { renderReminderMessage, whatsappUrl } from "@/lib/reminder";
import type { Settings } from "@/lib/auth";

/** wa.me link with the school's reminder template filled for one pupil and term. */
export function reminderHref(
  settings: Settings,
  r: {
    last_name: string;
    first_name: string;
    parent_name: string | null;
    parent_phone: string;
    class_name: string;
    term: number | null;
    remaining: number;
    due_date: string | null;
    portal_token?: string | null;
  },
): string {
  const message = renderReminderMessage(settings.reminder_template, {
    parent: r.parent_name ?? "",
    eleve: fullName(r),
    classe: r.class_name,
    montant: formatFCFA(r.remaining),
    tranche: r.term == null ? "frais uniques" : termName(r.term, settings.term_label).toLowerCase(),
    echeance: formatDate(r.due_date),
    ecole: settings.school_name,
    telephone_ecole: formatPhone(settings.phone) || settings.phone || "",
    lien: publicEnv.siteUrl && r.portal_token ? `${publicEnv.siteUrl}/p/${r.portal_token}` : "",
  });
  return whatsappUrl(r.parent_phone, message);
}
