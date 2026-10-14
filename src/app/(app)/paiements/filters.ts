import "server-only";
import { createClient } from "@/lib/supabase/server";
import { pupilIdsInClass } from "@/lib/queries";
import { fetchAll } from "@/lib/fetch-all";
import { isUuid, param } from "@/lib/params";
import type { PaymentMethod } from "@/lib/labels";

export type PaymentFilters = {
  from: string;
  to: string;
  method: string;
  classId: string;
  status: "valid" | "voided" | "all";
};

export function readPaymentFilters(sp: Record<string, string | string[] | undefined>): PaymentFilters {
  const date = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  const status = param(sp, "statut");
  return {
    from: date(param(sp, "du")),
    to: date(param(sp, "au")),
    method: ["cash", "orange_money", "mtn_momo", "bank"].includes(param(sp, "mode")) ? param(sp, "mode") : "",
    classId: isUuid(param(sp, "classe")) ? param(sp, "classe") : "",
    status: status === "voided" || status === "all" ? status : "valid",
  };
}

/**
 * Returns a builder for payments of a year matching the filters. Shared by the
 * history page and the CSV export so both always show the same rows.
 */
export async function paymentsQuery(yearId: string, f: PaymentFilters, columns: string, withCount = false) {
  const supabase = await createClient();
  const classPupils = f.classId ? await pupilIdsInClass(yearId, f.classId) : null;
  return () => {
    let q = supabase
      .from("payments")
      .select(columns, { count: withCount ? "exact" : undefined })
      .eq("school_year_id", yearId)
      .order("paid_at", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id");
    if (f.from) q = q.gte("paid_at", f.from);
    if (f.to) q = q.lte("paid_at", f.to);
    if (f.method) q = q.eq("method", f.method as PaymentMethod);
    if (f.status === "valid") q = q.eq("voided", false);
    if (f.status === "voided") q = q.eq("voided", true);
    if (classPupils) q = q.in("pupil_id", classPupils.length ? classPupils : ["00000000-0000-0000-0000-000000000000"]);
    return q;
  };
}

export async function allPayments<T>(yearId: string, f: PaymentFilters, columns: string): Promise<T[]> {
  const build = await paymentsQuery(yearId, f, columns);
  return fetchAll<T>((from, to) => build().range(from, to) as unknown as PromiseLike<{ data: T[] | null; error: null }>);
}
