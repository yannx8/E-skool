import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { Label } from "@/components/ui/form";
import { AutoSubmitSelect } from "@/components/ui/client";
import { LinkButton } from "@/components/ui/button";
import { getSchoolYears, requirePermission } from "@/lib/auth";
import { getClasses } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/fetch-all";
import { param, type SearchParams } from "@/lib/params";
import { PromoteClient } from "./promote-client";

export const metadata: Metadata = { title: "Passage de classe" };

type EnrollmentRow = { pupil_id: string; class_id: string; pupils: { last_name: string; first_name: string; is_active: boolean } | null };

export default async function PromotePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  await requirePermission("promotePupils");
  const [years, classes] = await Promise.all([getSchoolYears(), getClasses()]);
  // years are sorted newest first
  const to = years.find((y) => y.id === param(sp, "vers")) ?? years[0];
  const from = years.find((y) => y.id === param(sp, "de")) ?? years.find((y) => y.label < (to?.label ?? "")) ?? null;

  const header = (
    <PageHeader
      title="Passage de classe"
      description="Inscrit les élèves de l'année passée dans leur nouvelle classe."
      back={{ href: "/eleves", label: "Élèves" }}
    />
  );

  if (years.length < 2 || !to || !from) {
    return (
      <>
        {header}
        <Alert tone="info" title="Créez d'abord la nouvelle année scolaire">
          Il faut deux années : celle qui se termine et la nouvelle. Créez la nouvelle année, recopiez les frais, puis revenez ici.
        </Alert>
        <LinkButton href="/configuration/annees" className="mt-4">
          Gérer les années scolaires
        </LinkButton>
      </>
    );
  }

  const supabase = await createClient();
  const [source, target] = await Promise.all([
    fetchAll<EnrollmentRow>((a, b) =>
      supabase
        .from("enrollments")
        .select("pupil_id, class_id, pupils(last_name, first_name, is_active)")
        .eq("school_year_id", from.id)
        .order("id")
        .range(a, b),
    ),
    fetchAll<{ pupil_id: string }>((a, b) =>
      supabase.from("enrollments").select("pupil_id").eq("school_year_id", to.id).order("id").range(a, b),
    ),
  ]);
  const already = new Set(target.map((t) => t.pupil_id));
  const pupils = source
    .filter((e) => e.pupils?.is_active)
    .map((e) => ({
      id: e.pupil_id,
      last_name: e.pupils!.last_name,
      first_name: e.pupils!.first_name,
      class_id: e.class_id,
      already: already.has(e.pupil_id),
    }))
    .sort((a, b) => a.last_name.localeCompare(b.last_name, "fr"));

  return (
    <>
      {header}
      <form method="get" className="mb-5 grid max-w-xl grid-cols-2 gap-3">
        <div>
          <Label htmlFor="de">De l&apos;année</Label>
          <AutoSubmitSelect id="de" name="de" defaultValue={from.id}>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <Label htmlFor="vers">Vers l&apos;année</Label>
          <AutoSubmitSelect id="vers" name="vers" defaultValue={to.id}>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
      </form>
      {from.id === to.id ? (
        <Alert tone="warning">Choisissez deux années différentes.</Alert>
      ) : pupils.length === 0 ? (
        <Card>
          <CardBody>Aucun élève présent en {from.label}.</CardBody>
        </Card>
      ) : (
        <PromoteClient
          key={`${from.id}-${to.id}`}
          pupils={pupils}
          classes={classes.filter((c) => c.is_active)}
          toYearId={to.id}
          toYearLabel={to.label}
        />
      )}
    </>
  );
}
