import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DefinitionList, EmptyState, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/client";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { ModuleOff } from "@/components/module-off";
import { getSettings, requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { formatDate, formatFCFA, formatMonth, todayISO } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { CONTRACT_TYPES } from "@/lib/labels";
import { isUuid, type IdParams } from "@/lib/params";
import { addSalaryChange, endContract, reactivateStaff, updateStaff } from "../actions";
import { StaffForm } from "../staff-form";

export const metadata: Metadata = { title: "Fiche personnel" };

export default async function StaffDetailPage({ params }: { params: IdParams }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const user = await requirePermission("viewHr");
  const settings = await getSettings();
  if (!settings.module_hr)
    return <ModuleOff name="Personnel" canEnable={can(user.role, "manageSetup")} />;
  const supabase = await createClient();
  const [{ data: staff }, { data: history }, { data: payroll }] = await Promise.all([
    supabase.from("staff").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("staff_salary_history")
      .select("*")
      .eq("staff_id", id)
      .order("effective_from", { ascending: false }),
    supabase
      .from("payroll_entries")
      .select("*")
      .eq("staff_id", id)
      .order("month", { ascending: false })
      .limit(24),
  ]);
  if (!staff) notFound();
  const canManage = can(user.role, "manageHr");
  const current = history?.find((h) => h.effective_from <= todayISO());

  return (
    <>
      <PageHeader
        title={staff.full_name}
        description={
          <>
            {staff.job_title} · {CONTRACT_TYPES[staff.contract]}
            {!staff.is_active && (
              <Badge tone="muted" className="ml-2">
                Parti le {formatDate(staff.end_date)}
              </Badge>
            )}
          </>
        }
        back={{ href: "/personnel", label: "Personnel" }}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Fiche" />
            <CardBody>
              {canManage ? (
                <StaffForm action={updateStaff} staff={staff} />
              ) : (
                <DefinitionList
                  items={[
                    { label: "Téléphone", value: formatPhone(staff.phone) },
                    { label: "Embauche", value: formatDate(staff.start_date) },
                    { label: "Notes", value: staff.notes },
                  ]}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Paies" />
            {!payroll || payroll.length === 0 ? (
              <EmptyState
                title="Aucune paie"
                description="Préparez la paie du mois dans Personnel > Paie du mois."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {payroll.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-medium capitalize">{formatMonth(p.month)}</p>
                      <p className="text-sm text-slate-500">
                        {p.status === "paid"
                          ? `Payé le ${formatDate(p.paid_at)} · ${p.payslip_number}`
                          : "En attente"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular font-semibold">{formatFCFA(p.net_amount)}</p>
                      {p.status === "paid" && (
                        <Link
                          href={`/bulletin/${p.id}`}
                          className="text-sm text-primary underline-offset-4 hover:underline"
                        >
                          Bulletin
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Salaire"
              description={
                current
                  ? `Actuel : ${formatFCFA(current.monthly_amount)} / mois`
                  : "Aucun salaire enregistré"
              }
            />
            <ul className="divide-y divide-slate-100">
              {(history ?? []).map((h) => (
                <li key={h.id} className="flex justify-between px-4 py-2.5">
                  <span>
                    Depuis le {formatDate(h.effective_from)}
                    {h.note && <span className="block text-sm text-slate-500">{h.note}</span>}
                  </span>
                  <span className="tabular font-semibold">{formatFCFA(h.monthly_amount)}</span>
                </li>
              ))}
            </ul>
            {canManage && (
              <CardBody className="border-t border-slate-100">
                <ActionForm action={addSalaryChange} className="space-y-3" resetOnSuccess>
                  <input type="hidden" name="staff_id" value={id} />
                  <p className="font-medium">Changement de salaire</p>
                  <Field label="Nouveau montant mensuel" htmlFor="monthly_amount">
                    <MoneyInput name="monthly_amount" id="monthly_amount" required />
                  </Field>
                  <Field label="À partir du" htmlFor="effective_from">
                    <Input
                      id="effective_from"
                      name="effective_from"
                      type="date"
                      required
                      defaultValue={todayISO()}
                    />
                  </Field>
                  <Field label="Motif" htmlFor="note">
                    <Input
                      id="note"
                      name="note"
                      maxLength={200}
                      placeholder="Augmentation annuelle"
                    />
                  </Field>
                  <ActionSubmit variant="secondary">Enregistrer</ActionSubmit>
                </ActionForm>
              </CardBody>
            )}
          </Card>

          {canManage && (
            <Card>
              <CardHeader title={staff.is_active ? "Fin de contrat" : "Réintégrer"} />
              <CardBody>
                {staff.is_active ? (
                  <ActionForm action={endContract} className="space-y-3">
                    <input type="hidden" name="id" value={id} />
                    <Field label="Date de fin" htmlFor="end_date">
                      <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        required
                        defaultValue={todayISO()}
                      />
                    </Field>
                    <ActionSubmit variant="destructive">Enregistrer le départ</ActionSubmit>
                  </ActionForm>
                ) : (
                  <form action={reactivateStaff}>
                    <input type="hidden" name="id" value={id} />
                    <Button type="submit" variant="secondary">
                      Réintégrer
                    </Button>
                  </form>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
