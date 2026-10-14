"use client";

import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/client";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { CONTRACT_TYPES } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import type { ActionResult } from "@/lib/errors";

type Staff = {
  id: string;
  full_name: string;
  job_title: string;
  contract: keyof typeof CONTRACT_TYPES;
  phone: string | null;
  start_date: string | null;
  notes: string | null;
};

export function StaffForm({
  action,
  staff,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  staff?: Staff;
}) {
  return (
    <ActionForm action={action} className="space-y-4">
      {staff && <input type="hidden" name="id" value={staff.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet" htmlFor="full_name">
          <Input
            id="full_name"
            name="full_name"
            required
            maxLength={120}
            defaultValue={staff?.full_name}
            autoFocus={!staff}
          />
        </Field>
        <Field label="Fonction" htmlFor="job_title" hint="Institutrice CP, Gardien, Cuisinière…">
          <Input
            id="job_title"
            name="job_title"
            required
            maxLength={80}
            defaultValue={staff?.job_title}
          />
        </Field>
        <Field label="Contrat" htmlFor="contract">
          <Select id="contract" name="contract" defaultValue={staff?.contract ?? "permanent"}>
            {Object.entries(CONTRACT_TYPES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Téléphone" htmlFor="phone">
          <Input id="phone" name="phone" type="tel" defaultValue={formatPhone(staff?.phone)} />
        </Field>
        <Field label="Date d'embauche" htmlFor="start_date">
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={staff?.start_date ?? ""}
          />
        </Field>
        {!staff && (
          <Field
            label="Salaire mensuel convenu"
            htmlFor="monthly_amount"
            hint="Laissez vide pour un bénévole."
          >
            <MoneyInput name="monthly_amount" id="monthly_amount" />
          </Field>
        )}
      </div>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" maxLength={1000} defaultValue={staff?.notes ?? ""} />
      </Field>
      <ActionSubmit>{staff ? "Enregistrer" : "Ajouter"}</ActionSubmit>
    </ActionForm>
  );
}
