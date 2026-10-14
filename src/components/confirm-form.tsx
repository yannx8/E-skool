"use client";

import { useState, type ReactNode } from "react";
import { AlertDialog, AlertDialogCancel } from "@/components/ui/dialog";
import { Button, buttonClasses, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { SubmitButton, useCloseOnSuccess, useFormAction } from "@/components/ui/client";
import { Alert } from "@/components/ui/misc";
import type { ActionResult } from "@/lib/errors";

/** Button that asks for confirmation before running an irreversible action. */
export function ConfirmForm({
  action,
  fields,
  trigger,
  triggerVariant = "secondary",
  triggerSize = "sm",
  title,
  description,
  confirmLabel,
  destructive,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  fields: Record<string, string>;
  trigger: ReactNode;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, onSubmit, pending] = useFormAction(action);
  useCloseOnSuccess(state, () => setOpen(false));
  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
      title={title}
      description={description}
      trigger={
        <Button variant={triggerVariant} size={triggerSize}>
          {trigger}
        </Button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {Object.entries(fields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel className={buttonClasses("secondary")}>Retour</AlertDialogCancel>
          <SubmitButton pending={pending} variant={destructive ? "destructive" : "primary"}>
            {confirmLabel}
          </SubmitButton>
        </div>
      </form>
    </AlertDialog>
  );
}
