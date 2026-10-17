import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ClassRow = { id: string; name: string; sort_order: number; is_active: boolean };

/** Classes in display order. */
export const getClasses = cache(async (): Promise<ClassRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, name, sort_order, is_active")
    .order("sort_order")
    .order("name");
  return data ?? [];
});

/** Pupil ids enrolled in a class for a year (used to filter by class). */
export async function pupilIdsInClass(yearId: string, classId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("pupil_id")
    .eq("school_year_id", yearId)
    .eq("class_id", classId);
  return (data ?? []).map((r) => r.pupil_id);
}

/** user_id -> display name, for "recorded by" columns. */
export const getUserNames = cache(async (): Promise<Map<string, string>> => {
  const supabase = await createClient();
  const { data } = await supabase.from("user_roles").select("user_id, full_name");
  return new Map((data ?? []).map((r) => [r.user_id, r.full_name]));
});
