import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/fetch-all";
import { isUuid, param } from "@/lib/params";
import type { BalanceStatus } from "@/lib/labels";

export type PupilListRow = {
  id: string;
  last_name: string;
  first_name: string;
  parent_name: string | null;
  parent_phone: string | null;
  is_active: boolean;
  class_id: string;
  class_name: string;
  class_sort: number;
  due: number;
  paid: number;
  remaining: number;
  overdue: number;
  status: BalanceStatus;
};

export type PupilFilters = {
  q: string;
  classId: string;
  status: string;
  state: "actifs" | "partis" | "tous";
};

export function readPupilFilters(sp: Record<string, string | string[] | undefined>): PupilFilters {
  const state = param(sp, "etat");
  return {
    q: param(sp, "q").slice(0, 60),
    classId: isUuid(param(sp, "classe")) ? param(sp, "classe") : "",
    status: param(sp, "statut"),
    state: state === "partis" || state === "tous" ? state : "actifs",
  };
}

export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** BR1 applied to what is due to date for the whole year. */
function yearStatus(dueToDate: number, overdue: number): BalanceStatus {
  if (dueToDate <= 0) return "pas_encore_du";
  if (overdue <= 0) return "solvable";
  return overdue < dueToDate ? "partiel" : "insolvable";
}

type EnrollmentRow = {
  pupil_id: string;
  class_id: string;
  pupils: {
    last_name: string;
    first_name: string;
    parent_name: string | null;
    parent_phone: string | null;
    parent_phone_alt: string | null;
    is_active: boolean;
  } | null;
  classes: { name: string; sort_order: number } | null;
};

/** Every pupil enrolled in a year with their year balance, filtered and sorted. */
export async function loadPupils(yearId: string, f: PupilFilters): Promise<PupilListRow[]> {
  const supabase = await createClient();
  const [enrollments, balances] = await Promise.all([
    fetchAll<EnrollmentRow>((from, to) =>
      supabase
        .from("enrollments")
        .select(
          "pupil_id, class_id, pupils(last_name, first_name, parent_name, parent_phone, parent_phone_alt, is_active), classes(name, sort_order)",
        )
        .eq("school_year_id", yearId)
        .order("id")
        .range(from, to),
    ),
    fetchAll((from, to) =>
      supabase
        .from("pupil_year_balance")
        .select("pupil_id, due, paid, remaining, due_to_date, overdue")
        .eq("school_year_id", yearId)
        .order("pupil_id")
        .range(from, to),
    ),
  ]);
  const byPupil = new Map(balances.map((b) => [b.pupil_id, b]));
  const q = normalizeSearch(f.q);
  const qDigits = f.q.replace(/\D/g, "");

  return enrollments
    .filter((e) => e.pupils)
    .map((e) => {
      const b = byPupil.get(e.pupil_id);
      const p = e.pupils!;
      return {
        id: e.pupil_id,
        last_name: p.last_name,
        first_name: p.first_name,
        parent_name: p.parent_name,
        parent_phone: p.parent_phone,
        is_active: p.is_active,
        class_id: e.class_id,
        class_name: e.classes?.name ?? "",
        class_sort: e.classes?.sort_order ?? 0,
        due: b?.due ?? 0,
        paid: b?.paid ?? 0,
        remaining: b?.remaining ?? 0,
        overdue: b?.overdue ?? 0,
        status: yearStatus(b?.due_to_date ?? 0, b?.overdue ?? 0),
        _search: normalizeSearch(
          `${p.last_name} ${p.first_name} ${p.first_name} ${p.last_name} ${p.parent_name ?? ""}`,
        ),
        _phones: `${p.parent_phone ?? ""} ${p.parent_phone_alt ?? ""}`,
      };
    })
    .filter((r) => {
      if (f.state === "actifs" && !r.is_active) return false;
      if (f.state === "partis" && r.is_active) return false;
      if (f.classId && r.class_id !== f.classId) return false;
      if (f.status && r.status !== f.status) return false;
      if (q && !r._search.includes(q) && !(qDigits.length >= 4 && r._phones.includes(qDigits)))
        return false;
      return true;
    })
    .sort(
      (a, b) =>
        a.class_sort - b.class_sort ||
        a.class_name.localeCompare(b.class_name) ||
        a.last_name.localeCompare(b.last_name, "fr") ||
        a.first_name.localeCompare(b.first_name, "fr"),
    )
    .map(({ _search, _phones, ...row }) => {
      void _search;
      void _phones;
      return row;
    });
}
