import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Panel } from "@/components/ui";
import { Importer } from "./importer";

export const metadata = { title: "Import pupils" };

export default async function ImportPage() {
  await requireUser("ADMIN");
  const classes = await db.class.findMany({ where: { active: true }, orderBy: { level: "asc" } });
  return (
    <>
      <PageHeader title="Import pupils from Excel" sub="One row per pupil. Brothers and sisters with the same family name and phone become one family." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel title="Your file">
          <Importer classes={classes.map((c) => c.name)} />
        </Panel>
        <Panel title="How to prepare it">
          <ol className="list-decimal space-y-2 pl-5 text-[15px] text-ink-2">
            <li>
              Download the <a href="/eskool-import-template.csv" className="text-ink underline">template</a> or use your own sheet with these column names.
            </li>
            <li>Columns: Family, Parent, Phone, First names, Class, Sex, Birth date, Already paid.</li>
            <li>Class names must match: {classes.map((c) => c.name).join(", ")}.</li>
            <li>“Already paid” is what the family paid this year before E-skool. It is applied to the oldest fees first.</li>
            <li>Nothing is saved until you press Import. Importing the same file twice does not create duplicates.</li>
          </ol>
        </Panel>
      </div>
    </>
  );
}
