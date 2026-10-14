"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveYear, userWithPermission } from "@/lib/auth";
import { fail, friendlyError, type ActionResult } from "@/lib/errors";
import { isUuid } from "@/lib/params";
import type { Json } from "@/lib/database.types";

const uuid = z.string().refine(isUuid, "Identifiant invalide");
const NOT_ALLOWED = "Action réservée à l'administrateur.";

// ----------------------------------------------------------------- years

const yearSchema = z
  .object({
    label: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{4}$/, "Format attendu : 2026-2027."),
  })
  .refine(
    (v) => Number(v.label.slice(5)) === Number(v.label.slice(0, 4)) + 1,
    "La deuxième année doit suivre la première.",
  );

export async function createYear(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup"))) return fail(NOT_ALLOWED);
  const parsed = yearSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Année invalide.");
  const supabase = await createClient();
  const { count } = await supabase
    .from("school_years")
    .select("id", { count: "exact", head: true });
  const { data, error } = await supabase
    .from("school_years")
    .insert({ label: parsed.data.label, is_current: (count ?? 0) === 0 })
    .select("id")
    .single();
  if (error)
    return fail(error.code === "23505" ? "Cette année existe déjà." : friendlyError(error));

  const copyFrom = String(formData.get("copy_from") ?? "");
  if (isUuid(copyFrom)) {
    const { error: e2 } = await supabase.rpc("copy_fee_schedules", {
      p_from_year: copyFrom,
      p_to_year: data.id,
    });
    if (e2) return fail(`Année créée, mais la copie des frais a échoué : ${friendlyError(e2)}`);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: `Année ${parsed.data.label} créée.` };
}

export async function setCurrentYear(formData: FormData) {
  if (!(await userWithPermission("manageSetup"))) return;
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_current_year", { p_school_year_id: id });
  if (error) friendlyError(error);
  revalidatePath("/", "layout");
}

export async function copyFees(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup"))) return fail(NOT_ALLOWED);
  const parsed = z.object({ from: uuid, to: uuid }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.from === parsed.data.to)
    return fail("Choisissez deux années différentes.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("copy_fee_schedules", {
    p_from_year: parsed.data.from,
    p_to_year: parsed.data.to,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: data
      ? `${data} ligne(s) de frais copiée(s).`
      : "Aucune ligne à copier (déjà présentes).",
  };
}

