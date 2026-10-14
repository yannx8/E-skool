"use client";

import { useActionState, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton, useUnsavedChangesWarning } from "@/components/ui/client";
import { Alert } from "@/components/ui/misc";
import { formatPhone } from "@/lib/phone";
import type { ActionResult } from "@/lib/errors";

type Pupil = {
  id: string;
  last_name: string;
  first_name: string;
  parent_name: string | null;
  parent_phone: string | null;
  parent_phone_alt: string | null;
  notes: string | null;
  class_id: string | null;
};

export function PupilForm({
  action,
  classes,
  pupil,
  canPay,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  classes: { id: string; name: string }[];
  pupil?: Pupil;
  canPay?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);
  const err = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} onChange={() => setDirty(true)} onSubmit={() => setDirty(false)} className="space-y-4">
      {pupil && <input type="hidden" name="id" value={pupil.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" htmlFor="last_name" error={err.last_name}>
          <Input
            id="last_name"
            name="last_name"
            required
            maxLength={80}
            autoCapitalize="characters"
            defaultValue={pupil?.last_name}
            aria-invalid={!!err.last_name}
            autoFocus={!pupil}
          />
        </Field>
        <Field label="Prénom(s)" htmlFor="first_name" error={err.first_name}>
          <Input id="first_name" name="first_name" maxLength={80} defaultValue={pupil?.first_name} />
        </Field>
      </div>
      <Field label="Classe" htmlFor="class_id" error={err.class_id}>
        <Select id="class_id" name="class_id" required defaultValue={pupil?.class_id ?? ""} aria-invalid={!!err.class_id}>
          <option value="" disabled>
            Choisir la classe
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom du parent ou tuteur" htmlFor="parent_name">
          <Input id="parent_name" name="parent_name" maxLength={120} defaultValue={pupil?.parent_name ?? ""} />
        </Field>
        <Field label="Téléphone du parent (WhatsApp)" htmlFor="parent_phone" error={err.parent_phone} hint="Ex. 6 77 12 34 56">
          <Input
            id="parent_phone"
            name="parent_phone"
            type="tel"
            inputMode="tel"
            defaultValue={formatPhone(pupil?.parent_phone)}
            aria-invalid={!!err.parent_phone}
          />
        </Field>
        <Field label="Second téléphone (facultatif)" htmlFor="parent_phone_alt" error={err.parent_phone_alt}>
          <Input
            id="parent_phone_alt"
            name="parent_phone_alt"
            type="tel"
            inputMode="tel"
            defaultValue={formatPhone(pupil?.parent_phone_alt)}
            aria-invalid={!!err.parent_phone_alt}
          />
        </Field>
      </div>
      <Field label="Notes (facultatif)" htmlFor="notes">
        <Textarea id="notes" name="notes" maxLength={1000} defaultValue={pupil?.notes ?? ""} />
      </Field>
      {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
      <div className="flex flex-wrap gap-2">
        <SubmitButton>{pupil ? "Enregistrer les modifications" : "Ajouter l'élève"}</SubmitButton>
        {!pupil && canPay && (
          <SubmitButton variant="secondary" name="then" value="payer">
            Ajouter et encaisser
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
