"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { formatNumber, parseAmount } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ActionResult } from "@/lib/errors";

/**
 * Server action bound to a form through onSubmit instead of the form `action`
 * prop. React 19 resets uncontrolled fields after every form action, even a
 * failed one; submitting in a transition keeps what the user typed when the
 * server answers with an error.
 */
export function useFormAction<S>(action: (prev: S | null, formData: FormData) => Promise<S>) {
  const [state, dispatch, pending] = useActionState<S | null, FormData>(action, null);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const formData = new FormData(e.currentTarget);
    if (submitter?.name) formData.set(submitter.name, submitter.value);
    startTransition(() => dispatch(formData));
  };
  return [state, onSubmit, pending] as const;
}

/** Submit button with a spinner. Pass `pending` from useFormAction. */
export function SubmitButton({
  children,
  pending: pendingProp,
  pendingLabel,
  variant,
  size,
  className,
  disabled,
  ...props
}: Omit<ComponentProps<"button">, "type"> & {
  pending?: boolean;
  pendingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const status = useFormStatus();
  const pending = pendingProp || status.pending;
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending || disabled} {...props}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {pending ? (pendingLabel ?? "Enregistrement…") : children}
    </Button>
  );
}

/** Inline error (persists) for an action result; success goes to a toast. */
export function ActionFeedback({ state }: { state: ActionResult<unknown> | null }) {
  const last = useRef<ActionResult<unknown> | null>(null);
  useEffect(() => {
    if (state && state !== last.current && state.ok && state.message) {
      toast.success(state.message, { duration: 3000 });
    }
    last.current = state;
  }, [state]);
  if (!state || state.ok) return null;
  return <Alert tone="danger">{state.error}</Alert>;
}

/**
 * Amount field that formats with spaces as the user types ("15 000") and
 * submits the raw integer through a hidden input with the given name.
 */
export function MoneyInput({
  name,
  id,
  defaultValue,
  value: controlled,
  onValueChange,
  required,
  autoFocus,
  invalid,
  className,
  placeholder = "0",
}: {
  name: string;
  id?: string;
  defaultValue?: number | null;
  value?: number | null;
  onValueChange?: (v: number | null) => void;
  required?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [internal, setInternal] = useState<number | null>(defaultValue ?? null);
  const value = controlled !== undefined ? controlled : internal;
  return (
    <div className={cn("relative", className)}>
      <input
        id={id ?? name}
        inputMode="numeric"
        autoComplete="off"
        required={required}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={value == null ? "" : formatNumber(value)}
        onChange={(e) => {
          const v = parseAmount(e.target.value);
          const capped = v != null && v > 999_999_999 ? 999_999_999 : v;
          setInternal(capped);
          onValueChange?.(capped);
        }}
        className={cn(
          "tabular block h-11 w-full rounded-lg border border-slate-300 bg-white pr-16 pl-3 text-lg font-semibold text-slate-900",
          "focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none aria-[invalid=true]:border-danger",
        )}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-slate-500">
        FCFA
      </span>
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}

/** A select inside a GET filter form that submits the form on change. */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      onChange={(e) => {
        props.onChange?.(e);
        e.currentTarget.form?.requestSubmit();
      }}
      className={cn(
        "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900",
        "focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none",
        props.className,
      )}
    />
  );
}

/** Warns before leaving the page with unsaved changes (reload, close, back). */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}

export function PrintButton({ children = "Imprimer" }: { children?: ReactNode }) {
  return (
    <Button onClick={() => window.print()} className="no-print">
      {children}
    </Button>
  );
}

/** Reacts once to each successful action result: toast, close the dialog, refresh data. */
export function useCloseOnSuccess(state: ActionResult<unknown> | null, close: () => void) {
  const router = useRouter();
  const handled = useRef<ActionResult<unknown> | null>(null);
  useEffect(() => {
    if (state?.ok && handled.current !== state) {
      handled.current = state;
      toast.success(state.message ?? "Enregistré.");
      close();
      router.refresh();
    }
  }, [state, close, router]);
}
