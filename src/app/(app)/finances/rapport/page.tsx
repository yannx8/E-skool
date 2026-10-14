import type { Metadata } from "next";
import { Printer } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { MonthNav } from "@/components/month-nav";
import { requirePermission } from "@/lib/auth";
import { currentMonthISO, parseMonthParam } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";
import { getMonthlyReport } from "../report-data";
import { ReportView } from "../report-view";

export const metadata: Metadata = { title: "Rapport mensuel" };

export default async function ReportPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  await requirePermission("viewFinance");
  const month = parseMonthParam(param(sp, "mois"), currentMonthISO());
  const report = await getMonthlyReport(month);
  return (
    <>
      <PageHeader
        title="Rapport mensuel"
        actions={
          <>
            <MonthNav month={month} basePath="/finances/rapport" />
            <LinkButton href={`/rapport-mensuel?mois=${month.slice(0, 7)}`} variant="secondary">
              <Printer aria-hidden /> Imprimer / PDF
            </LinkButton>
          </>
        }
      />
      <Card className="max-w-4xl">
        <CardBody>
          {report ? (
            <ReportView report={report} />
          ) : (
            <Alert tone="danger">Rapport indisponible.</Alert>
          )}
        </CardBody>
      </Card>
    </>
  );
}
