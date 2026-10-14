"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { userWithPermission } from "@/lib/auth";
import { fail, friendlyError, type ActionResult } from "@/lib/errors";
import { normalizeCameroonPhone } from "@/lib/phone";
import { isUuid } from "@/lib/params";
import { todayISO } from "@/lib/format";

const uuid = z.string().refine(isUuid, "Identifiant invalide");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const optionalDate = z.union([z.literal(""), date]).optional().transform((v) => v || null);
const NOT_ALLOWED = "Action réservée à l'administrateur.";

const staffSchema = z.object({
  full_name: z.string().trim().min(2, "Nom obligatoire.").max(120),
  job_title: z.string().trim().min(2, "Fonction obligatoire.").max(80),
  contract: z.enum(["permanent", "fixed_term", "part_time", "volunteer"]),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = normalizeCameroonPhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "Téléphone : numéro mobile camerounais attendu." });
        return z.NEVER;
      }
      return n;
    }),
  start_date: optionalDate,
  notes: z.string().trim().max(1000).optional(),
});

export async function createStaff(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageHr"))) return fail(NOT_ALLOWED);
  const parsed = staffSchema
    .extend({ monthly_amount: z.coerce.number().int().min(0).max(99_999_999).optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const { monthly_amount, ...staff } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .insert({ ...staff, notes: staff.notes || null })
    .select("id")
    .single();
  if (error) return fail(friendlyError(error));
  if (monthly_amount != null) {
    const { error: e2 } = await supabase.from("staff_salary_history").insert({
      staff_id: data.id,
      monthly_amount,
      effective_from: staff.start_date ?? todayISO(),
      note: "Salaire de départ",
    });
    if (e2) return fail(`Fiche créée, mais le salaire n'a pas été enregistré : ${friendlyError(e2)}`);
  }
  revalidatePath("/personnel");
  redirect(`/personnel/${data.id}`);
}

export async function updateStaff(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageHr"))) return fail(NOT_ALLOWED);
  const parsed = staffSchema.extend({ id: uuid }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const { id, ...staff } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff")
    .update({ ...staff, notes: staff.notes || null })
    .eq("id", id);
  if (error) return fail(friendlyError(error));
  revalidatePath("/personnel", "layout");
  return { ok: true, message: "Fiche enregistrée." };
}

/** FR-H2: staff are never deleted, only marked as gone. */
export async function endContract(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageHr"))) return fail(NOT_ALLOWED);
  const parsed = z.object({ id: uuid, end_date: date }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Indiquez la date de fin.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff")
    .update({ is_active: false, end_date: parsed.data.end_date })
    .eq("id", parsed.data.id);
  if (error) return fail(friendlyError(error));
  revalidatePath("/personnel", "layout");
  return { ok: true, message: "Fin de contrat enregistrée." };
}

export async function reactivateStaff(formData: FormData) {
  if (!(await userWithPermission("manageHr"))) return;
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return;
  const supabase = await createClient();
  await supabase.from("staff").update({ is_active: true, end_date: null }).eq("id", id);
  revalidatePath("/personnel", "layout");
}

/** BR7: a raise is a new history row. */
export async function addSalaryChange(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageHr"))) return fail(NOT_ALLOWED);
  const parsed = z
    .object({
      staff_id: uuid,
      monthly_amount: z.coerce.number().int().min(0, "Montant invalide.").max(99_999_999),
      effective_from: date,
      note: z.string().trim().max(200).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const supabase = await createClient();
  const { error } = await supabase.from("staff_salary_history").insert({ ...parsed.data, note: parsed.data.note || null });
  if (error) {
    return fail(error.code === "23505" ? "Un salaire existe déjà à cette date d'effet." : friendlyError(error));
  }
  revalidatePath("/personnel", "layout");
  return { ok: true, message: "Nouveau salaire enregistré." };
}

const monthParam = z.string().regex(/^\d{4}-\d{2}-01$/, "Mois invalide.");

export async function preparePayroll(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageHr"))) return fail(NOT_ALLOWED);
  const parsed = monthParam.safeParse(formData.get("month"));
  if (!parsed.success) return fail("Mois invalide.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("prepare_payroll", { p_month: parsed.data });
  if (error) return fail(friendlyError(error));
  revalidatePath("/personnel/paie");
  return { ok: true, message: data ? `${data} ligne(s) de paie préparée(s).` : "Toutes les lignes existent déjà." };
}

export async function updatePayrollEntry(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageHr"))) return fail(NOT_ALLOWED);
  const n = z.coerce.number().int().min(0).max(99_999_999);
  const parsed = z
    .object({ id: uuid, advances: n, deductions: n, bonuses: n, notes: z.string().trim().max(300).optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Montants invalides.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_payroll_entry", {
    p_entry_id: parsed.data.id,
    p_advances: parsed.data.advances,
    p_deductions: parsed.data.deductions,
    p_bonuses: parsed.data.bonuses,
    p_notes: parsed.data.notes ?? "",
  });
  if (error) {
    return fail(error.code === "23514" ? "Le net à payer ne peut pas être négatif." : friendlyError(error));
  }
  revalidatePath("/personnel/paie");
  return { ok: true, message: "Ligne mise à jour." };
}

export async function payPayrollEntry(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageHr"))) return fail(NOT_ALLOWED);
  const parsed = z
    .object({ id: uuid, method: z.enum(["cash", "orange_money", "mtn_momo", "bank"]), paid_at: date })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Choisissez le mode et la date de paiement.");
  if (parsed.data.paid_at > todayISO()) return fail("La date ne peut pas être dans le futur.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pay_payroll_entry", {
    p_entry_id: parsed.data.id,
    p_method: parsed.data.method,
    p_paid_at: parsed.data.paid_at,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/personnel", "layout");
  return { ok: true, message: `Salaire payé. Bulletin ${data}.` };
}

export async function deletePayrollEntry(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageHr"))) return fail(NOT_ALLOWED);
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return fail("Ligne introuvable.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_payroll_entry", { p_entry_id: id });
  if (error) return fail(friendlyError(error));
  revalidatePath("/personnel/paie");
  return { ok: true, message: "Ligne retirée." };
}
