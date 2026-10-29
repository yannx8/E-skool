"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export type ActionResult = { error?: string; ok?: string; go?: string } | void;

/**
 * Submits a server action without React's automatic form reset, so a failed
 * submit keeps what the cashier typed. Errors and successes show as toasts.
 */
export function ActionForm({
  action,
  children,
  className,
  onDone,
  confirm,
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  onDone?: () => void;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      // Never let a submit before hydration put field values (passwords) in the URL.
      method="post"
      className={className}
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        start(async () => {
          const r = await action(fd);
          if (r?.error) return void toast.error(r.error);
          if (r?.ok) toast.success(r.ok);
          onDone?.();
          form.dispatchEvent(new Event("action-done", { bubbles: true }));
          if (r?.go) router.push(r.go);
          else {
            form.reset();
            router.refresh();
          }
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
