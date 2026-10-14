import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { NoYear } from "@/components/no-year";
import { getActiveYear, requirePermission } from "@/lib/auth";
import { getClasses } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { createPupil } from "../actions";
import { PupilForm } from "../pupil-form";

export const metadata: Metadata = { title: "Nouvel élève" };

export default async function NewPupilPage() {
  const user = await requirePermission("editPupils");
  const [year, classes] = await Promise.all([getActiveYear(), getClasses()]);
  if (!year) return <NoYear canSetup={can(user.role, "manageSetup")} />;
  const active = classes.filter((c) => c.is_active);
  return (
    <>
      <PageHeader title="Nouvel élève" description={`Inscription pour ${year.label}`} back={{ href: "/eleves", label: "Élèves" }} />
      <Card className="max-w-3xl">
        <CardBody>
          {active.length === 0 ? (
            <Alert tone="warning">Créez d&apos;abord les classes dans Configuration &gt; Classes.</Alert>
          ) : (
            <PupilForm action={createPupil} classes={active} canPay={can(user.role, "recordPayment")} />
          )}
        </CardBody>
      </Card>
    </>
  );
}
