import type { Metadata } from "next";
import { Lock, LockOpen } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, EmptyState, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/client";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { addMonths, currentMonthISO, formatDate, formatMonth, formatSignedFCFA } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/labels";
import { lockMonth, recordAdjustment } from "../actions";

export const metadata: Metadata = { title: "Mois et ajustements" };

// FR-F6: closed months are immutable; corrections are dated adjustments.
export default async function PeriodsPage() {
  const user = await requirePermission("viewFinance");
  const supabase = await createClient();
  const [{ data: locks }, { data: adjustments }] = await Promise.all([
    supabase.from("period_locks").select("month, locked_at"),
    supabase.from("adjustments").select("*").order("created_at", { ascending: false }).limit(50),
  ]);
  const locked = new Set((locks ?? []).map((l) => l.month));
  const current = currentMonthISO();
  const months = Array.from({ length: 12 }, (_, i) => addMonths(current, -(i + 1)));
  const canManage = can(user.role, "manageFinance");

  return (
    <>
      <PageHeader title="Mois et ajustements" description="Verrouillez un mois une fois vérifié avec le fondateur : il ne pourra plus être modifié." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Mois terminés" />
          <ul className="divide-y divide-slate-100">
            {months.map((m) => (
              <li key={m} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="font-medium capitalize">{formatMonth(m)}</span>
                {locked.has(m) ? (
                  <Badge tone="success" icon={<Lock aria-hidden />}>
                    Verrouillé
                  </Badge>
                ) : canManage ? (
                  <ConfirmForm
                    action={lockMonth}
                    fields={{ month: m }}
                    trigger={
                      <>
                        <LockOpen aria-hidden /> Verrouiller
                      </>
                    }
                    title={`Verrouiller ${formatMonth(m)} ?`}
                    description="C'est définitif. Plus aucune opération de ce mois ne pourra être ajoutée ni annulée ; les corrections passeront par un ajustement."
                    confirmLabel="Verrouiller le mois"
                  />
                ) : (
                  <Badge tone="muted">Ouvert</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          {canManage && (
            <Card>
              <CardHeader title="Nouvel ajustement" description="Corrige une erreur découverte sur un mois verrouillé. Il est daté d'aujourd'hui." />
              <CardBody>
                <ActionForm action={recordAdjustment} className="space-y-4" resetOnSuccess>
                  <Field label="Description" htmlFor="label">
                    <Input id="label" name="label" required minLength={3} maxLength={200} placeholder="Dépense de septembre saisie deux fois" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Sens" htmlFor="direction">
                      <Select id="direction" name="direction" defaultValue="in">
                        <option value="in">Entrée d&apos;argent (+)</option>
                        <option value="out">Sortie d&apos;argent (-)</option>
                      </Select>
                    </Field>
                    <Field label="Montant" htmlFor="amount">
                      <MoneyInput name="amount" id="amount" required />
                    </Field>
                    <Field label="Mode" htmlFor="method">
                      <Select id="method" name="method" defaultValue="cash">
                        {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Mois corrigé" htmlFor="refers_to_month">
                      <Input id="refers_to_month" name="refers_to_month" type="month" max={addMonths(current, -1).slice(0, 7)} />
                    </Field>
                  </div>
                  <ActionSubmit>Enregistrer l&apos;ajustement</ActionSubmit>
                </ActionForm>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title="Ajustements" />
            {!adjustments || adjustments.length === 0 ? (
              <EmptyState title="Aucun ajustement" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {adjustments.map((a) => (
                  <li key={a.id} className="flex justify-between gap-3 px-4 py-2.5">
                    <div>
                      <p className="font-medium">{a.label}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(a.adjusted_on)} · {PAYMENT_METHODS[a.method]}
                        {a.refers_to_month ? ` · corrige ${formatMonth(a.refers_to_month)}` : ""}
                      </p>
                    </div>
                    <span className={`tabular font-semibold ${a.amount > 0 ? "text-success" : "text-danger"}`}>{formatSignedFCFA(a.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Alert tone="info">Une clôture de caisse verrouille aussi tous les jours jusqu&apos;à sa date.</Alert>
        </div>
      </div>
    </>
  );
}
