import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { ModuleOff } from "@/components/module-off";
import { getSettings, requirePermission } from "@/lib/auth";
import { createStaff } from "../actions";
import { StaffForm } from "../staff-form";

export const metadata: Metadata = { title: "Nouveau membre du personnel" };

export default async function NewStaffPage() {
  await requirePermission("manageHr");
  const settings = await getSettings();
  if (!settings.module_hr) return <ModuleOff name="Personnel" canEnable />;
  return (
    <>
      <PageHeader title="Nouveau membre du personnel" back={{ href: "/personnel", label: "Personnel" }} />
      <Card className="max-w-3xl">
        <CardBody>
          <StaffForm action={createStaff} />
        </CardBody>
      </Card>
    </>
  );
}
