import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can, type Permission } from "@/lib/permissions";
import type { AppRole } from "@/lib/labels";
import type { Database } from "@/lib/database.types";

export type AppUser = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole | null;
};

export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type SchoolYear = Database["public"]["Tables"]["school_years"]["Row"];

export const YEAR_COOKIE = "eskool_year";

/** The signed-in user and their role, read once per request. */
export const getAppUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const { data: row } = await supabase
    .from("user_roles")
    .select("role, full_name, is_active")
    .eq("user_id", claims.sub)
    .maybeSingle();
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    fullName: row?.full_name ?? "",
    role: row?.is_active ? row.role : null,
  };
});

/** Redirects to the login page, or to the "no access" page when the user has no role. */
export async function requireUser(): Promise<AppUser & { role: AppRole }> {
  const user = await getAppUser();
  if (!user) redirect("/connexion");
  if (!user.role) redirect("/acces-refuse");
  return user as AppUser & { role: AppRole };
}

/** For pages: redirects to the dashboard when the role lacks the permission. */
export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect("/tableau-de-bord?refus=1");
  return user;
}

/** For server actions: returns the user, or null when not allowed. */
export async function userWithPermission(permission: Permission) {
  const user = await getAppUser();
  if (!user?.role || !can(user.role, permission)) return null;
  return user as AppUser & { role: AppRole };
}

export const getSettings = cache(async (): Promise<Settings> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*").single();
  if (error || !data) throw new Error(`Settings unavailable: ${error?.message ?? "no row"}`);
  return data;
});

export const getSchoolYears = cache(async (): Promise<SchoolYear[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("school_years").select("*").order("label", { ascending: false });
  return data ?? [];
});

/**
 * The school year being viewed: the one picked in the header (cookie), else
 * the current year, else the most recent one. Null before any year exists.
 */
export const getActiveYear = cache(async (): Promise<SchoolYear | null> => {
  const years = await getSchoolYears();
  if (years.length === 0) return null;
  const picked = (await cookies()).get(YEAR_COOKIE)?.value;
  return years.find((y) => y.id === picked) ?? years.find((y) => y.is_current) ?? years[0];
});
