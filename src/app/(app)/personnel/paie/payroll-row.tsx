"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote, FileText } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { MoneyInput, SubmitButton, useCloseOnSuccess, useFormAction } from "@/components/ui/client";
import { Alert } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { formatDate, formatFCFA } from "@/lib/format";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/labels";
import { deletePayrollEntry, payPayrollEntry, updatePayrollEntry } from "../actions";

export type PayrollRow = {
  id: string;
  staff_name: string;
  job_title: string;
  base_amount: number;
  advances: number;
  deductions: number;
  bonuses: number;
  net_amount: number;
  status: string;
  method: PaymentMethod | null;
  paid_at: string | null;
  payslip_number: string | null;
  notes: string | null;
};

function PayDialog({ row, today }: { row: PayrollRow; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, onSubmit, pending] = useFormAction(payPayrollEntry);
  useCloseOnSuccess(state, () => setOpen(false));
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={`Payer ${row.staff_name}`}
      description={`Net à payer : ${formatFCFA(row.net_amount)}. Une fois payé, la ligne ne peut plus être modifiée.`}
      trigger={
        <Button size="sm">
          <Banknote aria-hidden /> Marquer payé
        </Button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="id" value={row.id} />
        <Field label="Mode de paiement" htmlFor={`method-${row.id}`}>
          <Select id={`method-${row.id}`} name="method" defaultValue="cash">
            {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date du paiement" htmlFor={`paid-${row.id}`}>
          <Input
            id={`paid-${row.id}`}
            name="paid_at"
            type="date"
            defaultValue={today}
            max={today}
            required
          />
        </Field>
        {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
        <SubmitButton pending={pending}>Confirmer le paiement</SubmitButton>
      </form>
    </Dialog>
  );
}

export function PayrollRowCard({
  row,
  canManage,
  today,
}: {
  row: PayrollRow;
  canManage: boolean;
  today: string;
}) {
  const paid = row.status === "paid";
  return (
    <li className="space-y-3 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{row.staff_name}</p>
          <p className="text-sm text-slate-500">{row.job_title}</p>
        </div>
        <div className="text-right">
          <p className="tabular text-lg font-bold">{formatFCFA(row.net_amount)}</p>
          {paid ? (
            <Badge tone="success">
              Payé le {formatDate(row.paid_at)} ({row.method ? PAYMENT_METHODS[row.method] : ""})
            </Badge>
          ) : (
            <Badge tone="warning">À payer</Badge>
          )}
        </div>
      </div>

      {paid || !canManage ? (
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Salaire de base</dt>
            <dd className="tabular font-medium">{formatFCFA(row.base_amount)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Primes</dt>
            <dd className="tabular font-medium">{formatFCFA(row.bonuses)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Avances</dt>
            <dd className="tabular font-medium">{formatFCFA(row.advances)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Retenues</dt>
            <dd className="tabular font-medium">{formatFCFA(row.deductions)}</dd>
          </div>
        </dl>
      ) : (
        <ActionForm action={updatePayrollEntry} className="space-y-3">
          <input type="hidden" name="id" value={row.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Salaire de base</p>
              <p className="tabular flex h-11 items-center font-semibold">
                {formatFCFA(row.base_amount)}
              </p>
            </div>
            <Field label="Primes" htmlFor={`bonuses-${row.id}`}>
              <MoneyInput name="bonuses" id={`bonuses-${row.id}`} defaultValue={row.bonuses} />
            </Field>
            <Field label="Avances déjà versées" htmlFor={`advances-${row.id}`}>
              <MoneyInput name="advances" id={`advances-${row.id}`} defaultValue={row.advances} />
            </Field>
            <Field label="Retenues" htmlFor={`deductions-${row.id}`}>
              <MoneyInput
                name="deductions"
                id={`deductions-${row.id}`}
                defaultValue={row.deductions}
              />
            </Field>
          </div>
          <Field label="Note" htmlFor={`notes-${row.id}`}>
            <Input
              id={`notes-${row.id}`}
              name="notes"
              maxLength={300}
              defaultValue={row.notes ?? ""}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <ActionSubmit variant="secondary" size="sm">
              Mettre à jour
            </ActionSubmit>
          </div>
        </ActionForm>
      )}

      <div className="flex flex-wrap gap-2">
        {paid ? (
          <Link href={`/bulletin/${row.id}`} className={buttonClasses("secondary", "sm")}>
            <FileText aria-hidden /> Bulletin {row.payslip_number}
          </Link>
        ) : (
          canManage && (
            <>
              <PayDialog row={row} today={today} />
              <ActionForm action={deletePayrollEntry}>
                <input type="hidden" name="id" value={row.id} />
                <ActionSubmit variant="ghost" size="sm">
                  Retirer ce mois
                </ActionSubmit>
              </ActionForm>
            </>
          )
        )}
      </div>
    </li>
  );
}
