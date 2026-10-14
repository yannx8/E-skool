import type { Metadata } from "next";
import { PrintToolbar } from "@/components/print-toolbar";
import { SchoolHeader } from "@/components/school-header";
import { Alert } from "@/components/ui/misc";
import { getSettings, requirePermission } from "@/lib/auth";
import { currentMonthISO, formatDateTime, formatMonth, parseMonthParam } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";
import { getMonthlyReport } from "@/app/(app)/finances/report-data";
import { ReportView } from "@/app/(app)/finances/report-view";

export const metadata: Metadata = { title: "Rapport mensuel" };

/** Generation time printed in the footer. */
function generatedAt() {
  return formatDateTime(new Date().toISOString());
}

export default async function PrintReportPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  await requirePermission("viewFinance");
  const month = parseMonthParam(param(sp, "mois"), currentMonthISO());
  const [settings, report] = await Promise.all([getSettings(), getMonthlyReport(month)]);
  return (
    <>
      <style>{`@media print { @page { size: A4 portrait; margin: 14mm; } }`}</style>
      <PrintToolbar backHref={`/finances/rapport?mois=${month.slice(0, 7)}`} backLabel="Rapport" />
      <article className="mx-auto w-full max-w-[210mm] bg-white p-8 text-slate-900 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <SchoolHeader settings={settings} />
        <h1 className="my-6 border-y border-slate-300 py-2 text-xl font-bold capitalize">
          Rapport financier : {formatMonth(month)}
        </h1>
        {report ? (
          <ReportView report={report} />
        ) : (
          <Alert tone="danger">Rapport indisponible.</Alert>
        )}
        <p className="mt-8 text-sm text-slate-500">Généré le {generatedAt()} depuis E-skool.</p>
      </article>
    </>
  );
}
