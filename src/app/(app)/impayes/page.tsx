import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Download, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { Checkbox, Label } from "@/components/ui/form";
import { AutoSubmitSelect } from "@/components/ui/client";
import { buttonClasses } from "@/components/ui/button";
import { NoYear } from "@/components/no-year";
import { ReminderButton } from "@/components/reminder-button";
import { getActiveYear, getSettings, requireUser } from "@/lib/auth";
import { getClasses } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { formatDate, formatFCFA, formatRelativeDay, fullName } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { termName } from "@/lib/labels";
import { qs, type SearchParams } from "@/lib/params";
import { reminderHref } from "@/lib/reminder-server";
import { loadUnpaid, readUnpaidFilters } from "./data";

export const metadata: Metadata = { title: "Impayés" };

export default async function UnpaidPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [settings, year, classes] = await Promise.all([
    getSettings(),
    getActiveYear(),
    getClasses(),
  ]);
  if (!year) return <NoYear canSetup={can(user.role, "manageSetup")} />;

  const f = readUnpaidFilters(sp);
  const rows = await loadUnpaid(year.id, f);
  const total = rows.reduce((s, r) => s + r.remaining, 0);
  const canRemind = can(user.role, "sendReminders");
  const canPay = can(user.role, "recordPayment");
  const filterQs = { tranche: f.term, classe: f.classId, partis: f.includeLeft ? "1" : "" };
  const periodLabel =
    f.term === ""
      ? "Échéances passées"
      : f.term === "unique"
        ? "Frais uniques"
        : termName(Number(f.term), settings.term_label);

  return (
    <>
      <PageHeader
        title="Impayés"
        description={`${periodLabel} · ${rows.length} élève${rows.length > 1 ? "s" : ""} · ${formatFCFA(total)} à recouvrer`}
        actions={
          <a href={`/api/export/impayes${qs(filterQs)}`} className={buttonClasses("secondary")}>
            <Download aria-hidden /> Exporter
          </a>
        }
      />

      <form method="get" className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <Label htmlFor="tranche">Période</Label>
          <AutoSubmitSelect id="tranche" name="tranche" defaultValue={f.term}>
            <option value="">Échéances passées</option>
            {Array.from({ length: settings.terms_count }, (_, i) => i + 1).map((t) => (
              <option key={t} value={t}>
                {termName(t, settings.term_label)}
              </option>
            ))}
            <option value="unique">Frais uniques</option>
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
        <div className="col-span-2 flex items-end gap-3">
          <Checkbox
            name="partis"
            value="1"
            defaultChecked={f.includeLeft}
            label="Inclure les élèves partis"
          />
          <button type="submit" className={buttonClasses("secondary", "sm", "mb-1")}>
            Appliquer
          </button>
        </div>
      </form>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 aria-hidden className="text-success" />}
            title="Tout est à jour"
            description="Aucun impayé pour ces critères."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Élève</Th>
                    <Th>Parent</Th>
                    <Th className="text-right">Reste à payer</Th>
                    <Th>Situation</Th>
                    <Th>Dernière relance</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.pupil_id}-${r.term}`} className="hover:bg-slate-50">
                      <Td>
                        <Link
                          href={`/eleves/${r.pupil_id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {fullName(r)}
                        </Link>
                        <div className="text-sm text-slate-500">
                          {r.class_name} · échéance {formatDate(r.due_date)}
                        </div>
                      </Td>
                      <Td>
                        {r.parent_name}
                        <div className="text-sm text-slate-500">
                          {r.parent_phone ? formatPhone(r.parent_phone) : "Pas de téléphone"}
                        </div>
                      </Td>
                      <Td className="tabular text-right font-semibold">
                        {formatFCFA(r.remaining)}
                      </Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                      <Td className="text-sm">
                        {r.last_reminded_at ? (
                          `Relancé ${formatRelativeDay(r.last_reminded_at)}`
                        ) : (
                          <span className="text-slate-400">Jamais</span>
                        )}
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          {canRemind && r.parent_phone && (
                            <ReminderButton
                              href={reminderHref(settings, { ...r, parent_phone: r.parent_phone })}
                              pupilId={r.pupil_id}
                              term={r.term}
                              amountDue={r.remaining}
                            />
                          )}
                          {canPay && (
                            <Link
                              href={`/paiements/nouveau?eleve=${r.pupil_id}`}
                              className={buttonClasses("secondary", "sm")}
                            >
                              <Wallet aria-hidden /> Encaisser
                            </Link>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map((r) => (
                <li key={`${r.pupil_id}-${r.term}`} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/eleves/${r.pupil_id}`} className="min-w-0">
                      <p className="truncate font-medium">{fullName(r)}</p>
                      <p className="truncate text-sm text-slate-500">
                        {r.class_name}
                        {r.parent_name ? ` · ${r.parent_name}` : ""}
                      </p>
                    </Link>
                    <div className="shrink-0 text-right">
                      <p className="tabular font-semibold">{formatFCFA(r.remaining)}</p>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-500">
                      {r.last_reminded_at
                        ? `Relancé ${formatRelativeDay(r.last_reminded_at)}`
                        : "Jamais relancé"}
                    </span>
                    <div className="flex gap-2">
                      {canPay && (
                        <Link
                          href={`/paiements/nouveau?eleve=${r.pupil_id}`}
                          className={buttonClasses("secondary", "sm")}
                        >
                          Encaisser
                        </Link>
                      )}
                      {canRemind && r.parent_phone && (
                        <ReminderButton
                          href={reminderHref(settings, { ...r, parent_phone: r.parent_phone })}
                          pupilId={r.pupil_id}
                          term={r.term}
                          amountDue={r.remaining}
                        />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
