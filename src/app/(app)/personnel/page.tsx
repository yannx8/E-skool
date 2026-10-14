import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, CalendarCheck, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { ModuleOff } from "@/components/module-off";
import { getSettings, requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { formatDate, formatFCFA } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { CONTRACT_TYPES } from "@/lib/labels";
import { param, type SearchParams } from "@/lib/params";

export const metadata: Metadata = { title: "Personnel" };

export default async function StaffPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await requirePermission("viewHr");
  const settings = await getSettings();
  if (!settings.module_hr) return <ModuleOff name="Personnel" canEnable={can(user.role, "manageSetup")} />;

  const showAll = param(sp, "tous") === "1";
  const supabase = await createClient();
  let q = supabase.from("staff").select("*").order("full_name");
  if (!showAll) q = q.eq("is_active", true);
  const [{ data: staff }, { data: salaries }] = await Promise.all([
    q,
    supabase.from("staff_current_salary").select("staff_id, monthly_amount"),
  ]);
  const salaryOf = new Map((salaries ?? []).map((s) => [s.staff_id, s.monthly_amount ?? 0]));
  const total = (staff ?? []).filter((s) => s.is_active).reduce((sum, s) => sum + (salaryOf.get(s.id) ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Personnel"
        description={`${staff?.length ?? 0} personne(s) · masse salariale mensuelle ${formatFCFA(total)}`}
        actions={
          <>
            <LinkButton href="/personnel/paie" variant="secondary">
              <CalendarCheck aria-hidden /> Paie du mois
            </LinkButton>
            {can(user.role, "manageHr") && (
              <LinkButton href="/personnel/nouveau">
                <Plus aria-hidden /> Ajouter
              </LinkButton>
            )}
          </>
        }
      />
      <p className="mb-3 text-sm">
        <Link href={showAll ? "/personnel" : "/personnel?tous=1"} className="inline-block min-h-11 py-2 text-primary underline-offset-4 hover:underline">
          {showAll ? "Masquer les anciens employés" : "Afficher aussi les anciens employés"}
        </Link>
      </p>
      <Card>
        {!staff || staff.length === 0 ? (
          <EmptyState
            icon={<Briefcase aria-hidden />}
            title="Aucun membre du personnel"
            description="Ajoutez les enseignants et le personnel avec leur salaire convenu."
            action={can(user.role, "manageHr") ? <LinkButton href="/personnel/nouveau">Ajouter</LinkButton> : undefined}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nom</Th>
                <Th>Fonction</Th>
                <Th>Contrat</Th>
                <Th className="text-right">Salaire</Th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/personnel/${s.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                      {s.full_name}
                    </Link>
                    {!s.is_active && (
                      <Badge tone="muted" className="ml-2">
                        Parti le {formatDate(s.end_date)}
                      </Badge>
                    )}
                    {s.phone && <div className="text-sm text-slate-500">{formatPhone(s.phone)}</div>}
                  </Td>
                  <Td>{s.job_title}</Td>
                  <Td>{CONTRACT_TYPES[s.contract]}</Td>
                  <Td className="tabular text-right font-semibold">{formatFCFA(salaryOf.get(s.id) ?? 0)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
