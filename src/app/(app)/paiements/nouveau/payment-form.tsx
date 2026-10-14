"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { PupilSearch } from "@/components/pupil-search";
import { Field, Input, Textarea } from "@/components/ui/form";
import { MoneyInput, SubmitButton, useFormAction, useUnsavedChangesWarning } from "@/components/ui/client";
import { Alert } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatDate, formatFCFA, fullName } from "@/lib/format";
import { feeLineName, PAYMENT_METHODS, type PaymentMethod } from "@/lib/labels";
import { pupilBalance, recordPayment, type BalanceLine, type PupilHit, type RecordPaymentState } from "../actions";

const METHODS = Object.entries(PAYMENT_METHODS) as [PaymentMethod, string][];
const lineKey = (l: { fee: string; term: number | null }) => `${l.fee}|${l.term ?? ""}`;

/** First line still owed, with its balance as the suggested amount. */
function defaultSelection(lines: BalanceLine[]) {
  const first = lines.find((l) => l.remaining > 0) ?? lines[0];
  return { lineValue: first ? lineKey(first) : "", amount: first && first.remaining > 0 ? first.remaining : null };
}

type Props = { today: string; termLabel: string; initialPupil: PupilHit | null; initialLines: BalanceLine[] };

/** "Ne pas enregistrer" remounts the form so every field and warning starts fresh. */
export function PaymentForm(props: Props) {
  const [run, setRun] = useState(0);
  return run === 0 ? (
    <PaymentFormInner {...props} onReset={() => setRun(1)} />
  ) : (
    <PaymentFormInner key={run} {...props} initialPupil={null} initialLines={[]} onReset={() => setRun((r) => r + 1)} />
  );
}

function PaymentFormInner({ today, termLabel, initialPupil, initialLines, onReset }: Props & { onReset: () => void }) {
  const [pupil, setPupil] = useState<PupilHit | null>(initialPupil);
  const [lines, setLines] = useState<BalanceLine[]>(initialLines);
  const [lineValue, setLineValue] = useState<string>(() => defaultSelection(initialLines).lineValue);
  const [amount, setAmount] = useState<number | null>(() => defaultSelection(initialLines).amount);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [loadingLines, startLoading] = useTransition();
  const [state, onSubmit, pending] = useFormAction<RecordPaymentState>(recordPayment);

  // Leaving with a pupil selected and nothing saved asks for confirmation.
  // A successful save navigates client-side to the receipt, which never triggers it.
  useUnsavedChangesWarning(!!pupil && !pending);

  function applyLines(next: BalanceLine[]) {
    const d = defaultSelection(next);
    setLines(next);
    setLineValue(d.lineValue);
    setAmount(d.amount);
  }

  function choosePupil(hit: PupilHit) {
    setPupil(hit);
    applyLines([]);
    startLoading(async () => applyLines(await pupilBalance(hit.pupil_id)));
  }

  const selected = lines.find((l) => lineKey(l) === lineValue);
  const duplicates = state && !state.ok && "duplicates" in state ? state.duplicates : undefined;

  if (!pupil) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Élève</label>
        <PupilSearch onSelect={choosePupil} autoFocus />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="pupil_id" value={pupil.pupil_id} />

      <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{fullName(pupil)}</p>
          <p className="text-slate-600">
            {pupil.class_name}
            {pupil.parent_name ? ` · ${pupil.parent_name}` : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPupil(null);
            applyLines([]);
          }}
        >
          <X aria-hidden /> Changer
        </Button>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Période payée</legend>
        {loadingLines ? (
          <p className="flex items-center gap-2 text-slate-500">
            <Loader2 className="size-5 animate-spin" aria-hidden /> Chargement du solde…
          </p>
        ) : lines.length === 0 ? (
          <Alert tone="warning">
            Aucun frais n&apos;est configuré pour la classe {pupil.class_name}. Ajoutez-les dans Configuration &gt; Frais.
          </Alert>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {lines.map((l) => {
              const key = lineKey(l);
              return (
                <label
                  key={key}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2",
                    key === lineValue ? "border-primary bg-primary-soft" : "border-slate-200 bg-white",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="line"
                      value={key}
                      checked={key === lineValue}
                      onChange={() => {
                        setLineValue(key);
                        setAmount(l.remaining > 0 ? l.remaining : null);
                      }}
                      className="size-5 accent-primary"
                    />
                    <span>
                      <span className="block font-medium">{feeLineName(l.fee, l.term, termLabel)}</span>
                      <span className="block text-sm text-slate-500">Échéance {formatDate(l.due_date)}</span>
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="tabular block font-semibold">{formatFCFA(l.remaining)}</span>
                    <StatusBadge status={l.status} />
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      <Field
        label="Montant reçu"
        htmlFor="amount"
        hint={selected ? `Reste à payer sur cette période : ${formatFCFA(selected.remaining)}` : undefined}
      >
        <MoneyInput name="amount" id="amount" value={amount} onValueChange={setAmount} required />
      </Field>
      {selected && amount != null && amount > selected.remaining && (
        <Alert tone="info">
          Montant supérieur au reste : {formatFCFA(amount - selected.remaining)} seront reportés sur la période suivante.
        </Alert>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Mode de paiement</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {METHODS.map(([value, label]) => (
            <label
              key={value}
              className={cn(
                "flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-3 text-center font-medium",
                method === value ? "border-primary bg-primary text-white" : "border-slate-300 bg-white text-slate-800",
              )}
            >
              <input
                type="radio"
                name="method"
                value={value}
                checked={method === value}
                onChange={() => setMethod(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {method !== "cash" && (
          <Field label="Référence de la transaction (facultatif)" htmlFor="reference" hint="Collez l'identifiant reçu par SMS.">
            <Input id="reference" name="reference" autoComplete="off" maxLength={100} />
          </Field>
        )}
        <Field label="Date du paiement" htmlFor="paid_at">
          <Input id="paid_at" name="paid_at" type="date" defaultValue={today} max={today} required />
        </Field>
      </div>

      <details className="rounded-lg border border-slate-200 bg-white px-3">
        <summary className="min-h-11 cursor-pointer py-2.5 font-medium text-slate-700">Ajouter une note</summary>
        <Textarea name="note" maxLength={500} className="mb-3" aria-label="Note" />
      </details>

      {state && !state.ok && !duplicates && <Alert tone="danger">{state.error}</Alert>}

      {duplicates && duplicates.length > 0 ? (
        <div className="space-y-3 rounded-lg border border-warning/40 bg-warning-soft p-4">
          <p className="flex items-center gap-2 font-semibold text-warning">
            <AlertTriangle className="size-5" aria-hidden /> Paiement peut-être déjà enregistré
          </p>
          <ul className="space-y-1 text-[15px] text-slate-800">
            {duplicates.map((d) => (
              <li key={d.id}>
                Reçu {d.receipt_number} : {d.pupil_name}, {formatFCFA(d.amount)} le {formatDate(d.paid_at)} (
                {PAYMENT_METHODS[d.method]}
                {d.reference ? `, réf. ${d.reference}` : ""})
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <SubmitButton pending={pending} name="force" value="1" variant="primary">
              Enregistrer quand même
            </SubmitButton>
            <Button variant="secondary" onClick={onReset}>
              Ne pas enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <SubmitButton pending={pending} size="lg" className="w-full sm:w-auto" disabled={!lineValue || !amount}>
          Enregistrer le paiement
        </SubmitButton>
      )}
    </form>
  );
}
