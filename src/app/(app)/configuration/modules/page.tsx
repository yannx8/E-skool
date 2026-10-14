import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { getSettings, requirePermission } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { saveModules } from "../actions";

export const metadata: Metadata = { title: "Modules" };

export default async function ModulesPage() {
  await requirePermission("manageSetup");
  const settings = await getSettings();
  const env = serverEnv();
  const whatsappReady = !!(env.whatsappToken && env.whatsappPhoneNumberId && env.whatsappTemplateName);

  return (
    <>
      <PageHeader
        title="Modules"
        description="Activez les parties de l'application au rythme de l'école. Les données restent conservées si un module est désactivé."
        back={{ href: "/configuration", label: "Configuration" }}
      />
      <ActionForm action={saveModules} className="max-w-3xl space-y-6">
        <Card>
          <CardHeader title="Parties de l'application" />
          <CardBody className="space-y-2">
            <Checkbox name="module_hr" defaultChecked={settings.module_hr} label="Personnel et paie (fiches, salaires, bulletins)" />
            <Checkbox
              name="module_finance"
              defaultChecked={settings.module_finance}
              label="Finances (dépenses, autres revenus, journal de caisse, clôture, rapports)"
            />
            <Checkbox
              name="module_enrollment"
              defaultChecked={settings.module_enrollment}
              label="Inscriptions (suivi des demandes de nouveaux élèves)"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Relances automatiques WhatsApp"
            description="Envoi automatique d'un message aux parents en retard de paiement, une fois par jour."
          />
          <CardBody className="space-y-4">
            {!whatsappReady && (
              <Alert tone="info" title="Non configuré">
                L&apos;envoi automatique nécessite un compte WhatsApp Business (API Cloud de Meta) et un modèle de message
                approuvé. Les variables WHATSAPP_* doivent être renseignées sur le serveur. Les relances manuelles (bouton
                « Relancer ») fonctionnent sans cela.
              </Alert>
            )}
            <Checkbox
              name="auto_reminders_enabled"
              defaultChecked={settings.auto_reminders_enabled}
              disabled={!whatsappReady && !settings.auto_reminders_enabled}
              label="Activer les relances automatiques"
            />
            <Field label="Ne pas relancer un même parent plus d'une fois tous les (jours)" htmlFor="auto_reminder_interval_days">
              <Input
                id="auto_reminder_interval_days"
                name="auto_reminder_interval_days"
                type="number"
                min={1}
                max={60}
                defaultValue={settings.auto_reminder_interval_days}
                className="max-w-32"
              />
            </Field>
          </CardBody>
        </Card>
        <ActionSubmit>Enregistrer</ActionSubmit>
      </ActionForm>
    </>
  );
}
