"use client";

import { Field, Input } from "@/components/ui/form";
import { ActionFeedback, SubmitButton, useFormAction } from "@/components/ui/client";
import { signIn } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, onSubmit, pending] = useFormAction(signIn);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Mot de passe" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <ActionFeedback state={state} />
      <SubmitButton pending={pending} className="w-full" pendingLabel="Connexion…">
        Se connecter
      </SubmitButton>
    </form>
  );
}
