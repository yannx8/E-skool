import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ActionForm } from "@/components/action-form";
import { PageHeader, Panel, buttonClass } from "@/components/ui";
import { FamilyFields } from "../../family-fields";
import { updateFamily } from "../../actions";

export default async function EditFamilyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("ADMIN", "CASHIER");
  const id = Number((await params).id);
  const f = await db.family.findUnique({ where: { id } });
  if (!f) notFound();
  return (
    <>
      <PageHeader title={`Edit ${f.name}`} />
      <ActionForm action={updateFamily.bind(null, id)} className="max-w-[900px] space-y-6">
        <Panel title="Parent">
          <FamilyFields f={f} />
        </Panel>
        <button className={buttonClass("primary")}>Save</button>
      </ActionForm>
    </>
  );
}
