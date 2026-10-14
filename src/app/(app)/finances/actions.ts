"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { userWithPermission } from "@/lib/auth";
import { fail, friendlyError, type ActionResult } from "@/lib/errors";
import { isUuid } from "@/lib/params";
import { todayISO } from "@/lib/format";

const uuid = z.string().refine(isUuid, "Identifiant invalide");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const method = z.enum(["cash", "orange_money", "mtn_momo", "bank"], { message: "Choisissez le mode de paiement." });
const amount = z.coerce.number().int("Montant invalide.").positive("Le montant doit être supérieur à zéro.").max(999_999_999);
const NOT_ALLOWED = "Action réservée à l'administrateur.";

function done(message: string): ActionResult {
  revalidatePath("/finances", "layout");
  revalidatePath("/tableau-de-bord");
  return { ok: true, message };
}

function notFuture(d: string) {
  return d <= todayISO();
}

export async function recordExpense(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageFinance"))) return fail(NOT_ALLOWED);
  const parsed = z
    .object({
      category_id: uuid,
      amount,
      method,
      spent_on: date.refine(notFuture, "La date ne peut pas être dans le futur."),
      description: z.string().trim().max(300).optional(),
      receipt_path: z
        .string()
        .regex(/^\d{4}\/\d{2}\/[\w-]+\.jpg$/)
        .optional()
        .or(z.literal("")),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_expense", {
    p_category_id: v.category_id,
    p_amount: v.amount,
    p_method: v.method,
    p_spent_on: v.spent_on,
    p_description: v.description ?? "",
    p_receipt_path: v.receipt_path || undefined,
  });
  if (error) return fail(friendlyError(error));
  return done("Dépense enregistrée.");
}

const voidSchema = z.object({ id: uuid, reason: z.string().trim().min(5, "Indiquez un motif d'au moins 5 caractères.").max(300) });

export async function voidExpense(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageFinance"))) return fail(NOT_ALLOWED);
  const parsed = voidSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_expense", { p_expense_id: parsed.data.id, p_reason: parsed.data.reason });
  if (error) return fail(friendlyError(error));
  return done("Dépense annulée.");
}

export async function addCategory(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageFinance"))) return fail(NOT_ALLOWED);
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 60) return fail("Nom de catégorie invalide.");
  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").insert({ name });
  if (error) return fail(error.code === "23505" ? "Cette catégorie existe déjà." : friendlyError(error));
  return done(`Catégorie « ${name} » ajoutée.`);
}

export async function recordIncome(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageFinance"))) return fail(NOT_ALLOWED);
  const parsed = z
    .object({
      label: z.string().trim().min(2, "Indiquez l'origine du revenu.").max(120),
      amount,
      method,
      received_on: date.refine(notFuture, "La date ne peut pas être dans le futur."),
      description: z.string().trim().max(300).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_other_income", {
    p_label: v.label,
    p_amount: v.amount,
    p_method: v.method,
    p_received_on: v.received_on,
    p_description: v.description ?? "",
  });
  if (error) return fail(friendlyError(error));
  return done("Revenu enregistré.");
}

export async function voidIncome(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageFinance"))) return fail(NOT_ALLOWED);
  const parsed = voidSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_other_income", { p_income_id: parsed.data.id, p_reason: parsed.data.reason });
  if (error) return fail(friendlyError(error));
  return done("Revenu annulé.");
}

export async function closeDay(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageFinance"))) return fail(NOT_ALLOWED);
  const parsed = z
    .object({
      closing_date: date,
      counted_cash: z.coerce.number().int().min(0, "Montant compté invalide."),
      removed_cash: z.coerce.number().int().min(0).default(0),
      note: z.string().trim().max(300).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Saisissez le montant compté.");
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("close_day", {
    p_date: v.closing_date,
    p_counted: v.counted_cash,
    p_removed: v.removed_cash,
    p_note: v.note ?? "",
  });
  if (error) return fail(friendlyError(error));
  const diff = (data as { difference?: number } | null)?.difference ?? 0;
  return done(diff === 0 ? "Caisse clôturée, aucun écart." : `Caisse clôturée avec un écart de ${diff} FCFA.`);
}

export async function lockMonth(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageFinance"))) return fail(NOT_ALLOWED);
  const month = String(formData.get("month") ?? "");
  if (!/^\d{4}-\d{2}-01$/.test(month)) return fail("Mois invalide.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("lock_month", { p_month: month });
  if (error) return fail(friendlyError(error));
  return done("Mois verrouillé.");
}

export async function recordAdjustment(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await userWithPermission("manageFinance"))) return fail(NOT_ALLOWED);
  const parsed = z
    .object({
      label: z.string().trim().min(3, "Décrivez la correction.").max(200),
      amount,
      direction: z.enum(["in", "out"]),
      method,
      refers_to_month: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}$/)]).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_adjustment", {
    p_label: v.label,
    p_amount: v.direction === "out" ? -v.amount : v.amount,
    p_method: v.method,
    p_refers_to_month: (v.refers_to_month ? `${v.refers_to_month}-01` : null) as string,
  });
  if (error) return fail(friendlyError(error));
  return done("Ajustement enregistré.");
}
