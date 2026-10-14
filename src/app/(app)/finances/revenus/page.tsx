import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Field, Input, Select } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/client";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { MonthNav } from "@/components/month-nav";
import { VoidDialog } from "@/components/void-dialog";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { addMonths, currentMonthISO, formatDate, formatFCFA, parseMonthParam, todayISO } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/labels";
import { param, type SearchParams } from "@/lib/params";
import { recordIncome, voidIncome } from "../actions";

export const metadata: Metadata = { title: "Autres revenus" };

export default async function IncomePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await requirePermission("viewFinance");
  const month = parseMonthParam(param(sp, "mois"), currentMonthISO());
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("other_income")
    .select("*")
    .gte("received_on", month)
    .lt("received_on", addMonths(month, 1))
    .order("received_on", { ascending: false });
  const total = (rows ?? []).filter((r) => !r.voided).reduce((s, r) => s + r.amount, 0);
  const canManage = can(user.role, "manageFinance");
  const today = todayISO();

  return (
    <>
      <PageHeader
        title="Autres revenus"
        description={`Dons, location de salle, vente de tenues… Total du mois : ${formatFCFA(total)}`}
        actions={<MonthNav month={month} basePath="/finances/revenus" />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {!rows || rows.length === 0 ? (
            <EmptyState title="Aucun revenu ce mois-ci" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <div className={r.voided ? "text-slate-400" : ""}>
                    <p className={`font-medium ${r.voided ? "line-through" : ""}`}>{r.label}</p>
                    <p className="text-sm text-slate-500">
                      {formatDate(r.received_on)} · {PAYMENT_METHODS[r.method]}
                      {r.description ? ` · ${r.description}` : ""}
                    </p>
                    {r.voided && <p className="text-sm text-danger">Annulé : {r.void_reason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`tabular font-semibold ${r.voided ? "text-slate-400 line-through" : ""}`}>{formatFCFA(r.amount)}</span>
                    {canManage && !r.voided && (
                      <VoidDialog
                        action={voidIncome}
                        idName="id"
                        id={r.id}
                        title="Annuler ce revenu ?"
                        description={`${r.label}, ${formatFCFA(r.amount)}. Il restera visible, barré.`}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {canManage && (
          <Card>
            <CardHeader title="Nouveau revenu" />
            <CardBody>
              <ActionForm action={recordIncome} className="space-y-4" resetOnSuccess>
                <Field label="Origine" htmlFor="label">
                  <Input id="label" name="label" required maxLength={120} placeholder="Don de l'APE" />
                </Field>
                <Field label="Montant" htmlFor="amount">
                  <MoneyInput name="amount" id="amount" required />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mode" htmlFor="method">
                    <Select id="method" name="method" defaultValue="cash">
                      {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Date" htmlFor="received_on">
                    <Input id="received_on" name="received_on" type="date" defaultValue={today} max={today} required />
                  </Field>
                </div>
                <Field label="Détails" htmlFor="description">
                  <Input id="description" name="description" maxLength={300} />
                </Field>
                <ActionSubmit>Enregistrer</ActionSubmit>
              </ActionForm>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
