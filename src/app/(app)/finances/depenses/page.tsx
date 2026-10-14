import type { Metadata } from "next";
import { ImageIcon } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/form";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { MonthNav } from "@/components/month-nav";
import { VoidDialog } from "@/components/void-dialog";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import {
  addMonths,
  currentMonthISO,
  formatDate,
  formatFCFA,
  parseMonthParam,
  todayISO,
} from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/labels";
import { param, type SearchParams } from "@/lib/params";
import { addCategory, voidExpense } from "../actions";
import { ExpenseForm } from "./expense-form";

export const metadata: Metadata = { title: "Dépenses" };

export default async function ExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await requirePermission("viewFinance");
  const month = parseMonthParam(param(sp, "mois"), currentMonthISO());
  const end = addMonths(month, 1);
  const supabase = await createClient();
  const [{ data: expenses }, { data: categories }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, expense_categories(name)")
      .gte("spent_on", month)
      .lt("spent_on", end)
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("expense_categories").select("id, name, is_active").order("name"),
  ]);
  const paths = (expenses ?? []).map((e) => e.receipt_path).filter((p): p is string => !!p);
  const { data: signed } = paths.length
    ? await supabase.storage.from("expense-receipts").createSignedUrls(paths, 600)
    : { data: [] };
  const urlOf = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  const total = (expenses ?? []).filter((e) => !e.voided).reduce((s, e) => s + e.amount, 0);
  const canManage = can(user.role, "manageFinance");

  return (
    <>
      <PageHeader
        title="Dépenses"
        description={`Total du mois : ${formatFCFA(total)}`}
        actions={<MonthNav month={month} basePath="/finances/depenses" />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {!expenses || expenses.length === 0 ? (
            <EmptyState title="Aucune dépense ce mois-ci" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                >
                  <div className={e.voided ? "text-slate-400" : ""}>
                    <p className={`font-medium ${e.voided ? "line-through" : ""}`}>
                      {e.expense_categories?.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(e.spent_on)} · {PAYMENT_METHODS[e.method]}
                      {e.description ? ` · ${e.description}` : ""}
                    </p>
                    {e.voided && <p className="text-sm text-danger">Annulée : {e.void_reason}</p>}
                    {e.receipt_path && urlOf.get(e.receipt_path) && (
                      <a
                        href={urlOf.get(e.receipt_path) ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex min-h-9 items-center gap-1 text-sm text-primary"
                      >
                        <ImageIcon className="size-4" aria-hidden /> Voir le reçu
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`tabular font-semibold ${e.voided ? "text-slate-400 line-through" : ""}`}
                    >
                      {formatFCFA(e.amount)}
                    </span>
                    {canManage && !e.voided && (
                      <VoidDialog
                        action={voidExpense}
                        idName="id"
                        id={e.id}
                        title="Annuler cette dépense ?"
                        description={`${e.expense_categories?.name}, ${formatFCFA(e.amount)} du ${formatDate(e.spent_on)}. Elle restera visible, barrée.`}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {canManage && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Nouvelle dépense" />
              <CardBody>
                <ExpenseForm
                  categories={(categories ?? []).filter((c) => c.is_active)}
                  today={todayISO()}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Ajouter une catégorie" />
              <CardBody>
                <ActionForm action={addCategory} className="flex items-end gap-2" resetOnSuccess>
                  <Field label="Nom" htmlFor="name" className="flex-1">
                    <Input id="name" name="name" required minLength={2} maxLength={60} />
                  </Field>
                  <ActionSubmit variant="secondary">Ajouter</ActionSubmit>
                </ActionForm>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
