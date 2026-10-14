"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/client";
import { Alert } from "@/components/ui/misc";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(requestPasswordReset, null);
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Mot de passe oublié</h1>
      <p className="mb-5 text-slate-600">Recevez un lien par email pour choisir un nouveau mot de passe.</p>
      {state?.ok ? (
        <Alert tone="success">{state.message}</Alert>
      ) : (
        <form action={action} className="space-y-4">
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
          </Field>
          {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
          <SubmitButton className="w-full" pendingLabel="Envoi…">
            Envoyer le lien
          </SubmitButton>
        </form>
      )}
      <p className="mt-5 text-center">
        <Link href="/connexion" className="inline-block min-h-11 py-2 text-primary underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
