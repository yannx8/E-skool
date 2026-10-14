import type { Metadata } from "next";
import Link from "next/link";
import { Phone, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { ModuleOff } from "@/components/module-off";
import { getActiveYear, getSchoolYears, getSettings, requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getClasses } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/labels";
import { param, type SearchParams } from "@/lib/params";
import { cn } from "@/lib/cn";
import { deleteApplication, setApplicationStatus } from "./actions";
import { EnrollDialog, NewApplicationDialog } from "./application-dialogs";

export const metadata: Metadata = { title: "Inscriptions" };

const PIPELINE: ApplicationStatus[] = ["new", "contacted", "visit", "accepted", "enrolled", "rejected"];
const TONES: Record<ApplicationStatus, "info" | "warning" | "success" | "danger" | "muted"> = {
  new: "info",
  contacted: "warning",
  visit: "warning",
  accepted: "success",
  enrolled: "success",
  rejected: "muted",
};

// V2 enrollment pipeline: from first contact to enrolled pupil.
export default async function ApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await requirePermission("viewEnrollment");
  const settings = await getSettings();
  if (!settings.module_enrollment) return <ModuleOff name="Inscriptions" canEnable={can(user.role, "manageSetup")} />;

  const status = (PIPELINE as string[]).includes(param(sp, "statut")) ? (param(sp, "statut") as ApplicationStatus) : "";
  const supabase = await createClient();
  const [{ data: apps }, classes, years, year] = await Promise.all([
    supabase
      .from("enrollment_applications")
      .select("*, classes(name)")
      .order("created_at", { ascending: false })
      .limit(500),
    getClasses(),
    getSchoolYears(),
    getActiveYear(),
  ]);
  const counts = new Map<string, number>();
  for (const a of apps ?? []) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);
  const shown = (apps ?? []).filter((a) => (status ? a.status === status : !["enrolled", "rejected"].includes(a.status)));
  const canManage = can(user.role, "manageEnrollment");
  const activeClasses = classes.filter((c) => c.is_active).map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <PageHeader
        title="Inscriptions"
        description="Suivi des demandes des nouveaux parents, du premier contact à l'inscription."
        actions={canManage ? <NewApplicationDialog classes={activeClasses} /> : undefined}
      />
      <nav className="-mx-4 mb-4 overflow-x-auto px-4" aria-label="Statuts">
        <ul className="flex gap-2">
          <li>
            <Link
              href="/inscriptions"
              className={cn("inline-flex min-h-10 items-center rounded-full border px-3 text-sm font-medium whitespace-nowrap", !status ? "border-primary bg-primary text-white" : "border-slate-300 bg-white")}
            >
              En cours
            </Link>
          </li>
          {PIPELINE.map((s) => (
            <li key={s}>
              <Link
                href={`/inscriptions?statut=${s}`}
                className={cn("inline-flex min-h-10 items-center rounded-full border px-3 text-sm font-medium whitespace-nowrap", status === s ? "border-primary bg-primary text-white" : "border-slate-300 bg-white")}
              >
                {APPLICATION_STATUSES[s]} ({counts.get(s) ?? 0})
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Card>
        {shown.length === 0 ? (
          <EmptyState icon={<UserPlus aria-hidden />} title="Aucune demande" description="Les demandes d'inscription des nouveaux parents apparaîtront ici." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((a) => (
              <li key={a.id} className="space-y-2 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {a.child_last_name} {a.child_first_name}
                      <Badge tone={TONES[a.status]} className="ml-2">
                        {APPLICATION_STATUSES[a.status]}
                      </Badge>
                    </p>
                    <p className="text-sm text-slate-500">
                      {a.classes?.name ? `Classe demandée : ${a.classes.name}` : "Classe non précisée"}
                      {a.birth_date ? ` · né(e) le ${formatDate(a.birth_date)}` : ""}
                      {" · reçue le "}
                      {formatDateTime(a.created_at)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {a.parent_name}
                      {a.parent_phone && (
                        <a href={`tel:+${a.parent_phone}`} className="ml-2 inline-flex items-center gap-1 text-primary">
                          <Phone className="size-4" aria-hidden /> {formatPhone(a.parent_phone)}
                        </a>
                      )}
                    </p>
                    {a.notes && <p className="mt-1 text-sm text-slate-700">{a.notes}</p>}
                  </div>
                  {a.pupil_id && (
                    <Link href={`/eleves/${a.pupil_id}`} className="text-sm font-medium text-primary">
                      Voir la fiche élève
                    </Link>
                  )}
                </div>
                {canManage && a.status !== "enrolled" && (
                  <div className="flex flex-wrap items-center gap-2">
                    {(["contacted", "visit", "accepted", "rejected"] as const)
                      .filter((s) => s !== a.status)
                      .map((s) => (
                        <ActionForm key={s} action={setApplicationStatus}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="status" value={s} />
                          <ActionSubmit variant="secondary" size="sm">
                            {APPLICATION_STATUSES[s]}
                          </ActionSubmit>
                        </ActionForm>
                      ))}
                    <EnrollDialog
                      applicationId={a.id}
                      childName={`${a.child_last_name} ${a.child_first_name}`.trim()}
                      classes={activeClasses}
                      years={years.map((y) => ({ id: y.id, label: y.label }))}
                      defaultClassId={a.desired_class_id}
                      defaultYearId={year?.id ?? null}
                    />
                    {can(user.role, "manageSetup") && a.status !== "accepted" && (
                      <ActionForm action={deleteApplication}>
                        <input type="hidden" name="id" value={a.id} />
                        <ActionSubmit variant="ghost" size="sm">
                          Supprimer
                        </ActionSubmit>
                      </ActionForm>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
