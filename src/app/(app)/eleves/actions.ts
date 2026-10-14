"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveYear, userWithPermission } from "@/lib/auth";
import { fail, friendlyError, type ActionResult } from "@/lib/errors";
import { normalizeCameroonPhone } from "@/lib/phone";
import { isUuid } from "@/lib/params";
import { todayISO } from "@/lib/format";
import type { Json } from "@/lib/database.types";

const uuid = z.string().refine(isUuid, "Identifiant invalide");

const optionalPhone = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = normalizeCameroonPhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: `${label} : numéro mobile camerounais attendu (ex. 6 77 12 34 56).` });
        return z.NEVER;
      }
      return n;
    });

const pupilSchema = z.object({
  last_name: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  first_name: z.string().trim().max(80).default(""),
  class_id: uuid,
  parent_name: z.string().trim().max(120).optional(),
  parent_phone: optionalPhone("Téléphone du parent"),
  parent_phone_alt: optionalPhone("Second téléphone"),
  notes: z.string().trim().max(1000).optional(),
});

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export async function createPupil(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await userWithPermission("editPupils");
  if (!user) return fail("Action non autorisée pour votre rôle.");
  const year = await getActiveYear();
  if (!year) return fail("Créez d'abord l'année scolaire.");
  const parsed = pupilSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Corrigez les champs en rouge.", fieldErrors(parsed.error));
  const v = parsed.data;

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("create_pupil", {
    p_school_year_id: year.id,
    p_class_id: v.class_id,
    p_last_name: v.last_name,
    p_first_name: v.first_name,
    p_parent_name: v.parent_name || undefined,
    p_parent_phone: v.parent_phone ?? undefined,
    p_parent_phone_alt: v.parent_phone_alt ?? undefined,
    p_notes: v.notes || undefined,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/eleves");
  redirect(formData.get("then") === "payer" ? `/paiements/nouveau?eleve=${id}` : `/eleves/${id}?cree=1`);
}

export async function updatePupil(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await userWithPermission("editPupils");
  if (!user) return fail("Action non autorisée pour votre rôle.");
  const year = await getActiveYear();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return fail("Élève introuvable.");
  const parsed = pupilSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Corrigez les champs en rouge.", fieldErrors(parsed.error));
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("pupils")
    .update({
      last_name: v.last_name.toUpperCase(),
      first_name: v.first_name,
      parent_name: v.parent_name || null,
      parent_phone: v.parent_phone,
      parent_phone_alt: v.parent_phone_alt,
      notes: v.notes || null,
    })
    .eq("id", id);
  if (error) return fail(friendlyError(error));

  if (year) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, class_id")
      .eq("pupil_id", id)
      .eq("school_year_id", year.id)
      .maybeSingle();
    if (enrollment && enrollment.class_id !== v.class_id) {
      const { error: e2 } = await supabase.from("enrollments").update({ class_id: v.class_id }).eq("id", enrollment.id);
      if (e2) return fail(friendlyError(e2));
    } else if (!enrollment) {
      const { error: e3 } = await supabase
        .from("enrollments")
        .insert({ pupil_id: id, school_year_id: year.id, class_id: v.class_id });
      if (e3) return fail(friendlyError(e3));
    }
  }
  revalidatePath("/", "layout");
  redirect(`/eleves/${id}?modifie=1`);
}

const leaveSchema = z.object({
  id: uuid,
  left_reason: z.string().trim().min(3, "Indiquez la raison du départ.").max(300),
  left_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/** FR-P5: a pupil is never deleted, only marked as gone. */
export async function deactivatePupil(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await userWithPermission("editPupils");
  if (!user) return fail("Action non autorisée pour votre rôle.");
  const parsed = leaveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("pupils")
    .update({ is_active: false, left_reason: parsed.data.left_reason, left_on: parsed.data.left_on || todayISO() })
    .eq("id", parsed.data.id);
  if (error) return fail(friendlyError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: "Élève marqué comme parti. Son historique est conservé." };
}

export async function reactivatePupil(formData: FormData) {
  const user = await userWithPermission("editPupils");
  const id = String(formData.get("id") ?? "");
  if (!user || !isUuid(id)) return;
  const supabase = await createClient();
  await supabase.from("pupils").update({ is_active: true, left_on: null, left_reason: null }).eq("id", id);
  revalidatePath("/", "layout");
}

const discountSchema = z.object({
  pupil_id: uuid,
  fee: z.enum(["", "tuition", "registration", "uniform", "books", "exam", "other"]),
  term: z.string().regex(/^\d*$/),
  kind: z.enum(["percent", "fixed"]),
  value: z.coerce.number().int().positive("La valeur doit être positive."),
  reason: z.string().trim().min(3, "Indiquez le motif de la réduction.").max(200),
});

export async function addDiscount(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await userWithPermission("manageDiscounts");
  if (!user) return fail("Seul l'administrateur peut accorder une réduction.");
  const year = await getActiveYear();
  if (!year) return fail("Aucune année scolaire active.");
  const parsed = discountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const v = parsed.data;
  if (v.kind === "percent" && v.value > 100) return fail("Un pourcentage ne peut pas dépasser 100.");
  const supabase = await createClient();
  const { error } = await supabase.from("discounts").insert({
    pupil_id: v.pupil_id,
    school_year_id: year.id,
    fee: v.fee || null,
    term: v.term ? Number(v.term) : null,
    kind: v.kind,
    value: v.value,
    reason: v.reason,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath(`/eleves/${v.pupil_id}`);
  return { ok: true, message: "Réduction enregistrée." };
}

export async function disableDiscount(formData: FormData) {
  const user = await userWithPermission("manageDiscounts");
  const id = String(formData.get("id") ?? "");
  const pupilId = String(formData.get("pupil_id") ?? "");
  if (!user || !isUuid(id)) return;
  const supabase = await createClient();
  await supabase.from("discounts").update({ is_active: false }).eq("id", id);
  revalidatePath(`/eleves/${pupilId}`);
}

export async function regeneratePortalLink(formData: FormData) {
  const user = await userWithPermission("manageSetup");
  const id = String(formData.get("id") ?? "");
  if (!user || !isUuid(id)) return;
  const supabase = await createClient();
  await supabase.rpc("regenerate_portal_token", { p_pupil_id: id });
  revalidatePath(`/eleves/${id}`);
}

/** FR-B5: logs a WhatsApp reminder click (not its delivery). */
export async function logReminder(input: { pupilId: string; term: number | null; amountDue: number }) {
  const user = await userWithPermission("sendReminders");
  if (!user || !isUuid(input.pupilId)) return { ok: false };
  const year = await getActiveYear();
  const supabase = await createClient();
  const { error } = await supabase.from("reminder_log").insert({
    pupil_id: input.pupilId,
    school_year_id: year?.id ?? null,
    term: input.term,
    amount_due: Math.max(0, Math.round(input.amountDue)),
    channel: "whatsapp_link",
  });
  if (error) friendlyError(error);
  revalidatePath("/impayes");
  return { ok: !error };
}

export type ImportRow = {
  last_name: string;
  first_name: string;
  class_name: string;
  parent_name?: string;
  parent_phone?: string;
  notes?: string;
};

export type ImportResult = { inserted: number; rejected: { row: number; reason: string }[] };

export async function importPupils(rows: ImportRow[]): Promise<ActionResult<ImportResult>> {
  const user = await userWithPermission("importPupils");
  if (!user) return fail("Action non autorisée pour votre rôle.");
  const year = await getActiveYear();
  if (!year) return fail("Créez d'abord l'année scolaire.");
  if (!Array.isArray(rows) || rows.length === 0) return fail("Aucune ligne à importer.");
  if (rows.length > 2000) return fail("2000 lignes maximum par import.");
  const clean = rows.map((r) => ({
    last_name: String(r.last_name ?? "").slice(0, 80),
    first_name: String(r.first_name ?? "").slice(0, 80),
    class_name: String(r.class_name ?? "").slice(0, 60),
    parent_name: String(r.parent_name ?? "").slice(0, 120),
    parent_phone: String(r.parent_phone ?? "").slice(0, 30),
    notes: String(r.notes ?? "").slice(0, 1000),
  }));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("import_pupils", {
    p_school_year_id: year.id,
    p_rows: clean as unknown as Json,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/", "layout");
  return { ok: true, data: data as unknown as ImportResult };
}

export type PromotionDecision = { pupil_id: string; class_id: string | null };

export async function promotePupils(
  toYearId: string,
  decisions: PromotionDecision[],
): Promise<ActionResult<{ enrolled: number; skipped: number; left: number }>> {
  const user = await userWithPermission("promotePupils");
  if (!user) return fail("Seul l'administrateur peut faire le passage de classe.");
  if (!isUuid(toYearId)) return fail("Année de destination invalide.");
  const valid = decisions.filter((d) => isUuid(d.pupil_id) && (d.class_id === null || isUuid(d.class_id)));
  if (valid.length === 0) return fail("Aucun élève sélectionné.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("promote_pupils", {
    p_to_year: toYearId,
    p_decisions: valid as unknown as Json,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/", "layout");
  return { ok: true, data: data as unknown as { enrolled: number; skipped: number; left: number } };
}
