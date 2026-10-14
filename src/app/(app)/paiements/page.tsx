import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Pagination, Table, Td, Th } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/form";
import { AutoSubmitSelect } from "@/components/ui/client";
import { buttonClasses, LinkButton } from "@/components/ui/button";
import { NoYear } from "@/components/no-year";
import { getActiveYear, getSettings, requireUser } from "@/lib/auth";
import { getClasses } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { formatDate, formatFCFA, fullName } from "@/lib/format";
import { feeLineName, PAYMENT_METHODS } from "@/lib/labels";
import { pageParam, qs, type SearchParams } from "@/lib/params";
import { allPayments, paymentsQuery, readPaymentFilters } from "./filters";

export const metadata: Metadata = { title: "Paiements" };

const PAGE_SIZE = 50;

type Row = {
  id: string;
  receipt_number: string;
  amount: number;
  method: keyof typeof PAYMENT_METHODS;
  fee: "tuition" | "registration" | "uniform" | "books" | "exam" | "other";
  term: number | null;
  paid_at: string;
  reference: string | null;
  voided: boolean;
  pupil_id: string;
  pupils: { last_name: string; first_name: string } | null;
};

export default async function PaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [settings, year, classes] = await Promise.all([getSettings(), getActiveYear(), getClasses()]);
  if (!year) return <NoYear canSetup={can(user.role, "manageSetup")} />;

  const f = readPaymentFilters(sp);
  const page = pageParam(sp);
  const build = await paymentsQuery(
    year.id,
    f,
    "id, receipt_number, amount, method, fee, term, paid_at, reference, voided, pupil_id, pupils(last_name, first_name)",
    true,
  );
  const [{ data, count }, totalRows] = await Promise.all([
    build().range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    allPayments<{ amount: number; voided: boolean }>(year.id, f, "amount, voided"),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const total = totalRows.filter((r) => !r.voided).reduce((s, r) => s + r.amount, 0);

  const filterQs = { du: f.from, au: f.to, mode: f.method, classe: f.classId, statut: f.status === "valid" ? "" : f.status };

  return (
    <>
      <PageHeader
        title="Paiements"
        description={`Historique de l'année ${year.label}`}
        actions={
          <>
            <a href={`/api/export/paiements${qs(filterQs)}`} className={buttonClasses("secondary")}>
              <Download aria-hidden /> Exporter
            </a>
            {can(user.role, "recordPayment") && (
              <LinkButton href="/paiements/nouveau">
                <Plus aria-hidden /> Nouveau paiement
              </LinkButton>
            )}
          </>
        }
      />

      <form method="get" className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div>
          <Label htmlFor="du">Du</Label>
          <Input id="du" name="du" type="date" defaultValue={f.from} />
        </div>
        <div>
          <Label htmlFor="au">Au</Label>
          <Input id="au" name="au" type="date" defaultValue={f.to} />
        </div>
        <div>
          <Label htmlFor="mode">Mode</Label>
          <AutoSubmitSelect id="mode" name="mode" defaultValue={f.method}>
            <option value="">Tous</option>
            {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <Label htmlFor="classe">Classe</Label>
          <AutoSubmitSelect id="classe" name="classe" defaultValue={f.classId}>
            <option value="">Toutes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <Label htmlFor="statut">Statut</Label>
          <AutoSubmitSelect id="statut" name="statut" defaultValue={f.status === "valid" ? "" : f.status}>
            <option value="">Valides</option>
            <option value="voided">Annulés</option>
            <option value="all">Tous</option>
          </AutoSubmitSelect>
        </div>
        <div className="col-span-2 flex gap-2 md:col-span-5">
          <button type="submit" className={buttonClasses("secondary", "sm")}>
            Filtrer
          </button>
          <Link href="/paiements" className={buttonClasses("ghost", "sm")}>
            Réinitialiser
          </Link>
          <p className="ml-auto self-center text-sm text-slate-600">
            {count ?? 0} paiement{(count ?? 0) > 1 ? "s" : ""} · Total valide <strong className="tabular">{formatFCFA(total)}</strong>
          </p>
        </div>
      </form>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="Aucun paiement" description="Aucun paiement ne correspond à ces filtres." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Reçu</Th>
                    <Th>Date</Th>
                    <Th>Élève</Th>
                    <Th>Objet</Th>
                    <Th>Mode</Th>
                    <Th className="text-right">Montant</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className={p.voided ? "text-slate-400" : "hover:bg-slate-50"}>
                      <Td>
                        <Link href={`/recu/${p.id}`} className="font-mono text-primary underline-offset-4 hover:underline">
                          {p.receipt_number}
                        </Link>
                        {p.voided && (
                          <Badge tone="danger" className="ml-2">
                            Annulé
                          </Badge>
                        )}
                      </Td>
                      <Td>{formatDate(p.paid_at)}</Td>
                      <Td>
                        <Link href={`/eleves/${p.pupil_id}`} className={p.voided ? "line-through" : "hover:underline"}>
                          {p.pupils ? fullName(p.pupils) : "-"}
                        </Link>
                      </Td>
                      <Td>{feeLineName(p.fee, p.term, settings.term_label)}</Td>
                      <Td>
                        {PAYMENT_METHODS[p.method]}
                        {p.reference && <div className="text-sm text-slate-500">{p.reference}</div>}
                      </Td>
                      <Td className={`tabular text-right font-semibold ${p.voided ? "line-through" : ""}`}>{formatFCFA(p.amount)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map((p) => (
                <li key={p.id}>
                  <Link href={`/recu/${p.id}`} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className={`truncate font-medium ${p.voided ? "text-slate-400 line-through" : ""}`}>
                        {p.pupils ? fullName(p.pupils) : "-"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(p.paid_at)} · {PAYMENT_METHODS[p.method]} · {p.receipt_number}
                      </p>
                      <p className="text-sm text-slate-500">{feeLineName(p.fee, p.term, settings.term_label)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`tabular font-semibold ${p.voided ? "text-slate-400 line-through" : ""}`}>{formatFCFA(p.amount)}</p>
                      {p.voided && <Badge tone="danger">Annulé</Badge>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={count ?? 0}
              hrefFor={(n) => `/paiements${qs({ ...filterQs, page: n })}`}
            />
          </>
        )}
      </Card>
    </>
  );
}
