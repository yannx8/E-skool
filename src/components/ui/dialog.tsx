"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as AlertPrimitive from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const overlay = "fixed inset-0 z-40 bg-slate-900/50";
const panel =
  "fixed z-50 bg-white shadow-xl focus:outline-none " +
  "inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-2xl p-5 " +
  "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl";

export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlay} />
        <DialogPrimitive.Content className={cn(panel, className)}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-xl font-semibold text-slate-900">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-slate-600">{description}</DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="-m-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fermer">
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const DialogClose = DialogPrimitive.Close;

/** Confirmation dialog for destructive or irreversible actions. */
export function AlertDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AlertPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertPrimitive.Trigger asChild>{trigger}</AlertPrimitive.Trigger>}
      <AlertPrimitive.Portal>
        <AlertPrimitive.Overlay className={overlay} />
        <AlertPrimitive.Content className={panel}>
          <AlertPrimitive.Title className="text-xl font-semibold text-slate-900">{title}</AlertPrimitive.Title>
          {description ? (
            <AlertPrimitive.Description className="mt-1 mb-4 text-slate-600">{description}</AlertPrimitive.Description>
          ) : (
            <AlertPrimitive.Description className="sr-only">{title}</AlertPrimitive.Description>
          )}
          {children}
        </AlertPrimitive.Content>
      </AlertPrimitive.Portal>
    </AlertPrimitive.Root>
  );
}

export const AlertDialogCancel = AlertPrimitive.Cancel;
