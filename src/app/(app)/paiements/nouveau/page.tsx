import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { NoYear } from "@/components/no-year";
import { getActiveYear, getSettings, requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid, param, type SearchParams } from "@/lib/params";
import { todayISO } from "@/lib/format";
import { pupilBalance, type PupilHit } from "../actions";
import { PaymentForm } from "./payment-form";

export const metadata: Metadata = { title: "Nouveau paiement" };

export default async function NewPaymentPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  await requirePermission("recordPayment");
  const [settings, year] = await Promise.all([getSettings(), getActiveYear()]);
  if (!year) return <NoYear canSetup />;

  let initialPupil: PupilHit | null = null;
  const pupilId = param(sp, "eleve");
  if (isUuid(pupilId)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("enrollments")
      .select("pupil_id, classes(name), pupils(last_name, first_name, parent_name, parent_phone, is_active)")
      .eq("pupil_id", pupilId)
      .eq("school_year_id", year.id)
      .maybeSingle();
    if (data?.pupils) {
      initialPupil = {
        pupil_id: data.pupil_id,
        last_name: data.pupils.last_name,
        first_name: data.pupils.first_name,
        parent_name: data.pupils.parent_name,
        parent_phone: data.pupils.parent_phone,
        is_active: data.pupils.is_active,
        class_name: data.classes?.name ?? "",
        remaining: 0,
      };
    }
  }
  const initialLines = initialPupil ? await pupilBalance(initialPupil.pupil_id) : [];

  return (
    <>
      <PageHeader
        title="Enregistrer un paiement"
        description={`Année ${year.label}${year.is_current ? "" : " (attention : ce n'est pas l'année en cours)"}`}
        back={{ href: "/paiements", label: "Paiements" }}
      />
      <Card className="max-w-3xl">
        <CardBody>
          <PaymentForm
            today={todayISO()}
            termLabel={settings.term_label}
            initialPupil={initialPupil}
            initialLines={initialLines}
          />
        </CardBody>
      </Card>
    </>
  );
}
