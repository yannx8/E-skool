import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/form";
import { ActionForm, ActionSubmit } from "@/components/action-form";
import { requirePermission } from "@/lib/auth";
import { getClasses } from "@/lib/queries";
import { createClass, deleteClass, updateClass } from "../actions";

export const metadata: Metadata = { title: "Classes" };

const SUGGESTED = ["SIL", "CP", "CE1", "CE2", "CM1", "CM2"];

export default async function ClassesPage() {
  await requirePermission("manageSetup");
  const classes = await getClasses();
  const nextOrder = (classes.at(-1)?.sort_order ?? 0) + 1;
  const missing = SUGGESTED.filter(
    (n) => !classes.some((c) => c.name.toLowerCase() === n.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Classes"
        description="L'ordre sert au passage de classe : chaque élève passe dans la classe suivante."
        back={{ href: "/configuration", label: "Configuration" }}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={`${classes.length} classe(s)`} />
          {classes.length === 0 ? (
            <CardBody>
              <Alert tone="info">
                Ajoutez les classes de l&apos;école (par exemple SIL, CP, CE1, CE2, CM1, CM2).
              </Alert>
            </CardBody>
          ) : (
            <ul className="divide-y divide-slate-100">
              {classes.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  <ActionForm action={updateClass} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={c.id} />
                    <Field label="Nom" htmlFor={`name-${c.id}`} className="min-w-32 flex-1">
                      <Input
                        id={`name-${c.id}`}
                        name="name"
                        defaultValue={c.name}
                        required
                        maxLength={40}
                      />
                    </Field>
                    <Field label="Ordre" htmlFor={`order-${c.id}`} className="w-24">
                      <Input
                        id={`order-${c.id}`}
                        name="sort_order"
                        type="number"
                        min={0}
                        max={999}
                        defaultValue={c.sort_order}
                      />
                    </Field>
                    <label className="flex h-11 items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={c.is_active}
                        className="size-5 accent-primary"
                      />
                      Active
                    </label>
                    <ActionSubmit variant="secondary" size="sm" className="h-11">
                      Enregistrer
                    </ActionSubmit>
                  </ActionForm>
                  <ActionForm action={deleteClass} className="mt-1">
                    <input type="hidden" name="id" value={c.id} />
                    <ActionSubmit variant="link" size="sm" className="text-sm text-danger">
                      Supprimer
                    </ActionSubmit>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Ajouter une classe" />
          <CardBody className="space-y-4">
            <ActionForm action={createClass} className="space-y-4" resetOnSuccess>
              <Field label="Nom" htmlFor="name">
                <Input
                  id="name"
                  name="name"
                  required
                  maxLength={40}
                  defaultValue={missing[0] ?? ""}
                />
              </Field>
              <Field label="Ordre" htmlFor="sort_order">
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  min={0}
                  max={999}
                  defaultValue={nextOrder}
                />
              </Field>
              <ActionSubmit>Ajouter</ActionSubmit>
            </ActionForm>
            {missing.length > 0 && classes.length === 0 && (
              <p className="text-sm text-slate-500">
                Classes habituelles du primaire : {SUGGESTED.join(", ")}.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
