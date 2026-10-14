import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { Card, CardBody, CardHeader, Stat } from "@/components/ui/card";
import { Alert, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { NoYear } from "@/components/no-year";
import { getActiveYear, getSettings, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { formatDate, formatFCFA, fullName } from "@/lib/format";
import { PAYMENT_METHODS, termName } from "@/lib/labels";
import { param, type SearchParams } from "@/lib/params";

export const metadata: Metadata = { title: "Tableau de bord" };

type TermStat = {
  term: number | null;
  due: number;
  applied: number;
  remaining: number;
  due_date: string;
  solvable: number;
  partiel: number;
  insolvable: number;
  pas_encore_du: number;
};

type DashboardStats = {
  due: number;
  paid: number;
  applied: number;
  remaining: number;
  due_to_date: number;
  applied_to_date: number;
  pupils: number;
  classes: number;
  fee_schedules: number;
  today_count: number;
  today_amount: number;
  terms: TermStat[];
};

function rate(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [settings, year] = await Promise.all([getSettings(), getActiveYear()]);
  const canSetup = can(user.role, "manageSetup");
  const canPay = can(user.role, "recordPayment");

  const header = (
    <PageHeader
      title="Tableau de bord"
      description={year ? `Année scolaire ${year.label}` : undefined}
      actions={
        canPay && year ? (
          <LinkButton href="/paiements/nouveau" size="lg">
            <Plus aria-hidden /> Enregistrer un paiement
          </LinkButton>
        ) : undefined
      }
    />
  );

  if (!year) {
    return (
      <>
        {header}
        <NoYear canSetup={canSetup} />
      </>
    );
  }

  const supabase = await createClient();
  const [{ data: statsJson }, { data: lastPayments }] = await Promise.all([
    supabase.rpc("dashboard_stats", { p_school_year_id: year.id }),
    supabase
      .from("payments")
      .select("id, amount, method, paid_at, receipt_number, voided, pupils(last_name, first_name)")
      .eq("school_year_id", year.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const s = statsJson as unknown as DashboardStats;

  const setupSteps = [
    { done: s.classes > 0, label: "Créer les classes", href: "/configuration/classes" },
    {
      done: s.fee_schedules > 0,
      label: "Saisir les frais de scolarité",
      href: "/configuration/frais",
    },
    { done: s.pupils > 0, label: "Ajouter ou importer les élèves", href: "/eleves/importer" },
  ];
  const setupDone = setupSteps.every((step) => step.done);

  return (
    <>
      {header}
      {param(sp, "refus") === "1" && (
        <Alert tone="warning" className="mb-4">
          Vous n&apos;avez pas accès à cette page avec votre rôle.
        </Alert>
      )}

      {!setupDone && (
        <Card className="mb-6">
          <CardHeader
            title="Pour commencer"
            description="Trois étapes avant d'enregistrer le premier paiement."
          />
          <CardBody>
            <ol className="space-y-2">
              {setupSteps.map((step) => (
                <li key={step.href}>
                  <Link
                    href={canSetup || step.href === "/eleves/importer" ? step.href : "#"}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-slate-50"
                  >
                    {step.done ? (
                      <CheckCircle2 className="size-6 text-success" aria-label="Fait" />
                    ) : (
                      <Circle className="size-6 text-slate-400" aria-label="À faire" />
                    )}
                    <span className={step.done ? "text-slate-500 line-through" : "font-medium"}>
                      {step.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Attendu sur l'année"
          value={formatFCFA(s.due)}
          hint={`${s.pupils} élèves actifs`}
        />
        <Stat
          label="Encaissé"
          value={formatFCFA(s.paid)}
          tone="success"
          hint={`${rate(s.applied, s.due)} % des frais de l'année`}
        />
        <Stat
          label="Reste à payer"
          value={formatFCFA(s.remaining)}
          tone={s.remaining > 0 ? "warning" : "default"}
        />
        <Stat
          label="Échéances passées payées"
          value={`${rate(s.applied_to_date, s.due_to_date)} %`}
          tone={rate(s.applied_to_date, s.due_to_date) >= 80 ? "success" : "danger"}
          hint={`${formatFCFA(s.due_to_date - s.applied_to_date)} en retard`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={`Situation par ${settings.term_label.toLowerCase()}`}
            description="Cliquez sur une ligne pour voir les impayés."
          />
          {s.terms.length === 0 ? (
            <EmptyState
              title="Aucun frais configuré"
              description="Saisissez les frais dans Configuration > Frais."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Période</Th>
                  <Th className="text-right">Encaissé</Th>
                  <Th className="text-right">Reste</Th>
                  <Th>Élèves</Th>
                </tr>
              </thead>
              <tbody>
                {s.terms.map((t) => (
                  <tr key={t.term ?? "once"} className="hover:bg-slate-50">
                    <Td>
                      <Link
                        href={`/impayes?tranche=${t.term ?? "unique"}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {termName(t.term, settings.term_label)}
                      </Link>
                      <div className="text-sm text-slate-500">
                        Échéance {formatDate(t.due_date)}
                      </div>
                    </Td>
                    <Td className="tabular text-right">
                      {formatFCFA(t.applied)}
                      <div className="text-sm text-slate-500">{rate(t.applied, t.due)} %</div>
                    </Td>
                    <Td className="tabular text-right">{formatFCFA(t.remaining)}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone="success">{t.solvable} solvables</Badge>
                        {t.partiel > 0 && <Badge tone="warning">{t.partiel} partiels</Badge>}
                        {t.insolvable > 0 && (
                          <Badge tone="danger">{t.insolvable} insolvables</Badge>
                        )}
                        {t.pas_encore_du > 0 && (
                          <Badge tone="muted">{t.pas_encore_du} pas encore dû</Badge>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Derniers paiements"
            description={`Aujourd'hui : ${s.today_count} paiement${s.today_count > 1 ? "s" : ""}, ${formatFCFA(s.today_amount)}`}
            actions={
              <Link
                href="/paiements"
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary"
              >
                Tout voir
              </Link>
            }
          />
          {lastPayments && lastPayments.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {lastPayments.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/recu/${p.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p
                        className={
                          p.voided
                            ? "truncate font-medium text-slate-400 line-through"
                            : "truncate font-medium"
                        }
                      >
                        {p.pupils ? fullName(p.pupils) : "-"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(p.paid_at)} · {PAYMENT_METHODS[p.method]}
                      </p>
                    </div>
                    <span
                      className={
                        p.voided ? "tabular text-slate-400 line-through" : "tabular font-semibold"
                      }
                    >
                      {formatFCFA(p.amount)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Aucun paiement"
              description="Les paiements enregistrés apparaîtront ici."
            />
          )}
        </Card>
      </div>
    </>
  );
}
