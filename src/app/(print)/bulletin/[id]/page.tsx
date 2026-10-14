import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/print-toolbar";
import { SchoolHeader } from "@/components/school-header";
import { getSettings, requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { amountToFrenchWords } from "@/lib/french-words";
import { formatDate, formatFCFA, formatMonth } from "@/lib/format";
import { CONTRACT_TYPES, PAYMENT_METHODS } from "@/lib/labels";
import { isUuid, type IdParams } from "@/lib/params";

export const metadata: Metadata = { title: "Bulletin de paie" };

// FR-H4: printable payslip. Statutory contributions are intentionally absent.
export default async function PayslipPage({ params }: { params: IdParams }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  await requirePermission("viewHr");
  const settings = await getSettings();
  const supabase = await createClient();
  const { data: e } = await supabase
    .from("payroll_entries")
    .select("*, staff(full_name, job_title, contract, start_date)")
    .eq("id", id)
    .maybeSingle();
  if (!e || !e.staff || e.status !== "paid") notFound();

  const rows: [string, number, "plus" | "minus"][] = [
    ["Salaire de base", e.base_amount, "plus"],
    ["Primes", e.bonuses, "plus"],
    ["Avances déjà versées", e.advances, "minus"],
    ["Retenues", e.deductions, "minus"],
  ];

  return (
    <>
      <style>{`@media print { @page { size: A5 portrait; margin: 10mm; } }`}</style>
      <PrintToolbar backHref={`/personnel/paie?mois=${e.month.slice(0, 7)}`} backLabel="Paie" />
      <article className="mx-auto w-full max-w-[148mm] bg-white p-6 text-slate-900 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <SchoolHeader settings={settings} />
        <div className="my-4 flex items-baseline justify-between border-y border-slate-300 py-2">
          <h1 className="text-lg font-bold uppercase">Bulletin de paie</h1>
          <p className="font-mono font-semibold">N° {e.payslip_number}</p>
        </div>
        <dl className="mb-4 space-y-1.5">
          <Row label="Nom" value={e.staff.full_name} />
          <Row label="Fonction" value={e.staff.job_title} />
          <Row label="Contrat" value={CONTRACT_TYPES[e.staff.contract]} />
          <Row label="Période" value={formatMonth(e.month)} />
        </dl>
        <table className="w-full text-[15px]">
          <tbody>
            {rows.map(([label, amount, sign]) => (
              <tr key={label} className="border-b border-dotted border-slate-200">
                <td className="py-1.5">{label}</td>
                <td className="tabular py-1.5 text-right">
                  {sign === "minus" && amount > 0 ? "- " : ""}
                  {formatFCFA(amount)}
                </td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="pt-3 text-lg">Net payé</td>
              <td className="tabular pt-3 text-right text-lg">{formatFCFA(e.net_amount)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1 text-sm italic">{amountToFrenchWords(e.net_amount ?? 0)}</p>
        <p className="mt-3 text-sm">
          Payé le {formatDate(e.paid_at)} par {e.method ? PAYMENT_METHODS[e.method] : "-"}
        </p>
        {e.notes && <p className="mt-1 text-sm text-slate-600">Note : {e.notes}</p>}
        <div className="mt-10 flex justify-between text-center text-sm">
          <div>
            <div className="mb-1 h-12 w-40 border-b border-slate-400" />
            L&apos;employé(e)
          </div>
          <div>
            <div className="mb-1 h-12 w-40 border-b border-slate-400" />
            La direction
          </div>
        </div>
      </article>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dotted border-slate-200 pb-1">
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-right font-semibold capitalize">{value}</dd>
    </div>
  );
}
