"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { ActionFeedback, SubmitButton, useFormAction } from "@/components/ui/client";
import type { ButtonSize, ButtonVariant } from "@/components/ui/button";
import type { ActionResult } from "@/lib/errors";

const PendingContext = createContext(false);

/**
 * Small form wired to a server action: inline error that persists, success
 * toast. Use <ActionSubmit> inside for a button that knows the pending state.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  /** Clear the fields after a successful submit (creation forms). */
  resetOnSuccess?: boolean;
}) {
  const [state, onSubmit, pending] = useFormAction(action);
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef<ActionResult | null>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok && handled.current !== state) {
      handled.current = state;
      formRef.current?.reset();
    }
  }, [state, resetOnSuccess]);
  return (
    <form ref={formRef} onSubmit={onSubmit} className={className}>
      <PendingContext value={pending}>{children}</PendingContext>
      {state && (
        <div className="mt-3">
          <ActionFeedback state={state} />
        </div>
      )}
    </form>
  );
}

export function ActionSubmit({
  children,
  variant,
  size,
  className,
  disabled,
  name,
  value,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  const pending = useContext(PendingContext);
  return (
    <SubmitButton
      pending={pending}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      name={name}
      value={value}
    >
      {children}
    </SubmitButton>
  );
}
