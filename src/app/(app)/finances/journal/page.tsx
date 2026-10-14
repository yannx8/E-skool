import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { Input, Label } from "@/components/ui/form";
import { AutoSubmitSelect } from "@/components/ui/client";
import { buttonClasses } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/fetch-all";
import { currentMonthISO, formatDate, formatFCFA, parseDateParam, todayISO } from "@/lib/format";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/labels";
import { param, type SearchParams } from "@/lib/params";

export const metadata: Metadata = { title: "Journal de caisse" };

const SOURCES: Record<string, string> = {
  payment: "Scolarité",
  other_income: "Revenu",
  expense: "Dépense",
  payroll: "Salaire",
  adjustment: "Ajustement",
};

type Entry = {
  source: string;
  source_id: string;
  entry_date: string;
  method: PaymentMethod;
  amount_in: number;
  amount_out: number;
  label: string;
  created_at: string;
};

function runningTotals(entries: Entry[]): number[] {
  const out: number[] = [];
  let total = 0;
  for (const e of entries) {
    total += e.amount_in - e.amount_out;
    out.push(total);
  }
  return out;
}

// FR-F3: every movement of money between two dates, by payment method.
export default async function CashBookPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  await requirePermission("viewFinance");
  const from = parseDateParam(param(sp, "du"), currentMonthISO());
  const to = parseDateParam(param(sp, "au"), todayISO());
  const method = param(sp, "mode") in PAYMENT_METHODS ? (param(sp, "mode") as PaymentMethod) : "";
  const supabase = await createClient();
  const entries = await fetchAll<Entry>((a, b) => {
    let q = supabase
      .from("cash_book")
      .select("*")
      .gte("entry_date", from)
      .lte("entry_date", to)
      .order("entry_date")
      .order("created_at")
      .order("source_id");
    if (method) q = q.eq("method", method);
    return q.range(a, b) as unknown as PromiseLike<{ data: Entry[] | null; error: null }>;
  });
  const totalIn = entries.reduce((s, e) => s + e.amount_in, 0);
  const totalOut = entries.reduce((s, e) => s + e.amount_out, 0);
  const cumulative = runningTotals(entries);

  return (
    <>
      <PageHeader title="Journal de caisse" description={`Du ${formatDate(from)} au ${formatDate(to)}`} />
      <form method="get" className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <Label htmlFor="du">Du</Label>
          <Input id="du" name="du" type="date" defaultValue={from} />
        </div>
        <div>
          <Label htmlFor="au">Au</Label>
          <Input id="au" name="au" type="date" defaultValue={to} />
        </div>
        <div>
          <Label htmlFor="mode">Mode</Label>
          <AutoSubmitSelect id="mode" name="mode" defaultValue={method}>
            <option value="">Tous</option>
            {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div className="flex items-end">
          <button type="submit" className={buttonClasses("secondary")}>
            Afficher
          </button>
        </div>
      </form>

      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-success-soft p-3">
          <p className="text-sm text-success">Entrées</p>
          <p className="tabular font-bold text-success">{formatFCFA(totalIn)}</p>
        </div>
        <div className="rounded-lg bg-warning-soft p-3">
          <p className="text-sm text-warning">Sorties</p>
          <p className="tabular font-bold text-warning">{formatFCFA(totalOut)}</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-3">
          <p className="text-sm text-slate-600">Solde de la période</p>
          <p className="tabular font-bold">{formatFCFA(totalIn - totalOut)}</p>
        </div>
      </div>

      <Card>
        {entries.length === 0 ? (
          <EmptyState title="Aucun mouvement sur cette période" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Libellé</Th>
                <Th>Mode</Th>
                <Th className="text-right">Entrée</Th>
                <Th className="text-right">Sortie</Th>
                <Th className="text-right">Cumul</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                  <tr key={`${e.source}-${e.source_id}`}>
                    <Td className="whitespace-nowrap">{formatDate(e.entry_date)}</Td>
                    <Td>
                      <span className="text-sm text-slate-500">{SOURCES[e.source] ?? e.source} · </span>
                      {e.label}
                    </Td>
                    <Td>{PAYMENT_METHODS[e.method]}</Td>
                    <Td className="tabular text-right text-success">{e.amount_in ? formatFCFA(e.amount_in) : ""}</Td>
                    <Td className="tabular text-right text-warning">{e.amount_out ? formatFCFA(e.amount_out) : ""}</Td>
                    <Td className="tabular text-right font-medium">{formatFCFA(cumulative[i])}</Td>
                  </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
