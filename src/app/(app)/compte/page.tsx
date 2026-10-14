import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DefinitionList, PageHeader } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/labels";
import { signOut } from "@/app/(auth)/actions";
import { changePassword } from "./actions";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Mon compte" />
      <div className="max-w-xl space-y-6">
        <Card>
          <CardBody>
            <DefinitionList
              items={[
                { label: "Nom", value: user.fullName },
                { label: "Email", value: user.email },
                { label: "Rôle", value: ROLES[user.role] },
              ]}
            />
          </CardBody>
        </Card>
        <Card id="mot-de-passe">
          <CardHeader title="Changer de mot de passe" description="Utilisez au moins 10 caractères, avec des chiffres." />
          <CardBody>
            <ActionForm action={changePassword} className="space-y-4" resetOnSuccess>
              <Field label="Nouveau mot de passe" htmlFor="password">
                <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
              </Field>
              <Field label="Confirmer" htmlFor="confirm">
                <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
              </Field>
              <ActionSubmit>Changer le mot de passe</ActionSubmit>
            </ActionForm>
          </CardBody>
        </Card>
        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full sm:w-auto">
            <LogOut aria-hidden /> Se déconnecter
          </Button>
        </form>
      </div>
    </>
  );
}
