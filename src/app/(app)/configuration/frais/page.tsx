import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { NoYear } from "@/components/no-year";
import { getActiveYear, getSchoolYears, getSettings, requirePermission } from "@/lib/auth";
import { getClasses } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { copyFees } from "../actions";
import { FeeGrid } from "./fee-grid";

export const metadata: Metadata = { title: "Frais" };

export default async function FeesPage() {
  await requirePermission("manageSetup");
  const [settings, year, years, classes] = await Promise.all([getSettings(), getActiveYear(), getSchoolYears(), getClasses()]);
  if (!year) return <NoYear canSetup />;
  const supabase = await createClient();
  const { data: schedules } = await supabase
    .from("fee_schedules")
    .select("class_id, fee, term, amount, due_date")
    .eq("school_year_id", year.id);
  const active = classes.filter((c) => c.is_active || schedules?.some((s) => s.class_id === c.id));
  const previous = years.find((y) => y.label < year.label);

  return (
    <>
      <PageHeader
        title={`Frais ${year.label}`}
        description="Montant dû par classe. Laissez vide si un frais ne concerne pas une classe."
        back={{ href: "/configuration", label: "Configuration" }}
      />
      {active.length === 0 ? (
        <Card>
          <CardBody className="space-y-3">
            <Alert tone="info">Créez d&apos;abord les classes.</Alert>
            <LinkButton href="/configuration/classes">Gérer les classes</LinkButton>
          </CardBody>
        </Card>
      ) : (
        <>
          {(schedules?.length ?? 0) === 0 && previous && (
            <Card className="mb-6">
              <CardBody>
                <ActionForm action={copyFees} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="from" value={previous.id} />
                  <input type="hidden" name="to" value={year.id} />
                  <p className="text-slate-700">Gagnez du temps : reprenez les frais de {previous.label}, puis ajustez les montants.</p>
                  <ActionSubmit variant="secondary">Copier de {previous.label}</ActionSubmit>
                </ActionForm>
              </CardBody>
            </Card>
          )}
          <FeeGrid
            key={JSON.stringify(schedules)}
            classes={active.map((c) => ({ id: c.id, name: c.name }))}
            schedules={schedules ?? []}
            termsCount={settings.terms_count}
            termLabel={settings.term_label}
          />
        </>
      )}
    </>
  );
}
