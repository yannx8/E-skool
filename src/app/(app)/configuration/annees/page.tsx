import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { getSchoolYears, requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";
import { copyFees, createYear, deleteYear, setCurrentYear } from "../actions";

export const metadata: Metadata = { title: "Années scolaires" };

/** Suggests the next label: after 2026-2027 comes 2027-2028; otherwise the school year of today. */
function suggestLabel(labels: string[]): string {
  const latest = labels.map((l) => Number(l.slice(0, 4))).sort((a, b) => b - a)[0];
  if (latest) return `${latest + 1}-${latest + 2}`;
  const [y, m] = todayISO().split("-").map(Number);
  const start = m >= 8 ? y : y - 1;
  return `${start}-${start + 1}`;
}

export default async function YearsPage() {
  await requirePermission("manageSetup");
  const years = await getSchoolYears();
  const supabase = await createClient();
  const { data: scheduleRows } = await supabase.from("fee_schedules").select("school_year_id");
  const scheduleCount = new Map<string, number>();
  for (const r of scheduleRows ?? []) scheduleCount.set(r.school_year_id, (scheduleCount.get(r.school_year_id) ?? 0) + 1);

  return (
    <>
      <PageHeader
        title="Années scolaires"
        description="L'année en cours est celle utilisée par défaut partout dans l'application."
        back={{ href: "/configuration", label: "Configuration" }}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Années" />
          {years.length === 0 ? (
            <CardBody className="text-slate-600">Aucune année. Créez la première à droite.</CardBody>
          ) : (
            <ul className="divide-y divide-slate-100">
              {years.map((y) => (
                <li key={y.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-lg font-semibold">
                      {y.label}
                      {y.is_current && (
                        <Badge tone="success" icon={<CheckCircle2 aria-hidden />} className="ml-2">
                          En cours
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-slate-500">{scheduleCount.get(y.id) ?? 0} ligne(s) de frais</p>
                  </div>
                  <div className="flex gap-2">
                    {!y.is_current && (
                      <form action={setCurrentYear}>
                        <input type="hidden" name="id" value={y.id} />
                        <Button type="submit" variant="secondary" size="sm">
                          Définir comme année en cours
                        </Button>
                      </form>
                    )}
                    {!y.is_current && (
                      <ActionForm action={deleteYear}>
                        <input type="hidden" name="id" value={y.id} />
                        <ActionSubmit variant="ghost" size="sm" className="text-danger">
                          Supprimer
                        </ActionSubmit>
                      </ActionForm>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Nouvelle année" description="Par exemple au mois d'août, avant la rentrée." />
            <CardBody>
              <ActionForm action={createYear} className="space-y-4" resetOnSuccess>
                <Field label="Année scolaire" htmlFor="label" hint="Format 2026-2027">
                  <Input id="label" name="label" required pattern="\d{4}-\d{4}" defaultValue={suggestLabel(years.map((y) => y.label))} />
                </Field>
                {years.length > 0 && (
                  <Field label="Recopier les frais de" htmlFor="copy_from" hint="Les échéances sont décalées d'un an. Vous pourrez modifier les montants.">
                    <Select id="copy_from" name="copy_from" defaultValue={years[0]?.id}>
                      <option value="">Ne rien recopier</option>
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <ActionSubmit>Créer l&apos;année</ActionSubmit>
              </ActionForm>
            </CardBody>
          </Card>

          {years.length >= 2 && (
            <Card>
              <CardHeader title="Recopier les frais" description="Ajoute les lignes manquantes, sans toucher aux existantes." />
              <CardBody>
                <ActionForm action={copyFees} className="grid grid-cols-2 gap-3">
                  <Field label="De" htmlFor="from">
                    <Select id="from" name="from" defaultValue={years[1]?.id}>
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Vers" htmlFor="to">
                    <Select id="to" name="to" defaultValue={years[0]?.id}>
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="col-span-2">
                    <ActionSubmit variant="secondary">Recopier</ActionSubmit>
                  </div>
                </ActionForm>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
