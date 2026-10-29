import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ActionForm } from "@/components/action-form";
import { PageHeader, Panel, buttonClass } from "@/components/ui";
import { FamilyFields } from "../family-fields";
import { createFamily } from "../actions";
import { Children } from "./children";

export const metadata = { title: "New family" };

export default async function NewFamilyPage() {
  await requireUser("ADMIN", "CASHIER");
  const classes = await db.class.findMany({ where: { active: true }, orderBy: { level: "asc" } });
  return (
    <>
      <PageHeader title="New family" sub="Enter the parent once, then each child. Fees are billed from the fee table for each class." />
      <ActionForm action={createFamily} className="max-w-[900px] space-y-6">
        <Panel title="Parent">
          <FamilyFields />
        </Panel>
        <Panel title="Children">
          <Children classes={classes} />
        </Panel>
        <button className={buttonClass("primary")}>Save family and enroll</button>
      </ActionForm>
    </>
  );
}
