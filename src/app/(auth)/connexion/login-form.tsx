"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/form";
import { ActionFeedback, SubmitButton } from "@/components/ui/client";
import { signIn } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Mot de passe" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <ActionFeedback state={state} />
      <SubmitButton className="w-full" pendingLabel="Connexion…">
        Se connecter
      </SubmitButton>
    </form>
  );
}
