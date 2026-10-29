import { requireUser } from "@/lib/auth";
import { PageHeader, Panel, buttonClass } from "@/components/ui";

export const metadata = { title: "Backup & export" };

export default async function DataPage() {
  await requireUser("ADMIN", "OWNER");
  return (
    <>
      <PageHeader title="Backup & export" sub="The data lives in the PostgreSQL database on this computer. Keep a copy somewhere else." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Download a backup">
          <p className="mb-4 text-ink-2">One file with every family, receipt, expense and setting (passwords excluded). Do it every Friday and keep it on a USB key or in Google Drive.</p>
          <a href="/api/backup" className={buttonClass("primary")}>Download backup</a>
        </Panel>
        <Panel title="Open in Excel">
          <ul className="space-y-2">
            {[
              ["families", "Families and pupils with balances"],
              ["owing", "Who owes"],
              ["payments", "All receipts"],
              ["expenses", "All expenses"],
            ].map(([k, label]) => (
              <li key={k}>
                <a href={`/api/export/${k}`} download className="underline">{label}</a>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
