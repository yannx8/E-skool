import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Undo2 } from "lucide-react";
import { PrintToolbar } from "@/components/print-toolbar";
import { SchoolHeader } from "@/components/school-header";
import { VoidDialog } from "@/components/void-dialog";
import { Alert } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { getSettings, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { amountToFrenchWords } from "@/lib/french-words";
import { formatDate, formatDateTime, formatFCFA, fullName } from "@/lib/format";
import { feeLineName, PAYMENT_METHODS } from "@/lib/labels";
import { isUuid, param, type IdParams, type SearchParams } from "@/lib/params";
import { whatsappUrl } from "@/lib/reminder";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/cn";
import { voidPayment } from "@/app/(app)/paiements/actions";

export const metadata: Metadata = { title: "Reçu" };

const PAGE_SIZE = {
  a5: "A5 portrait",
  a4: "A4 portrait",
  thermal: "80mm auto",
} as const;

export default async function ReceiptPage({ params, searchParams }: { params: IdParams; searchParams: SearchParams }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const user = await requireUser();
  const settings = await getSettings();
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("payments")
    .select("*, pupils(last_name, first_name, parent_name, parent_phone, portal_token), school_years(label)")
    .eq("id", id)
    .maybeSingle();
  if (!p || !p.pupils) notFound();

  let lineQuery = supabase
    .from("balance_lines")
    .select("due, carry_in")
    .eq("pupil_id", p.pupil_id)
    .eq("school_year_id", p.school_year_id)
    .eq("fee", p.fee);
  lineQuery = p.term == null ? lineQuery.is("term", null) : lineQuery.eq("term", p.term);

  let paidQuery = supabase
    .from("payments")
    .select("amount")
    .eq("pupil_id", p.pupil_id)
    .eq("school_year_id", p.school_year_id)
    .eq("fee", p.fee)
    .eq("voided", false)
    .lte("created_at", p.created_at);
  paidQuery = p.term == null ? paidQuery.is("term", null) : paidQuery.eq("term", p.term);

  const [{ data: enrollment }, { data: line }, { data: paidRows }, { data: recorder }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("classes(name)")
      .eq("pupil_id", p.pupil_id)
      .eq("school_year_id", p.school_year_id)
      .maybeSingle(),
    lineQuery.maybeSingle(),
    paidQuery,
    p.created_by
      ? supabase.from("user_roles").select("full_name").eq("user_id", p.created_by).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const paidUpTo = (paidRows ?? []).reduce((sum, r) => sum + r.amount, 0);
  const remainingAfter = line ? Math.max(0, (line.due ?? 0) - (line.carry_in ?? 0) - paidUpTo) : null;
  const pupilName = fullName(p.pupils);
  const lineName = feeLineName(p.fee, p.term, settings.term_label);
  const format = (settings.receipt_format in PAGE_SIZE ? settings.receipt_format : "a5") as keyof typeof PAGE_SIZE;
  const thermal = format === "thermal";
  const canUndo =
    can(user.role, "voidPayment") && !p.voided && Date.now() - new Date(p.created_at).getTime() < 10 * 60 * 1000;

  const portalLink = publicEnv.siteUrl && p.pupils.portal_token ? `${publicEnv.siteUrl}/p/${p.pupils.portal_token}` : "";
  const shareText = [
    `${settings.school_name} - Reçu N° ${p.receipt_number}`,
    `Élève : ${pupilName}`,
    `${lineName} : ${formatFCFA(p.amount)} (${PAYMENT_METHODS[p.method]}) le ${formatDate(p.paid_at)}`,
    remainingAfter != null ? `Reste à payer : ${formatFCFA(remainingAfter)}` : "",
    portalLink ? `Suivi : ${portalLink}` : "",
    "Merci.",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <style>{`@media print { @page { size: ${PAGE_SIZE[format]}; margin: ${thermal ? "3mm" : "10mm"}; } }`}</style>
      <PrintToolbar
        backHref={`/eleves/${p.pupil_id}`}
        backLabel="Fiche élève"
        whatsappHref={!p.voided && p.pupils.parent_phone ? whatsappUrl(p.pupils.parent_phone, shareText) : null}
      >
        {canUndo && (
          <VoidDialog
            action={voidPayment}
            idName="payment_id"
            id={p.id}
            title="Annuler ce paiement ?"
            description={`Reçu ${p.receipt_number}, ${formatFCFA(p.amount)}. Le reçu restera visible avec la mention ANNULÉ.`}
            trigger={
              <Button variant="secondary">
                <Undo2 aria-hidden /> Annuler ce paiement
              </Button>
            }
          />
        )}
      </PrintToolbar>

      {param(sp, "nouveau") === "1" && !p.voided && (
        <div className="no-print mx-auto mb-4 max-w-3xl px-4">
          <Alert tone="success" title="Paiement enregistré">
            Imprimez le reçu ou envoyez-le au parent sur WhatsApp.
          </Alert>
        </div>
      )}

      <article
        className={cn(
          "relative mx-auto overflow-hidden bg-white text-slate-900 shadow-sm print:shadow-none",
          thermal ? "w-[76mm] p-3 text-[13px]" : "w-full max-w-[148mm] p-6 print:max-w-none print:p-0",
        )}
      >
        {p.voided && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-black tracking-widest text-danger/20 [transform:rotate(-24deg)]"
          >
            ANNULÉ
          </div>
        )}

        <SchoolHeader settings={settings} compact={thermal} />

        <div className={cn("my-4 border-y border-slate-300 py-2", thermal ? "text-center" : "flex items-baseline justify-between")}>
          <h1 className="text-lg font-bold uppercase">Reçu de paiement</h1>
          <p className="font-mono text-base font-semibold">N° {p.receipt_number}</p>
        </div>

        <dl className="space-y-1.5">
          <Row label="Élève" value={pupilName} />
          <Row label="Classe" value={`${enrollment?.classes?.name ?? "-"} (${p.school_years?.label ?? ""})`} />
          {p.pupils.parent_name && <Row label="Parent" value={p.pupils.parent_name} />}
          <Row label="Objet" value={lineName} />
          <Row label="Date" value={formatDate(p.paid_at)} />
          <Row label="Mode" value={`${PAYMENT_METHODS[p.method]}${p.reference ? ` (réf. ${p.reference})` : ""}`} />
        </dl>

        <div className="my-4 rounded-md border-2 border-slate-800 p-3 text-center">
          <p className="tabular text-2xl font-black">{formatFCFA(p.amount)}</p>
          <p className="mt-1 text-sm italic">{amountToFrenchWords(p.amount)}</p>
        </div>

        {!p.voided && remainingAfter != null && (
          <p className="text-center font-semibold">
            {remainingAfter > 0 ? `Reste à payer sur cette période : ${formatFCFA(remainingAfter)}` : "Période soldée. Merci !"}
          </p>
        )}
        {p.voided && (
          <p className="text-center font-semibold text-danger">
            Paiement annulé le {formatDateTime(p.voided_at)} : {p.void_reason}
          </p>
        )}
        {p.note && <p className="mt-2 text-sm text-slate-600">Note : {p.note}</p>}

        <div className={cn("mt-8 flex gap-4 text-sm", thermal ? "flex-col" : "items-end justify-between")}>
          <p className="text-slate-600">
            Encaissé par {recorder?.full_name || "l'administration"}
            <br />
            le {formatDateTime(p.created_at)}
          </p>
          <div className="text-center">
            <div className="mb-1 h-14 w-48 border-b border-slate-400" />
            Signature et cachet
          </div>
        </div>

        {settings.receipt_footer && <p className="mt-6 text-center text-sm text-slate-600">{settings.receipt_footer}</p>}
      </article>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dotted border-slate-200 pb-1">
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
