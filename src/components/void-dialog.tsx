"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertDialog, AlertDialogCancel } from "@/components/ui/dialog";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/form";
import { SubmitButton, useFormAction } from "@/components/ui/client";
import { Alert } from "@/components/ui/misc";
import type { ActionResult } from "@/lib/errors";

/**
 * Void with a mandatory reason (min 5 characters). Used for payments,
 * expenses and other income: the record stays visible, struck through.
 */
export function VoidDialog({
  action,
  idName,
  id,
  title,
  description,
  trigger,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  idName: string;
  id: string;
  title: string;
  description: ReactNode;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, onSubmit, pending] = useFormAction(action);
  const router = useRouter();
  const handled = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (state?.ok && handled.current !== state) {
      handled.current = state;
      toast.success(state.message ?? "Annulé.");
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
      title={title}
      description={description}
      trigger={
        trigger ?? (
          <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft">
            Annuler
          </Button>
        )
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name={idName} value={id} />
        <Field
          label="Motif de l'annulation"
          htmlFor={`reason-${id}`}
          hint="Au moins 5 caractères, par exemple « erreur de saisie »."
        >
          <Textarea
            id={`reason-${id}`}
            name="reason"
            required
            minLength={5}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel className={buttonClasses("secondary")}>Retour</AlertDialogCancel>
          <SubmitButton
            pending={pending}
            variant="destructive"
            disabled={reason.trim().length < 5}
            pendingLabel="Annulation…"
          >
            Confirmer l&apos;annulation
          </SubmitButton>
        </div>
      </form>
    </AlertDialog>
  );
}
