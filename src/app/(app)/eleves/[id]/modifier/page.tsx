import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { getActiveYear, requirePermission } from "@/lib/auth";
import { getClasses } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { fullName } from "@/lib/format";
import { isUuid, type IdParams } from "@/lib/params";
import { updatePupil } from "../../actions";
import { PupilForm } from "../../pupil-form";

export const metadata: Metadata = { title: "Modifier l'élève" };

export default async function EditPupilPage({ params }: { params: IdParams }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  await requirePermission("editPupils");
  const [year, classes] = await Promise.all([getActiveYear(), getClasses()]);
  const supabase = await createClient();
  const [{ data: pupil }, { data: enrollment }] = await Promise.all([
    supabase.from("pupils").select("*").eq("id", id).maybeSingle(),
    year
      ? supabase
          .from("enrollments")
          .select("class_id")
          .eq("pupil_id", id)
          .eq("school_year_id", year.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!pupil) notFound();

  return (
    <>
      <PageHeader
        title={`Modifier ${fullName(pupil)}`}
        back={{ href: `/eleves/${id}`, label: "Fiche élève" }}
      />
      <Card className="max-w-3xl">
        <CardBody>
          <PupilForm
            action={updatePupil}
            classes={classes.filter((c) => c.is_active || c.id === enrollment?.class_id)}
            pupil={{ ...pupil, class_id: enrollment?.class_id ?? null }}
          />
        </CardBody>
      </Card>
    </>
  );
}
