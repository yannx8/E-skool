"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { fail, type ActionResult } from "@/lib/errors";

/** Only same-site relative paths are accepted as post-login destinations. */
function safeNext(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/tableau-de-bord";
}

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return fail("Saisissez votre email et votre mot de passe.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status === 429) return fail("Trop de tentatives. Patientez quelques minutes.");
    return fail("Email ou mot de passe incorrect.");
  }
  redirect(safeNext(formData.get("next")));
}

async function siteOrigin(): Promise<string> {
  if (publicEnv.siteUrl) return publicEnv.siteUrl;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function requestPasswordReset(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Saisissez une adresse email valide.");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/compte`,
  });
  if (error && error.status === 429) return fail("Trop de demandes. Réessayez dans une heure.");
  if (error) console.error("[reset]", error.message);
  // Same answer whether the account exists or not.
  return {
    ok: true,
    message: "Si ce compte existe, un email avec un lien de réinitialisation vient d'être envoyé.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
