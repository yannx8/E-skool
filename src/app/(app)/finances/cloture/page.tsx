import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/client";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { formatDate, formatFCFA, formatSignedFCFA, todayISO } from "@/lib/format";
import { getUserNames } from "@/lib/queries";
import { closeDay } from "../actions";
import { getCashPosition } from "../report-data";

export const metadata: Metadata = { title: "Clôture de caisse" };

// J7 / FR-F4: count the cash, record the difference, lock the day.
export default async function ClosingPage() {
  const user = await requirePermission("viewFinance");
  const today = todayISO();
  const supabase = await createClient();
  const [cash, { data: closings }, names] = await Promise.all([
    getCashPosition(today),
    supabase.from("cash_closings").select("*").order("closing_date", { ascending: false }).limit(60),
    getUserNames(),
  ]);
  const closedToday = closings?.some((c) => c.closing_date === today);
  const canManage = can(user.role, "manageFinance");

  return (
    <>
      <PageHeader title="Clôture de caisse" description="Comptez les espèces en fin de journée et comparez avec l'attendu." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title={`Aujourd'hui, ${formatDate(today)}`} />
          <CardBody className="space-y-4">
            {cash && (
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Fond de caisse</dt>
                  <dd className="tabular">{formatFCFA(cash.opening_cash)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Entrées espèces{cash.since ? ` depuis le ${formatDate(cash.since)}` : ""}</dt>
                  <dd className="tabular">+ {formatFCFA(cash.cash_in)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Sorties espèces</dt>
                  <dd className="tabular">- {formatFCFA(cash.cash_out)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold">
                  <dt>Attendu en caisse</dt>
                  <dd className="tabular">{formatFCFA(cash.expected_cash)}</dd>
                </div>
              </dl>
            )}
            {closedToday ? (
              <Alert tone="success" title="Journée déjà clôturée">
                Les paiements reçus maintenant doivent être datés de demain.
              </Alert>
            ) : canManage ? (
              <ActionForm action={closeDay} className="space-y-4">
                <input type="hidden" name="closing_date" value={today} />
                <Field label="Espèces comptées" htmlFor="counted_cash">
                  <MoneyInput name="counted_cash" id="counted_cash" required />
                </Field>
                <Field
                  label="Montant retiré de la caisse"
                  htmlFor="removed_cash"
                  hint="Versé à la banque ou remis au fondateur. Le reste devient le fond de caisse de demain."
                >
                  <MoneyInput name="removed_cash" id="removed_cash" defaultValue={0} />
                </Field>
                <Field label="Note" htmlFor="note">
                  <Input id="note" name="note" maxLength={300} />
                </Field>
                <Alert tone="warning">
                  Après la clôture, aucune opération datée d&apos;aujourd&apos;hui ou avant ne pourra être ajoutée ni annulée.
                </Alert>
                <ActionSubmit>
                  <Lock aria-hidden /> Clôturer la journée
                </ActionSubmit>
              </ActionForm>
            ) : null}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Historique des clôtures" />
          {!closings || closings.length === 0 ? (
            <EmptyState title="Aucune clôture" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th className="text-right">Attendu</Th>
                  <Th className="text-right">Compté</Th>
                  <Th className="text-right">Écart</Th>
                  <Th className="text-right">Retiré</Th>
                </tr>
              </thead>
              <tbody>
                {closings.map((c) => (
                  <tr key={c.id}>
                    <Td>
                      {formatDate(c.closing_date)}
                      <div className="text-sm text-slate-500">
                        {names.get(c.closed_by ?? "") ?? ""}
                        {c.note ? ` · ${c.note}` : ""}
                      </div>
                    </Td>
                    <Td className="tabular text-right">{formatFCFA(c.expected_cash)}</Td>
                    <Td className="tabular text-right">{formatFCFA(c.counted_cash)}</Td>
                    <Td className={`tabular text-right font-semibold ${c.difference === 0 ? "text-success" : "text-danger"}`}>
                      {formatSignedFCFA(c.difference ?? 0)}
                    </Td>
                    <Td className="tabular text-right">{formatFCFA(c.removed_cash)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
