"use client";

import { useState } from "react";
import { Plus, UserCheck } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton, useCloseOnSuccess, useFormAction } from "@/components/ui/client";
import { Alert } from "@/components/ui/misc";
import { createApplication, enrollApplication } from "./actions";

type Option = { id: string; name: string };

export function NewApplicationDialog({ classes }: { classes: Option[] }) {
  const [open, setOpen] = useState(false);
  const [state, onSubmit, pending] = useFormAction(createApplication);
  useCloseOnSuccess(state, () => setOpen(false));
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Nouvelle demande d'inscription"
      trigger={
        <Button>
          <Plus aria-hidden /> Nouvelle demande
        </Button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nom de l'enfant" htmlFor="child_last_name">
            <Input id="child_last_name" name="child_last_name" required maxLength={80} />
          </Field>
          <Field label="Prénom(s)" htmlFor="child_first_name">
            <Input id="child_first_name" name="child_first_name" maxLength={80} />
          </Field>
          <Field label="Date de naissance" htmlFor="birth_date">
            <Input id="birth_date" name="birth_date" type="date" />
          </Field>
          <Field label="Classe demandée" htmlFor="desired_class_id">
            <Select id="desired_class_id" name="desired_class_id" defaultValue="">
              <option value="">Non précisée</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Parent" htmlFor="parent_name">
            <Input id="parent_name" name="parent_name" maxLength={120} />
          </Field>
          <Field label="Téléphone" htmlFor="parent_phone">
            <Input id="parent_phone" name="parent_phone" type="tel" />
          </Field>
        </div>
        <Field label="Comment nous a-t-il connus ?" htmlFor="source">
          <Input
            id="source"
            name="source"
            maxLength={80}
            placeholder="Bouche à oreille, affiche…"
          />
        </Field>
        <Field label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" maxLength={1000} />
        </Field>
        {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
        <SubmitButton pending={pending}>Enregistrer la demande</SubmitButton>
      </form>
    </Dialog>
  );
}

export function EnrollDialog({
  applicationId,
  childName,
  classes,
  years,
  defaultClassId,
  defaultYearId,
}: {
  applicationId: string;
  childName: string;
  classes: Option[];
  years: { id: string; label: string }[];
  defaultClassId: string | null;
  defaultYearId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, onSubmit, pending] = useFormAction(enrollApplication);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={`Inscrire ${childName}`}
      description="Crée la fiche élève et l'inscrit dans la classe choisie. Vous pourrez ensuite encaisser l'inscription."
      trigger={
        <Button size="sm">
          <UserCheck aria-hidden /> Inscrire
        </Button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="id" value={applicationId} />
        <Field label="Année scolaire" htmlFor={`year-${applicationId}`}>
          <Select
            id={`year-${applicationId}`}
            name="school_year_id"
            defaultValue={defaultYearId ?? years[0]?.id}
            required
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Classe" htmlFor={`class-${applicationId}`}>
          <Select
            id={`class-${applicationId}`}
            name="class_id"
            defaultValue={defaultClassId ?? ""}
            required
          >
            <option value="" disabled>
              Choisir
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
        <SubmitButton pending={pending}>Confirmer l&apos;inscription</SubmitButton>
      </form>
    </Dialog>
  );
}