export async function deleteYear(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup"))) return fail(NOT_ALLOWED);
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return fail("Année introuvable.");
  const supabase = await createClient();
  const { error } = await supabase.from("school_years").delete().eq("id", id);
  if (error) {
    return fail(
      error.code === "23503"
        ? "Cette année contient des frais, élèves ou paiements : impossible de la supprimer."
        : friendlyError(error),
    );
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Année supprimée." };
}

// ----------------------------------------------------------------- classes

const classSchema = z.object({
  name: z.string().trim().min(1, "Nom obligatoire.").max(40),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

export async function createClass(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup"))) return fail(NOT_ALLOWED);
  const parsed = classSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Classe invalide.");
  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert(parsed.data);
  if (error)
    return fail(error.code === "23505" ? "Cette classe existe déjà." : friendlyError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: `Classe ${parsed.data.name} ajoutée.` };
}

export async function updateClass(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup"))) return fail(NOT_ALLOWED);
  const parsed = classSchema
    .extend({ id: uuid, is_active: z.string().optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Classe invalide.");
  const { id, is_active, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({ ...rest, is_active: is_active === "on" })
    .eq("id", id);
  if (error)
    return fail(
      error.code === "23505" ? "Une autre classe porte déjà ce nom." : friendlyError(error),
    );
  revalidatePath("/", "layout");
  return { ok: true, message: "Classe enregistrée." };
}

export async function deleteClass(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup"))) return fail(NOT_ALLOWED);
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return fail("Classe introuvable.");
  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) {
    return fail(
      error.code === "23503"
        ? "Cette classe a des élèves ou des frais : désactivez-la plutôt."
        : friendlyError(error),
    );
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Classe supprimée." };
}

// ----------------------------------------------------------------- fees

const feeLineSchema = z.object({
  class_id: uuid,
  fee: z.enum(["tuition", "registration", "uniform", "books", "exam", "other"]),
  term: z.number().int().min(1).max(12).nullable(),
  amount: z.number().int().min(0).max(99_999_999),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type FeeLineInput = z.infer<typeof feeLineSchema>;

export async function saveFees(lines: FeeLineInput[]): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup"))) return fail(NOT_ALLOWED);
  const year = await getActiveYear();
  if (!year) return fail("Aucune année scolaire.");
  const parsed = z.array(feeLineSchema).max(2000).safeParse(lines);
  if (!parsed.success) return fail("Chaque montant doit avoir une échéance valide.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_fee_schedules", {
    p_school_year_id: year.id,
    p_lines: parsed.data as unknown as Json,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: "Frais enregistrés." };
}

// ----------------------------------------------------------------- school settings

const schoolSchema = z.object({
  school_name: z.string().trim().min(2, "Nom de l'école obligatoire.").max(120),
  address: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.union([z.literal(""), z.string().trim().email("Email invalide.")]).optional(),
  receipt_footer: z.string().trim().max(200).optional(),
  receipt_format: z.enum(["a5", "a4", "thermal"]),
  term_label: z.string().trim().min(1).max(30),
  terms_count: z.coerce.number().int().min(1).max(12),
  reminder_template: z.string().trim().min(10, "Le message est trop court.").max(1000),
});

export async function saveSchool(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup"))) return fail(NOT_ALLOWED);
  const parsed = schoolSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      school_name: v.school_name,
      address: v.address || null,
      phone: v.phone || null,
      email: v.email || null,
      receipt_footer: v.receipt_footer || null,
      receipt_format: v.receipt_format,
      term_label: v.term_label,
      terms_count: v.terms_count,
      reminder_template: v.reminder_template,
    })
    .eq("id", true);
  if (error) return fail(friendlyError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: "Informations de l'école enregistrées." };
}

/** Saves the logo path after the browser uploaded the file to Storage. */
export async function saveLogoPath(path: string | null): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup"))) return fail(NOT_ALLOWED);
  if (path !== null && !/^logo\/[\w.-]+$/.test(path)) return fail("Fichier invalide.");
  const supabase = await createClient();
  const { error } = await supabase.from("settings").update({ logo_path: path }).eq("id", true);
  if (error) return fail(friendlyError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: path ? "Logo enregistré." : "Logo retiré." };
}

const modulesSchema = z.object({
  module_hr: z.string().optional(),
  module_finance: z.string().optional(),
  module_enrollment: z.string().optional(),
  auto_reminders_enabled: z.string().optional(),
  auto_reminder_interval_days: z.coerce.number().int().min(1).max(60),
});

export async function saveModules(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup"))) return fail(NOT_ALLOWED);
  const parsed = modulesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      module_hr: v.module_hr === "on",
      module_finance: v.module_finance === "on",
      module_enrollment: v.module_enrollment === "on",
      auto_reminders_enabled: v.auto_reminders_enabled === "on",
      auto_reminder_interval_days: v.auto_reminder_interval_days,
    })
    .eq("id", true);
  if (error) return fail(friendlyError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: "Modules enregistrés." };
}

// ----------------------------------------------------------------- users (service role)

const userSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide."),
  full_name: z.string().trim().min(2, "Nom obligatoire.").max(80),
  role: z.enum(["admin", "owner", "secretary"]),
  password: z.string().min(10, "Mot de passe : 10 caractères minimum."),
});

export async function createUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const me = await userWithPermission("manageUsers");
  if (!me) return fail(NOT_ALLOWED);
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const v = parsed.data;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    user_metadata: { full_name: v.full_name },
  });
  if (error || !data.user) {
    return fail(
      error?.message?.toLowerCase().includes("already")
        ? "Un compte existe déjà avec cet email."
        : "Création du compte impossible.",
    );
  }
  const { error: e2 } = await admin
    .from("user_roles")
    .upsert({ user_id: data.user.id, role: v.role, full_name: v.full_name, is_active: true });
  if (e2) return fail(friendlyError(e2));
  revalidatePath("/configuration/utilisateurs");
  return {
    ok: true,
    message: `Compte créé pour ${v.full_name}. Communiquez-lui son mot de passe provisoire.`,
  };
}

const updateUserSchema = z.object({
  user_id: uuid,
  role: z.enum(["admin", "owner", "secretary"]),
  is_active: z.string().optional(),
});

export async function updateUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const me = await userWithPermission("manageUsers");
  if (!me) return fail(NOT_ALLOWED);
  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Formulaire invalide.");
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_roles")
    .update({ role: parsed.data.role, is_active: parsed.data.is_active === "on" })
    .eq("user_id", parsed.data.user_id);
  if (error) return fail(friendlyError(error));
  revalidatePath("/configuration/utilisateurs");
  return { ok: true, message: "Accès mis à jour." };
}

export async function resetUserPassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const me = await userWithPermission("manageUsers");
  if (!me) return fail(NOT_ALLOWED);
  const parsed = z
    .object({
      user_id: uuid,
      password: z.string().min(10, "Mot de passe : 10 caractères minimum."),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.user_id, {
    password: parsed.data.password,
  });
  if (error) return fail("Changement de mot de passe impossible.");
  return { ok: true, message: "Mot de passe provisoire enregistré. Communiquez-le à la personne." };
}
