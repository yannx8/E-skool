import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/fetch-all";
import { isUuid, param } from "@/lib/params";
import { todayISO } from "@/lib/format";
import type { BalanceStatus } from "@/lib/labels";

export type UnpaidFilters = { term: string; classId: string; includeLeft: boolean };

export type UnpaidRow = {
  pupil_id: string;
  last_name: string;
  first_name: string;
  parent_name: string | null;
  parent_phone: string | null;
  portal_token: string | null;
  is_active: boolean;
  class_name: string;
  class_sort: number;
  term: number | null;
  due: number;
  applied: number;
  remaining: number;
  due_date: string | null;
  status: BalanceStatus;
  last_reminded_at: string | null;
};

/** term: "" = every overdue period, "unique" = one-off fees, "1".."12" = that term. */
export function readUnpaidFilters(sp: Record<string, string | string[] | undefined>): UnpaidFilters {
  const term = param(sp, "tranche");
  return {
    term: term === "unique" || /^\d{1,2}$/.test(term) ? term : "",
    classId: isUuid(param(sp, "classe")) ? param(sp, "classe") : "",
    includeLeft: param(sp, "partis") === "1",
  };
}

type ViewRow = {
  pupil_id: string;
  last_name: string;
  first_name: string;
  parent_name: string | null;
  parent_phone: string | null;
  portal_token: string | null;
  is_active: boolean;
  class_id: string;
  class_name: string;
  class_sort_order: number;
  term: number | null;
  due: number;
  applied: number;
  remaining: number;
  due_date: string | null;
  status: string;
  last_reminded_at: string | null;
};

export async function loadUnpaid(yearId: string, f: UnpaidFilters): Promise<UnpaidRow[]> {
  const supabase = await createClient();
  const today = todayISO();
  const rows = await fetchAll<ViewRow>((from, to) => {
    let q = supabase
      .from("pupil_term_balance")
      .select(
        "pupil_id, last_name, first_name, parent_name, parent_phone, portal_token, is_active, class_id, class_name, class_sort_order, term, due, applied, remaining, due_date, status, last_reminded_at",
      )
      .eq("school_year_id", yearId)
      .gt("remaining", 0)
      .order("pupil_id")
      .order("term", { nullsFirst: true });
    if (f.term === "unique") q = q.is("term", null);
    else if (f.term) q = q.eq("term", Number(f.term));
    else q = q.lt("due_date", today);
    if (f.classId) q = q.eq("class_id", f.classId);
    if (!f.includeLeft) q = q.eq("is_active", true);
    return q.range(from, to) as unknown as PromiseLike<{ data: ViewRow[] | null; error: null }>;
  });

  const toRow = (r: ViewRow): UnpaidRow => ({
    pupil_id: r.pupil_id,
    last_name: r.last_name,
    first_name: r.first_name,
    parent_name: r.parent_name,
    parent_phone: r.parent_phone,
    portal_token: r.portal_token,
    is_active: r.is_active,
    class_name: r.class_name,
    class_sort: r.class_sort_order,
    term: r.term,
    due: r.due,
    applied: r.applied,
    remaining: r.remaining,
    due_date: r.due_date,
    status: r.status as BalanceStatus,
    last_reminded_at: r.last_reminded_at,
  });

  let result: UnpaidRow[];
  if (f.term) {
    result = rows.map(toRow);
  } else {
    // Every overdue period: one row per pupil with the total overdue.
    const byPupil = new Map<string, UnpaidRow & { periods: number }>();
    for (const r of rows) {
      const existing = byPupil.get(r.pupil_id);
      if (!existing) {
        byPupil.set(r.pupil_id, { ...toRow(r), periods: 1 });
        continue;
      }
      existing.due += r.due;
      existing.applied += r.applied;
      existing.remaining += r.remaining;
      existing.periods += 1;
      existing.term = null;
      if (r.due_date && (!existing.due_date || r.due_date < existing.due_date)) existing.due_date = r.due_date;
      if (r.last_reminded_at && (!existing.last_reminded_at || r.last_reminded_at > existing.last_reminded_at)) {
        existing.last_reminded_at = r.last_reminded_at;
      }
      existing.status = existing.applied > 0 ? "partiel" : "insolvable";
    }
    result = [...byPupil.values()].map(({ periods, ...row }) => {
      void periods;
      return row;
    });
  }
  return result.sort((a, b) => b.remaining - a.remaining || a.last_name.localeCompare(b.last_name, "fr"));
}
