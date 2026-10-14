import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { ROLES } from "@/lib/labels";
import { createUser, resetUserPassword, updateUser } from "../actions";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function UsersPage() {
  const me = await requirePermission("manageUsers");
  if (!serverEnv().serviceRoleKey) {
    return (
      <>
        <PageHeader
          title="Utilisateurs"
          back={{ href: "/configuration", label: "Configuration" }}
        />
        <Alert tone="warning">
          La clé SUPABASE_SECRET_KEY n&apos;est pas configurée sur le serveur.
        </Alert>
      </>
    );
  }
  const admin = createAdminClient();
  const [{ data: roles }, { data: authUsers }] = await Promise.all([
    admin.from("user_roles").select("*").order("created_at"),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);
  const byId = new Map((authUsers?.users ?? []).map((u) => [u.id, u]));

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description="Chaque personne a son propre compte. Le fondateur ne voit que les chiffres, sans pouvoir modifier."
        back={{ href: "/configuration", label: "Configuration" }}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Comptes" />
          <ul className="divide-y divide-slate-100">
            {(roles ?? []).map((r) => {
              const u = byId.get(r.user_id);
              const isMe = r.user_id === me.id;
              return (
                <li key={r.user_id} className="space-y-3 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {r.full_name || u?.email}
                        {isMe && (
                          <Badge tone="info" className="ml-2">
                            Vous
                          </Badge>
                        )}
                        {!r.is_active && (
                          <Badge tone="muted" className="ml-2">
                            Désactivé
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">
                        {u?.email} · dernière connexion{" "}
                        {u?.last_sign_in_at ? formatDateTime(u.last_sign_in_at) : "jamais"}
                      </p>
                    </div>
                  </div>
                  <ActionForm action={updateUser} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="user_id" value={r.user_id} />
                    <Field label="Rôle" htmlFor={`role-${r.user_id}`}>
                      <Select id={`role-${r.user_id}`} name="role" defaultValue={r.role}>
                        {Object.entries(ROLES).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <label className="flex h-11 items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={r.is_active}
                        className="size-5 accent-primary"
                      />
                      Accès actif
                    </label>
                    <ActionSubmit variant="secondary" size="sm" className="h-11">
                      Mettre à jour
                    </ActionSubmit>
                  </ActionForm>
                  {!isMe && (
                    <details>
                      <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-primary">
                        Définir un nouveau mot de passe
                      </summary>
                      <ActionForm
                        action={resetUserPassword}
                        className="flex flex-wrap items-end gap-3"
                        resetOnSuccess
                      >
                        <input type="hidden" name="user_id" value={r.user_id} />
                        <Field label="Mot de passe provisoire" htmlFor={`pwd-${r.user_id}`}>
                          <Input
                            id={`pwd-${r.user_id}`}
                            name="password"
                            type="text"
                            minLength={10}
                            required
                            autoComplete="off"
                          />
                        </Field>
                        <ActionSubmit variant="secondary" size="sm" className="h-11">
                          Enregistrer
                        </ActionSubmit>
                      </ActionForm>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Nouveau compte"
            description="Communiquez l'email et le mot de passe provisoire en main propre."
          />
          <CardBody>
            <ActionForm action={createUser} className="space-y-4" resetOnSuccess>
              <Field label="Nom complet" htmlFor="full_name">
                <Input id="full_name" name="full_name" required maxLength={80} />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input id="email" name="email" type="email" required autoComplete="off" />
              </Field>
              <Field label="Rôle" htmlFor="role">
                <Select id="role" name="role" defaultValue="secretary">
                  {Object.entries(ROLES).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Mot de passe provisoire"
                htmlFor="password"
                hint="10 caractères minimum. La personne pourra le changer."
              >
                <Input
                  id="password"
                  name="password"
                  type="text"
                  minLength={10}
                  required
                  autoComplete="off"
                />
              </Field>
              <ActionSubmit>Créer le compte</ActionSubmit>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
