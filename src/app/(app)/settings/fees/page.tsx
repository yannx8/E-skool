import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentYear } from "@/lib/queries";
import { fmt, iso } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Empty, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { addFeeItem, removeFeeItem, saveFeeTable } from "../actions";

export const metadata = { title: "Fee table" };

const cell = "num block w-full min-w-[92px] rounded-md border border-line bg-panel px-2 py-2 text-right text-[15px] focus:border-rail focus:outline-none focus:ring-3 focus:ring-sun/60";

export default async function FeesPage() {
  const user = await requireUser();
  const year = await currentYear();
  if (!year) return <Empty title="No school year" />;
  const [classes, items] = await Promise.all([
    db.class.findMany({ where: { active: true }, orderBy: { level: "asc" } }),
    db.feeItem.findMany({ where: { yearId: year.id }, orderBy: [{ position: "asc" }, { id: "asc" }], include: { amounts: true, _count: { select: { charges: true } } } }),
  ]);
  const admin = user.role === "ADMIN";
  const totals = classes.map((c) => items.filter((i) => !i.optional).reduce((s, i) => s + (i.amounts.find((a) => a.classId === c.id)?.amount ?? 0), 0));

  return (
    <>
      <PageHeader
        title={`Fee table ${year.name}`}
        sub="One row per fee and due date, one column per class: the table posted at the school gate. Saving updates every enrolled pupil's bill; money already paid is never lost."
      />
      <ActionForm action={saveFeeTable} className="space-y-4">
        <div className="overflow-x-auto rounded-box border border-line bg-panel">
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky left-0 z-10 bg-panel px-4 py-3 text-left text-[13px] font-medium text-ink-3">Fee</th>
                <th className="px-2 py-3 text-left text-[13px] font-medium text-ink-3">Due</th>
                <th className="px-2 py-3 text-left text-[13px] font-medium text-ink-3">Optional</th>
                {classes.map((c) => (
                  <th key={c.id} className="px-2 py-3 text-right text-[13px] font-medium whitespace-nowrap text-ink-2">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-line">
                  <td className="sticky left-0 z-10 min-w-[220px] bg-panel px-4 py-2">
                    <input name={`name-${i.id}`} defaultValue={i.name} disabled={!admin} className={`${inputClass} min-h-10`} />
                  </td>
                  <td className="px-2 py-2">
                    <input name={`due-${i.id}`} type="date" defaultValue={iso(i.dueOn)} disabled={!admin} className={`${inputClass} min-h-10 w-[150px]`} />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input name={`opt-${i.id}`} type="checkbox" defaultChecked={i.optional} disabled={!admin} className="size-5 accent-rail" title="Optional: added per pupil (transport, canteen)" />
                  </td>
                  {classes.map((c) => (
                    <td key={c.id} className="px-2 py-2">
                      <input name={`amt-${i.id}-${c.id}`} inputMode="numeric" disabled={!admin} defaultValue={i.amounts.find((a) => a.classId === c.id)?.amount || ""} placeholder="0" className={cell} aria-label={`${i.name}, ${c.name}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-ground/60">
                <td className="sticky left-0 bg-ground px-4 py-3 font-bold" colSpan={3}>
                  Year total per pupil (required fees)
                </td>
                {totals.map((t, k) => (
                  <td key={k} className="num px-3 py-3 text-right font-semibold">
                    {fmt(t)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        {admin && <button className={buttonClass("primary")}>Save fee table and update bills</button>}
      </ActionForm>

      {admin && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-box border border-line bg-panel p-5">
            <h2 className="mb-3 text-[17px] font-bold">Add a fee</h2>
            <ActionForm action={addFeeItem} className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
              <input name="name" required placeholder="Transport, 1st term" className={inputClass} />
              <input name="dueOn" type="date" required className={inputClass} />
              <label className="flex items-center gap-2 text-[15px]">
                <input name="optional" type="checkbox" className="size-5 accent-rail" /> Optional
              </label>
              <button className={buttonClass("secondary", "sm:col-span-3")}>Add row</button>
            </ActionForm>
          </section>
          <section className="rounded-box border border-line bg-panel p-5">
            <h2 className="mb-3 text-[17px] font-bold">Remove a fee</h2>
            <p className="mb-3 text-[14px] text-ink-2">Only possible while nobody has paid it.</p>
            <ActionForm action={removeFeeItem} className="flex gap-3">
              <select name="id" className={inputClass}>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <button className={buttonClass("danger")}>Remove</button>
            </ActionForm>
          </section>
        </div>
      )}
    </>
  );
}
