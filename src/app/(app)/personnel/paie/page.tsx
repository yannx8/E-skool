import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { Card, CardBody, Stat } from "@/components/ui/card";
import { Alert, EmptyState, PageHeader } from "@/components/ui/misc";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { ModuleOff } from "@/components/module-off";
import { MonthNav } from "@/components/month-nav";
import { getSettings, requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { currentMonthISO, formatFCFA, formatMonth, parseMonthParam, todayISO } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";
import type { PaymentMethod } from "@/lib/labels";
import { preparePayroll } from "../actions";
import { PayrollRowCard, type PayrollRow } from "./payroll-row";

export const metadata: Metadata = { title: "Paie" };

export default async function PayrollPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await requirePermission("viewHr");
  const settings = await getSettings();
  if (!settings.module_hr)
    return <ModuleOff name="Personnel" canEnable={can(user.role, "manageSetup")} />;

  const month = parseMonthParam(param(sp, "mois"), currentMonthISO());
  const supabase = await createClient();
  const { data } = await supabase
    .from("payroll_entries")
    .select("*, staff(full_name, job_title)")
    .eq("month", month)
    .order("created_at");
  const rows: PayrollRow[] = (data ?? [])
    .map((e) => ({
      id: e.id,
      staff_name: e.staff?.full_name ?? "",
      job_title: e.staff?.job_title ?? "",
      base_amount: e.base_amount,
      advances: e.advances,
      deductions: e.deductions,
      bonuses: e.bonuses,
      net_amount: e.net_amount ?? 0,
      status: e.status,
      method: e.method as PaymentMethod | null,
      paid_at: e.paid_at,
      payslip_number: e.payslip_number,
      notes: e.notes,
    }))
    .sort((a, b) => a.staff_name.localeCompare(b.staff_name, "fr"));

  const total = rows.reduce((s, r) => s + r.net_amount, 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.net_amount, 0);
  const canManage = can(user.role, "manageHr");

  return (
    <>
      <PageHeader
        title="Paie du personnel"
        back={{ href: "/personnel", label: "Personnel" }}
        actions={<MonthNav month={month} basePath="/personnel/paie" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Total net du mois" value={formatFCFA(total)} />
        <Stat label="Déjà payé" value={formatFCFA(paid)} tone="success" />
        <Stat
          label="Reste à payer"
          value={formatFCFA(total - paid)}
          tone={total - paid > 0 ? "warning" : "default"}
        />
      </div>

      {canManage && (
        <Card className="mb-6">
          <CardBody>
            <ActionForm action={preparePayroll} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="month" value={month} />
              <p className="text-slate-700">
                Crée une ligne pour chaque membre actif du personnel avec son salaire de{" "}
                {formatMonth(month)}. Les lignes existantes sont conservées.
              </p>
              <ActionSubmit>
                <CalendarCheck aria-hidden /> Préparer la paie
              </ActionSubmit>
            </ActionForm>
          </CardBody>
        </Card>
      )}

      <Alert tone="info" className="mb-4">
        Une avance remise en espèces pendant le mois s&apos;enregistre comme dépense « Avances sur
        salaire », puis se déduit ici dans « Avances déjà versées ». Les cotisations sociales et
        impôts ne sont pas calculés : voyez-les avec le comptable.
      </Alert>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="Aucune ligne de paie pour ce mois"
            description={canManage ? "Cliquez sur « Préparer la paie »." : undefined}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <PayrollRowCard key={r.id} row={r} canManage={canManage} today={todayISO()} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
