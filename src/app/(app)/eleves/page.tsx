import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Download, FileUp, Plus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/form";
import { AutoSubmitSelect } from "@/components/ui/client";
import { buttonClasses, LinkButton } from "@/components/ui/button";
import { NoYear } from "@/components/no-year";
import { getActiveYear, requireUser } from "@/lib/auth";
import { getClasses } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { formatFCFA, fullName } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { BALANCE_STATUSES } from "@/lib/labels";
import { qs, type SearchParams } from "@/lib/params";
import { loadPupils, readPupilFilters } from "./data";

export const metadata: Metadata = { title: "Élèves" };

export default async function PupilsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [year, classes] = await Promise.all([getActiveYear(), getClasses()]);
  if (!year) return <NoYear canSetup={can(user.role, "manageSetup")} />;

  const f = readPupilFilters(sp);
  const rows = await loadPupils(year.id, f);
  const filterQs = { q: f.q, classe: f.classId, statut: f.status, etat: f.state === "actifs" ? "" : f.state };
  const totalRemaining = rows.reduce((s, r) => s + r.remaining, 0);
  const canEdit = can(user.role, "editPupils");

  return (
    <>
      <PageHeader
        title="Élèves"
        description={`${rows.length} élève${rows.length > 1 ? "s" : ""} · ${year.label}`}
        actions={
          <>
            <a href={`/api/export/eleves${qs(filterQs)}`} className={buttonClasses("secondary")}>
              <Download aria-hidden /> Exporter
            </a>
            {can(user.role, "importPupils") && (
              <LinkButton href="/eleves/importer" variant="secondary">
                <FileUp aria-hidden /> Importer
              </LinkButton>
            )}
            {can(user.role, "promotePupils") && (
              <LinkButton href="/eleves/promouvoir" variant="secondary">
                <ArrowUpRight aria-hidden /> Passage de classe
              </LinkButton>
            )}
            {canEdit && (
              <LinkButton href="/eleves/nouveau">
                <Plus aria-hidden /> Ajouter un élève
              </LinkButton>
            )}
          </>
        }
      />

      <form method="get" className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Label htmlFor="q">Rechercher</Label>
          <Input id="q" name="q" type="search" defaultValue={f.q} placeholder="Nom, parent, téléphone" />
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
          <Label htmlFor="statut">Situation</Label>
          <AutoSubmitSelect id="statut" name="statut" defaultValue={f.status}>
            <option value="">Toutes</option>
            {Object.entries(BALANCE_STATUSES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <Label htmlFor="etat">Élèves</Label>
          <AutoSubmitSelect id="etat" name="etat" defaultValue={f.state === "actifs" ? "" : f.state}>
            <option value="">Présents</option>
            <option value="partis">Partis</option>
            <option value="tous">Tous</option>
          </AutoSubmitSelect>
        </div>
        <div className="col-span-2 flex items-center gap-2 md:col-span-4">
          <button type="submit" className={buttonClasses("secondary", "sm")}>
            Rechercher
          </button>
          <Link href="/eleves" className={buttonClasses("ghost", "sm")}>
            Réinitialiser
          </Link>
          <p className="ml-auto text-sm text-slate-600">
            Reste à payer : <strong className="tabular">{formatFCFA(totalRemaining)}</strong>
          </p>
        </div>
      </form>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Users aria-hidden />}
            title={f.q || f.classId || f.status ? "Aucun résultat" : "Aucun élève inscrit"}
            description={
              f.q || f.classId || f.status
                ? "Modifiez la recherche ou les filtres."
                : "Ajoutez les élèves un par un ou importez votre fichier Excel."
            }
            action={
              canEdit && !f.q ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <LinkButton href="/eleves/importer" variant="secondary">
                    Importer un fichier
                  </LinkButton>
                  <LinkButton href="/eleves/nouveau">Ajouter un élève</LinkButton>
                </div>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Élève</Th>
                    <Th>Classe</Th>
                    <Th>Parent</Th>
                    <Th className="text-right">Reste à payer</Th>
                    <Th>Situation</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <Td>
                        <Link href={`/eleves/${r.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                          {fullName(r)}
                        </Link>
                        {!r.is_active && (
                          <Badge tone="muted" className="ml-2">
                            Parti
                          </Badge>
                        )}
                      </Td>
                      <Td>{r.class_name}</Td>
                      <Td>
                        {r.parent_name}
                        {r.parent_phone && <div className="text-sm text-slate-500">{formatPhone(r.parent_phone)}</div>}
                      </Td>
                      <Td className="tabular text-right font-semibold">{formatFCFA(r.remaining)}</Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link href={`/eleves/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {fullName(r)}
                        {!r.is_active && <span className="ml-1 text-sm font-normal text-slate-500">(parti)</span>}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {r.class_name}
                        {r.parent_name ? ` · ${r.parent_name}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular font-semibold">{formatFCFA(r.remaining)}</p>
                      <StatusBadge status={r.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
