"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveYear, userWithPermission } from "@/lib/auth";
import { fail, friendlyError, type ActionResult } from "@/lib/errors";
import { normalizeCameroonPhone } from "@/lib/phone";
import { isUuid } from "@/lib/params";

const uuid = z.string().refine(isUuid, "Identifiant invalide");
const NOT_ALLOWED = "Action non autorisée pour votre rôle.";

const applicationSchema = z.object({
  child_last_name: z.string().trim().min(1, "Nom de l'enfant obligatoire.").max(80),
  child_first_name: z.string().trim().max(80).default(""),
  birth_date: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  desired_class_id: z.union([z.literal(""), uuid]).optional(),
  parent_name: z.string().trim().max(120).optional(),
  parent_phone: z
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
  source: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function createApplication(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageEnrollment"))) return fail(NOT_ALLOWED);
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const v = parsed.data;
  const year = await getActiveYear();
  const supabase = await createClient();
  const { error } = await supabase.from("enrollment_applications").insert({
    child_last_name: v.child_last_name.toUpperCase(),
    child_first_name: v.child_first_name,
    birth_date: v.birth_date || null,
    desired_class_id: v.desired_class_id || null,
    school_year_id: year?.id ?? null,
    parent_name: v.parent_name || null,
    parent_phone: v.parent_phone,
    source: v.source || null,
    notes: v.notes || null,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/inscriptions");
  return { ok: true, message: "Demande enregistrée." };
}

export async function setApplicationStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageEnrollment"))) return fail(NOT_ALLOWED);
  const parsed = z
    .object({ id: uuid, status: z.enum(["new", "contacted", "visit", "accepted", "rejected"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Statut invalide.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollment_applications")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .neq("status", "enrolled");
  if (error) return fail(friendlyError(error));
  revalidatePath("/inscriptions");
  return { ok: true, message: "Statut mis à jour." };
}

export async function enrollApplication(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageEnrollment"))) return fail(NOT_ALLOWED);
  const parsed = z
    .object({ id: uuid, class_id: uuid, school_year_id: uuid })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Choisissez l'année et la classe.");
  const supabase = await createClient();
  const { data: pupilId, error } = await supabase.rpc("enroll_application", {
    p_application_id: parsed.data.id,
    p_school_year_id: parsed.data.school_year_id,
    p_class_id: parsed.data.class_id,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/", "layout");
  redirect(`/eleves/${pupilId}?cree=1`);
}

export async function deleteApplication(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await userWithPermission("manageSetup")))
    return fail("Seul l'administrateur peut supprimer une demande.");
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return fail("Demande introuvable.");
  const supabase = await createClient();
  const { error } = await supabase.from("enrollment_applications").delete().eq("id", id);
  if (error) return fail(friendlyError(error));
  revalidatePath("/inscriptions");
  return { ok: true, message: "Demande supprimée." };
}
