import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { NoYear } from "@/components/no-year";
import { getActiveYear, requirePermission } from "@/lib/auth";
import { getClasses } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { ImportClient } from "./import-client";

export const metadata: Metadata = { title: "Importer des élèves" };

export default async function ImportPage() {
  const user = await requirePermission("importPupils");
  const [year, classes] = await Promise.all([getActiveYear(), getClasses()]);
  if (!year) return <NoYear canSetup={can(user.role, "manageSetup")} />;
  return (
    <>
      <PageHeader
        title="Importer des élèves"
        description={`Depuis un fichier Excel ou CSV, pour l'année ${year.label}.`}
        back={{ href: "/eleves", label: "Élèves" }}
      />
      <Card className="max-w-5xl">
        <CardBody>
          <ImportClient classNames={classes.filter((c) => c.is_active).map((c) => c.name)} yearLabel={year.label} />
        </CardBody>
      </Card>
    </>
  );
}
