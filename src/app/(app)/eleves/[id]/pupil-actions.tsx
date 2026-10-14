"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Percent, UserMinus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { SubmitButton, useCloseOnSuccess, useFormAction } from "@/components/ui/client";
import { Alert } from "@/components/ui/misc";
import { FEE_TYPES } from "@/lib/labels";
import { addDiscount, deactivatePupil } from "../actions";

export function LeaveDialog({ pupilId, today }: { pupilId: string; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, onSubmit, pending] = useFormAction(deactivatePupil);
  useCloseOnSuccess(state, () => setOpen(false));
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Marquer l'élève comme parti"
      description="L'élève n'apparaîtra plus dans les listes par défaut. Son historique et ses paiements sont conservés."
      trigger={
        <Button variant="secondary">
          <UserMinus aria-hidden /> Départ
        </Button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="id" value={pupilId} />
        <Field label="Raison du départ" htmlFor="left_reason">
          <Input id="left_reason" name="left_reason" required minLength={3} maxLength={300} placeholder="Déménagement, changement d'école…" />
        </Field>
        <Field label="Date du départ" htmlFor="left_on">
          <Input id="left_on" name="left_on" type="date" defaultValue={today} max={today} />
        </Field>
        {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
        <SubmitButton pending={pending} variant="destructive">
          Confirmer le départ
        </SubmitButton>
      </form>
    </Dialog>
  );
}

export function DiscountDialog({ pupilId, termLabel, termsCount }: { pupilId: string; termLabel: string; termsCount: number }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [state, onSubmit, pending] = useFormAction(addDiscount);
  useCloseOnSuccess(state, () => setOpen(false));
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Accorder une réduction"
      description="Exemple : réduction fratrie, enfant du personnel, bourse. Elle s'applique sur l'année affichée."
      trigger={
        <Button variant="secondary" size="sm">
          <Percent aria-hidden /> Réduction
        </Button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="pupil_id" value={pupilId} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Frais concernés" htmlFor="fee">
            <Select id="fee" name="fee" defaultValue="tuition">
              <option value="">Tous les frais</option>
              {Object.entries(FEE_TYPES).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={termLabel} htmlFor="term">
            <Select id="term" name="term" defaultValue="">
              <option value="">Toutes</option>
              {Array.from({ length: termsCount }, (_, i) => i + 1).map((t) => (
                <option key={t} value={t}>
                  {termLabel} {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type" htmlFor="kind">
            <Select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as "percent" | "fixed")}>
              <option value="percent">Pourcentage</option>
              <option value="fixed">Montant fixe (FCFA)</option>
            </Select>
          </Field>
          <Field label={kind === "percent" ? "Pourcentage" : "Montant par période"} htmlFor="value">
            <Input id="value" name="value" type="number" inputMode="numeric" min={1} max={kind === "percent" ? 100 : undefined} required />
          </Field>
        </div>
        <Field label="Motif" htmlFor="reason">
          <Input id="reason" name="reason" required minLength={3} maxLength={200} placeholder="Réduction fratrie" />
        </Field>
        {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
        <SubmitButton pending={pending}>Enregistrer la réduction</SubmitButton>
      </form>
    </Dialog>
  );
}

export function CopyLinkButton({ url }: { url: string }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Lien copié.");
        } catch {
          toast.error("Copie impossible : sélectionnez le lien à la main.");
        }
      }}
    >
      <Copy aria-hidden /> Copier le lien
    </Button>
  );
}
