import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/form";
import { AutoSubmitSelect } from "@/components/ui/client";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserNames } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { pageParam, param, qs, type SearchParams } from "@/lib/params";

export const metadata: Metadata = { title: "Journal d'audit" };

const PAGE_SIZE = 50;

const TABLES: Record<string, string> = {
  payments: "Paiements",
  pupils: "Élèves",
  enrollments: "Inscriptions en classe",
  fee_schedules: "Frais",
  discounts: "Réductions",
  classes: "Classes",
  school_years: "Années scolaires",
  settings: "Paramètres",
  user_roles: "Utilisateurs",
  staff: "Personnel",
  staff_salary_history: "Salaires",
  payroll_entries: "Paie",
  expenses: "Dépenses",
  other_income: "Autres revenus",
  cash_closings: "Clôtures de caisse",
  period_locks: "Mois verrouillés",
  adjustments: "Ajustements",
  expense_categories: "Catégories de dépenses",
  enrollment_applications: "Demandes d'inscription",
};

const ACTIONS: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  INSERT: { label: "Création", tone: "success" },
  UPDATE: { label: "Modification", tone: "warning" },
  DELETE: { label: "Suppression", tone: "danger" },
};

const HIDDEN = new Set(["id", "created_at", "updated_at", "created_by", "portal_token"]);

/** Field-level differences of an UPDATE, or the main fields of an INSERT/DELETE. */
function describe(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string[] {
  const fmt = (v: unknown) => (v === null || v === undefined || v === "" ? "vide" : typeof v === "object" ? JSON.stringify(v) : String(v));
  if (before && after) {
    return Object.keys(after)
      .filter((k) => !HIDDEN.has(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]))
      .map((k) => `${k} : ${fmt(before[k])} → ${fmt(after[k])}`);
  }
  const row = after ?? before ?? {};
  return Object.entries(row)
    .filter(([k, v]) => !HIDDEN.has(k) && v !== null && v !== "")
    .slice(0, 8)
    .map(([k, v]) => `${k} : ${fmt(v)}`);
}

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  await requirePermission("viewAudit");
  const table = param(sp, "table");
  const page = pageParam(sp);
  const supabase = await createClient();
  let q = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("id", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (table && TABLES[table]) q = q.eq("table_name", table);
  const [{ data, count }, names] = await Promise.all([q, getUserNames()]);

  return (
    <>
      <PageHeader
        title="Journal d'audit"
        description="Chaque création, modification ou annulation est enregistrée et ne peut pas être effacée."
        back={{ href: "/configuration", label: "Configuration" }}
      />
      <form method="get" className="mb-4 max-w-xs">
        <Label htmlFor="table">Élément</Label>
        <AutoSubmitSelect id="table" name="table" defaultValue={table}>
          <option value="">Tout</option>
          {Object.entries(TABLES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </AutoSubmitSelect>
      </form>
      <Card>
        {!data || data.length === 0 ? (
          <EmptyState title="Aucune entrée" />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {data.map((e) => {
                const action = ACTIONS[e.action] ?? ACTIONS.UPDATE;
                const lines = describe(e.before as Record<string, unknown> | null, e.after as Record<string, unknown> | null);
                return (
                  <li key={e.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={action.tone}>{action.label}</Badge>
                      <span className="font-medium">{TABLES[e.table_name] ?? e.table_name}</span>
                      <span className="text-sm text-slate-500">
                        {formatDateTime(e.created_at)} · {e.user_id ? (names.get(e.user_id) ?? "Utilisateur supprimé") : "Système"}
                      </span>
                    </div>
                    {lines.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-sm break-words text-slate-700">
                        {lines.map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} hrefFor={(n) => `/configuration/audit${qs({ table, page: n })}`} />
          </>
        )}
      </Card>
    </>
  );
}
