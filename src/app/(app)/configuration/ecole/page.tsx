import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { getSettings, requirePermission } from "@/lib/auth";
import { logoUrl } from "@/lib/storage";
import { LogoUploader, SchoolForm } from "./school-forms";

export const metadata: Metadata = { title: "École" };

export default async function SchoolPage() {
  await requirePermission("manageSetup");
  const settings = await getSettings();
  return (
    <>
      <PageHeader
        title="École"
        description="Ces informations apparaissent sur les reçus, les bulletins de paie et la page parent."
        back={{ href: "/configuration", label: "Configuration" }}
      />
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader title="Logo" />
          <CardBody>
            <LogoUploader logoUrl={logoUrl(settings.logo_path)} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Informations" />
          <CardBody>
            <SchoolForm settings={settings} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
