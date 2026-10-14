import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardBody, CardHeader, Stat } from "@/components/ui/card";
import { EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { MonthNav } from "@/components/month-nav";
import { getActiveYear, requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { currentMonthISO, formatDate, formatFCFA, formatSignedFCFA, parseMonthParam, todayISO } from "@/lib/format";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/labels";
import { param, type SearchParams } from "@/lib/params";
import { getCashPosition, getMonthlyReport, monthNet } from "./report-data";

export const metadata: Metadata = { title: "Finances" };

export default async function FinanceOverviewPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  await requirePermission("viewFinance");
  const month = parseMonthParam(param(sp, "mois"), currentMonthISO());
  const year = await getActiveYear();
  const supabase = await createClient();
  const [report, cash, { data: closings }, { data: stats }] = await Promise.all([
    getMonthlyReport(month),
    getCashPosition(todayISO()),
    supabase.from("cash_closings").select("*").order("closing_date", { ascending: false }).limit(5),
    year ? supabase.rpc("dashboard_stats", { p_school_year_id: year.id }) : Promise.resolve({ data: null }),
  ]);
  const s = stats as { due: number; applied: number; remaining: number } | null;

  return (
    <>
      <PageHeader
        title="Finances"
        actions={
          <>
            <MonthNav month={month} basePath="/finances" />
            <LinkButton href={`/finances/rapport?mois=${month.slice(0, 7)}`} variant="secondary">
              <FileText aria-hidden /> Rapport
            </LinkButton>
          </>
        }
      />

      {report && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Frais encaissés" value={formatFCFA(report.fees_total)} tone="success" hint={`${report.payments_count} paiements`} />
          <Stat label="Autres revenus" value={formatFCFA(report.other_income_total)} />
          <Stat label="Dépenses et salaires" value={formatFCFA(report.expenses_total + report.payroll_total)} tone="warning" />
          <Stat label="Solde du mois" value={formatSignedFCFA(monthNet(report))} tone={monthNet(report) >= 0 ? "success" : "danger"} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Caisse (espèces)" description="Ce qui devrait être dans la caisse ce soir." />
          <CardBody>
            {cash ? (
              <dl className="space-y-2">
                <Line label={cash.since ? `Fond de caisse au ${formatDate(cash.since)}` : "Fond de caisse initial"} value={formatFCFA(cash.opening_cash)} />
                <Line label="Entrées en espèces" value={`+ ${formatFCFA(cash.cash_in)}`} />
                <Line label="Sorties en espèces" value={`- ${formatFCFA(cash.cash_out)}`} />
                <Line label="Attendu en caisse" value={formatFCFA(cash.expected_cash)} strong />
              </dl>
            ) : (
              <p className="text-slate-500">Indisponible.</p>
            )}
            <LinkButton href="/finances/cloture" variant="secondary" className="mt-4">
              Clôturer la caisse
            </LinkButton>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={`Scolarité ${year?.label ?? ""}`} description="Recouvrement sur l'année scolaire." />
          <CardBody>
            {s ? (
              <dl className="space-y-2">
                <Line label="Attendu" value={formatFCFA(s.due)} />
                <Line label="Payé" value={formatFCFA(s.applied)} />
                <Line label="Reste à recouvrer" value={formatFCFA(s.remaining)} strong />
              </dl>
            ) : (
              <p className="text-slate-500">Aucune année scolaire.</p>
            )}
            <LinkButton href="/impayes" variant="secondary" className="mt-4">
              Voir les impayés
            </LinkButton>
          </CardBody>
        </Card>

        {report && Object.keys(report.in_by_method).length > 0 && (
          <Card>
            <CardHeader title="Mouvements du mois par mode" />
            <Table>
              <thead>
                <tr>
                  <Th>Mode</Th>
                  <Th className="text-right">Entrées</Th>
                  <Th className="text-right">Sorties</Th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report.in_by_method).map(([m, v]) => (
                  <tr key={m}>
                    <Td>{PAYMENT_METHODS[m as PaymentMethod] ?? m}</Td>
                    <Td className="tabular text-right">{formatFCFA(v.in)}</Td>
                    <Td className="tabular text-right">{formatFCFA(v.out)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}

        <Card>
          <CardHeader
            title="Dernières clôtures"
            actions={
              <Link href="/finances/cloture" className="inline-flex min-h-11 items-center text-sm font-medium text-primary">
                Tout voir
              </Link>
            }
          />
          {!closings || closings.length === 0 ? (
            <EmptyState title="Aucune clôture" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {closings.map((c) => (
                <li key={c.id} className="flex justify-between px-4 py-2.5">
                  <span>{formatDate(c.closing_date)}</span>
                  <span className={`tabular font-semibold ${c.difference === 0 ? "text-success" : "text-danger"}`}>
                    {c.difference === 0 ? "Sans écart" : `Écart ${formatSignedFCFA(c.difference ?? 0)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-slate-200 pt-2 text-lg font-bold" : ""}`}>
      <dt className={strong ? "" : "text-slate-600"}>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}
