import { formatFCFA, formatMonth, formatSignedFCFA } from "@/lib/format";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/labels";
import { monthNet, type MonthlyReport } from "./report-data";

/** FR-F5: monthly summary, shared by the screen and the printable version. */
export function ReportView({ report }: { report: MonthlyReport }) {
  const totalIn = report.fees_total + report.other_income_total + Math.max(report.adjustments_total, 0);
  const totalOut = report.expenses_total + report.payroll_total + Math.max(-report.adjustments_total, 0);
  return (
    <div className="space-y-6 text-[15px]">
      <p className="text-slate-600">
        Rapport de <strong className="capitalize">{formatMonth(report.month)}</strong>
        {report.locked ? " (mois verrouillé, chiffres définitifs)" : " (mois ouvert, chiffres provisoires)"}.
      </p>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Synthèse</h2>
        <table className="w-full">
          <tbody>
            <Row label="Frais de scolarité encaissés" value={formatFCFA(report.fees_total)} />
            <Row label="Autres revenus" value={formatFCFA(report.other_income_total)} />
            <Row label="Dépenses" value={`- ${formatFCFA(report.expenses_total)}`} />
            <Row label="Salaires payés" value={`- ${formatFCFA(report.payroll_total)}`} />
            {report.adjustments_total !== 0 && <Row label="Ajustements" value={formatSignedFCFA(report.adjustments_total)} />}
            <Row label="Solde du mois" value={formatSignedFCFA(monthNet(report))} strong />
          </tbody>
        </table>
        <p className="mt-1 text-sm text-slate-500">
          Entrées {formatFCFA(totalIn)} · Sorties {formatFCFA(totalOut)}
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 text-lg font-semibold">Encaissements par classe</h2>
          {report.fees_by_class.length === 0 ? (
            <p className="text-slate-500">Aucun paiement.</p>
          ) : (
            <table className="w-full">
              <tbody>
                {report.fees_by_class.map((c) => (
                  <Row key={c.class_name} label={c.class_name} value={formatFCFA(c.total)} />
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">Dépenses par catégorie</h2>
          {report.expenses_by_category.length === 0 ? (
            <p className="text-slate-500">Aucune dépense.</p>
          ) : (
            <table className="w-full">
              <tbody>
                {report.expenses_by_category.map((c) => (
                  <Row key={c.category} label={c.category} value={formatFCFA(c.total)} />
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">Par mode de paiement</h2>
          <table className="w-full">
            <tbody>
              {Object.entries(report.in_by_method).map(([m, v]) => (
                <Row key={m} label={PAYMENT_METHODS[m as PaymentMethod] ?? m} value={`+${formatFCFA(v.in)} / -${formatFCFA(v.out)}`} />
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">Caisse</h2>
          <table className="w-full">
            <tbody>
              <Row label="Clôtures effectuées" value={String(report.closings_count)} />
              <Row label="Total des écarts" value={formatSignedFCFA(report.closings_difference)} />
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr className={strong ? "font-bold" : "border-b border-dotted border-slate-200"}>
      <td className={strong ? "pt-2 text-lg" : "py-1.5"}>{label}</td>
      <td className={`tabular text-right ${strong ? "pt-2 text-lg" : "py-1.5"}`}>{value}</td>
    </tr>
  );
}
