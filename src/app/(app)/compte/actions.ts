"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth";
import { fail, type ActionResult } from "@/lib/errors";

const schema = z
  .object({
    password: z.string().min(10, "10 caractères minimum."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirm"],
  });

export async function changePassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getAppUser();
  if (!user) return fail("Session expirée. Reconnectez-vous.");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Mot de passe invalide.");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password")
      return fail("Choisissez un mot de passe différent de l'actuel.");
    if (error.code === "weak_password")
      return fail("Mot de passe trop faible : mélangez lettres, chiffres et symboles.");
    return fail("Changement impossible. Reconnectez-vous puis réessayez.");
  }
  return { ok: true, message: "Mot de passe modifié." };
}
