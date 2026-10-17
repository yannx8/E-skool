import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Phone, Plus, RotateCcw } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, DefinitionList, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { ReminderButton } from "@/components/reminder-button";
import { VoidDialog } from "@/components/void-dialog";
import { getActiveYear, getSettings, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserNames } from "@/lib/queries";
import { can } from "@/lib/permissions";
import {
  formatDate,
  formatDateTime,
  formatFCFA,
  formatRelativeDay,
  fullName,
  todayISO,
} from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { FEE_TYPES, feeLineName, PAYMENT_METHODS, termName, type FeeType } from "@/lib/labels";
import { isUuid, param, type IdParams, type SearchParams } from "@/lib/params";
import { reminderHref } from "@/lib/reminder-server";
import { publicEnv } from "@/lib/env";
import { voidPayment } from "../../paiements/actions";
import { disableDiscount, reactivatePupil, regeneratePortalLink } from "../actions";
import { CopyLinkButton, DiscountDialog, LeaveDialog } from "./pupil-actions";

export const metadata: Metadata = { title: "Fiche élève" };

export default async function PupilPage({
  params,
  searchParams,
}: {
  params: IdParams;
  searchParams: SearchParams;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const user = await requireUser();
  const [settings, year, names] = await Promise.all([
    getSettings(),
    getActiveYear(),
    getUserNames(),
  ]);
  const supabase = await createClient();

  const { data: pupil } = await supabase.from("pupils").select("*").eq("id", id).maybeSingle();
  if (!pupil) notFound();

  const yearId = year?.id ?? "00000000-0000-0000-0000-000000000000";
  const [
    { data: enrollments },
    { data: lines },
    { data: yearBalance },
    { data: payments },
    { data: reminders },
    { data: discounts },
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select("school_year_id, class_id, classes(name), school_years(label)")
      .eq("pupil_id", id),
    supabase
      .from("balance_lines")
      .select("fee, term, due_date, gross_due, discount, due, paid, applied, remaining, status")
      .eq("pupil_id", id)
      .eq("school_year_id", yearId)
      .order("due_date")
      .order("term", { nullsFirst: true }),
    supabase
      .from("pupil_year_balance")
      .select("*")
      .eq("pupil_id", id)
      .eq("school_year_id", yearId)
      .maybeSingle(),
    supabase
      .from("payments")
      .select(
        "id, receipt_number, amount, method, fee, term, paid_at, reference, voided, void_reason, created_by",
      )
      .eq("pupil_id", id)
      .eq("school_year_id", yearId)
      .order("paid_at", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("reminder_log")
      .select("id, term, channel, amount_due, created_at, created_by")
      .eq("pupil_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("discounts")
      .select("id, fee, term, kind, value, reason, is_active")
      .eq("pupil_id", id)
      .eq("school_year_id", yearId)
      .order("created_at"),
  ]);

  const current = enrollments?.find((e) => e.school_year_id === year?.id);
  const className = current?.classes?.name ?? "Non inscrit cette année";
  const overdueLines = (lines ?? []).filter(
    (l) => (l.remaining ?? 0) > 0 && (l.due_date ?? "") < todayISO(),
  );
  const overdueAmount = overdueLines.reduce((s, l) => s + (l.remaining ?? 0), 0);
  const firstOverdue = overdueLines[0];
  const portalUrl = publicEnv.siteUrl
    ? `${publicEnv.siteUrl}/p/${pupil.portal_token}`
    : `/p/${pupil.portal_token}`;
  const canEdit = can(user.role, "editPupils");

  return (
    <>
      <PageHeader
        title={fullName(pupil)}
        description={
          <>
            {className}
            {year ? ` · ${year.label}` : ""}
            {!pupil.is_active && (
              <Badge tone="muted" className="ml-2">
                Parti le {formatDate(pupil.left_on)}
              </Badge>
            )}
          </>
        }
        back={{ href: "/eleves", label: "Élèves" }}
        actions={
          <>
            {canEdit && (
              <LinkButton href={`/eleves/${id}/modifier`} variant="secondary">
                <Pencil aria-hidden /> Modifier
              </LinkButton>
            )}
            {can(user.role, "recordPayment") && current && (
              <LinkButton href={`/paiements/nouveau?eleve=${id}`}>
                <Plus aria-hidden /> Enregistrer un paiement
              </LinkButton>
            )}
          </>
        }
      />
      {param(sp, "cree") === "1" && (
        <Alert tone="success" className="mb-4">
          Élève ajouté.
        </Alert>
      )}
      {param(sp, "modifie") === "1" && (
        <Alert tone="success" className="mb-4">
          Modifications enregistrées.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Situation financière"
              description={
                yearBalance
                  ? `Dû ${formatFCFA(yearBalance.due)} · Payé ${formatFCFA(yearBalance.paid)} · Reste ${formatFCFA(yearBalance.remaining)}`
                  : undefined
              }
              actions={
                <>
                  {can(user.role, "sendReminders") && pupil.parent_phone && firstOverdue && (
                    <ReminderButton
                      href={reminderHref(settings, {
                        ...pupil,
                        parent_phone: pupil.parent_phone,
                        class_name: className,
                        term: overdueLines.length === 1 ? firstOverdue.term : null,
                        remaining: overdueAmount,
                        due_date: firstOverdue.due_date,
                        portal_token: pupil.portal_token,
                      })}
                      pupilId={id}
                      term={overdueLines.length === 1 ? firstOverdue.term : null}
                      amountDue={overdueAmount}
                      label="Relancer sur WhatsApp"
                    />
                  )}
                  {can(user.role, "manageDiscounts") && current && (
                    <DiscountDialog
                      pupilId={id}
                      termLabel={settings.term_label}
                      termsCount={settings.terms_count}
                    />
                  )}
                </>
              }
            />
            {!lines || lines.length === 0 ? (
              <EmptyState
                title="Aucun frais pour cette année"
                description="Vérifiez la classe de l'élève et les frais configurés."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Objet</Th>
                    <Th className="text-right">Dû</Th>
                    <Th className="text-right">Payé</Th>
                    <Th className="text-right">Reste</Th>
                    <Th>Situation</Th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={`${l.fee}-${l.term}`}>
                      <Td>
                        <span className="font-medium">
                          {feeLineName(l.fee as FeeType, l.term, settings.term_label)}
                        </span>
                        <div className="text-sm text-slate-500">
                          Échéance {formatDate(l.due_date)}
                        </div>
                      </Td>
                      <Td className="tabular text-right">
                        {formatFCFA(l.due)}
                        {(l.discount ?? 0) > 0 && (
                          <div className="text-sm text-success">-{formatFCFA(l.discount)}</div>
                        )}
                      </Td>
                      <Td className="tabular text-right">{formatFCFA(l.applied)}</Td>
                      <Td className="tabular text-right font-semibold">
                        {formatFCFA(l.remaining)}
                      </Td>
                      <Td>
                        <StatusBadge status={l.status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            {(yearBalance?.credit ?? 0) > 0 && (
              <CardBody>
                <Alert tone="info">
                  Crédit en faveur de la famille : {formatFCFA(yearBalance?.credit)} (trop-perçu sur
                  la dernière période).
                </Alert>
              </CardBody>
            )}
          </Card>

          <Card>
            <CardHeader title="Paiements" description={year ? `Année ${year.label}` : undefined} />
            {!payments || payments.length === 0 ? (
              <EmptyState title="Aucun paiement cette année" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className={p.voided ? "text-slate-400" : ""}>
                      <Link
                        href={`/recu/${p.id}`}
                        className="font-mono text-primary underline-offset-4 hover:underline"
                      >
                        {p.receipt_number}
                      </Link>
                      <span className={p.voided ? "ml-2 line-through" : "ml-2"}>
                        {feeLineName(p.fee, p.term, settings.term_label)}
                      </span>
                      <div className="text-sm text-slate-500">
                        {formatDate(p.paid_at)} · {PAYMENT_METHODS[p.method]}
                        {p.reference ? ` · ${p.reference}` : ""}
                        {p.created_by && names.get(p.created_by)
                          ? ` · par ${names.get(p.created_by)}`
                          : ""}
                      </div>
                      {p.voided && (
                        <div className="text-sm text-danger">Annulé : {p.void_reason}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`tabular font-semibold ${p.voided ? "text-slate-400 line-through" : ""}`}
                      >
                        {formatFCFA(p.amount)}
                      </span>
                      {!p.voided && can(user.role, "voidPayment") && (
                        <VoidDialog
                          action={voidPayment}
                          idName="payment_id"
                          id={p.id}
                          title="Annuler ce paiement ?"
                          description={`Reçu ${p.receipt_number}, ${formatFCFA(p.amount)} du ${formatDate(p.paid_at)}. Il restera visible, barré. Enregistrez ensuite le bon montant.`}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Parent" />
            <CardBody className="space-y-4">
              <DefinitionList
                items={[
                  { label: "Nom", value: pupil.parent_name },
                  {
                    label: "Téléphone",
                    value: pupil.parent_phone ? (
                      <a
                        href={`tel:+${pupil.parent_phone}`}
                        className="inline-flex items-center gap-1 text-primary"
                      >
                        <Phone className="size-4" aria-hidden /> {formatPhone(pupil.parent_phone)}
                      </a>
                    ) : null,
                  },
                  {
                    label: "Second téléphone",
                    value: pupil.parent_phone_alt ? formatPhone(pupil.parent_phone_alt) : null,
                  },
                ]}
              />
              {pupil.notes && <p className="text-slate-700">{pupil.notes}</p>}
            </CardBody>
          </Card>

          {(discounts?.length ?? 0) > 0 && (
            <Card>
              <CardHeader title="Réductions" />
              <ul className="divide-y divide-slate-100">
                {discounts!.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className={d.is_active ? "" : "text-slate-400 line-through"}>
                      <p className="font-medium">
                        {d.kind === "percent" ? `${d.value} %` : formatFCFA(d.value)}{" "}
                        {d.fee ? `sur ${FEE_TYPES[d.fee].toLowerCase()}` : "sur tous les frais"}
                        {d.term ? `, ${termName(d.term, settings.term_label).toLowerCase()}` : ""}
                      </p>
                      <p className="text-sm text-slate-500">{d.reason}</p>
                    </div>
                    {d.is_active && can(user.role, "manageDiscounts") && (
                      <form action={disableDiscount}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="pupil_id" value={id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Retirer
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Lien de suivi parent"
              description="Page en lecture seule : soldes et reçus, sans mot de passe."
            />
            <CardBody className="space-y-3">
              <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm break-all">
                {portalUrl}
              </p>
              <div className="flex flex-wrap gap-2">
                <CopyLinkButton url={portalUrl} />
                {can(user.role, "manageSetup") && (
                  <form action={regeneratePortalLink}>
                    <input type="hidden" name="id" value={id} />
                    <Button type="submit" variant="ghost" size="sm">
                      <RotateCcw aria-hidden /> Nouveau lien
                    </Button>
                  </form>
                )}
              </div>
              <p className="text-sm text-slate-500">
                « Nouveau lien » désactive l&apos;ancien (si le lien a été partagé par erreur).
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Relances" />
            {!reminders || reminders.length === 0 ? (
              <CardBody className="text-slate-500">Aucune relance enregistrée.</CardBody>
            ) : (
              <ul className="divide-y divide-slate-100">
                {reminders.map((r) => (
                  <li key={r.id} className="px-4 py-2.5 text-[15px]">
                    <span className="font-medium">{formatRelativeDay(r.created_at)}</span>
                    <span className="text-slate-600">
                      {" "}
                      · {r.term == null
                        ? "toutes périodes"
                        : termName(r.term, settings.term_label)}{" "}
                      · {formatFCFA(r.amount_due)}
                    </span>
                    <div className="text-sm text-slate-500">
                      {r.channel === "whatsapp_api"
                        ? "Envoi automatique"
                        : `WhatsApp ouvert par ${names.get(r.created_by ?? "") ?? "?"}`}{" "}
                      · {formatDateTime(r.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Scolarité" />
            <ul className="divide-y divide-slate-100">
              {(enrollments ?? [])
                .slice()
                .sort((a, b) =>
                  (b.school_years?.label ?? "").localeCompare(a.school_years?.label ?? ""),
                )
                .map((e) => (
                  <li key={e.school_year_id} className="flex justify-between px-4 py-2.5">
                    <span>{e.school_years?.label}</span>
                    <span className="font-medium">{e.classes?.name}</span>
                  </li>
                ))}
            </ul>
            {canEdit && (
              <CardBody className="border-t border-slate-100">
                {pupil.is_active ? (
                  <LeaveDialog pupilId={id} today={todayISO()} />
                ) : (
                  <form action={reactivatePupil}>
                    <input type="hidden" name="id" value={id} />
                    <p className="mb-2 text-sm text-slate-600">
                      Motif du départ : {pupil.left_reason}
                    </p>
                    <Button type="submit" variant="secondary">
                      Réintégrer l&apos;élève
                    </Button>
                  </form>
                )}
              </CardBody>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
