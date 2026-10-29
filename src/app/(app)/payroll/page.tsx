import Link from "next/link";
import { can, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { day, fmt, iso, phoneLabel, today } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Dialog } from "@/components/dialog";
import { Amount, Empty, Field, PageHeader, Tag, buttonClass, inputClass, td, th, tr } from "@/components/ui";
import { payStaff, saveStaff } from "./actions";

export const metadata = { title: "Payroll" };

const monthLabel = (m: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(day(`${m}-01`));
const shift = (m: string, by: number) => {
  const d = day(`${m}-01`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
};

type S = { id?: number; name?: string; position?: string | null; phone?: string | null; salary?: number; startedOn?: Date | null; active?: boolean };

function StaffFields({ s = {} }: { s?: S }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Name" className="col-span-2"><input name="name" required defaultValue={s.name} className={inputClass} /></Field>
      <Field label="Position"><input name="position" defaultValue={s.position ?? ""} placeholder="Teacher, Class 3" className={inputClass} /></Field>
      <Field label="Phone"><input name="phone" defaultValue={s.phone ? phoneLabel(s.phone) : ""} className={inputClass} /></Field>
      <Field label="Monthly salary (F)"><input name="salary" inputMode="numeric" defaultValue={s.salary ?? ""} className={`${inputClass} num`} /></Field>
      <Field label="Started"><input name="startedOn" type="date" defaultValue={s.startedOn ? iso(s.startedOn) : ""} className={inputClass} /></Field>
      {s.id && <label className="col-span-2 flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={s.active} className="size-5 accent-rail" /> Still working at the school</label>}
    </div>
  );
}

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const month = (await searchParams).month ?? today().slice(0, 7);
  const [staff, accounts] = await Promise.all([
    db.staff.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], include: { expenses: { where: { payMonth: month, voidedAt: null }, include: { category: true } } } }),
    db.account.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
  ]);
  const admin = can.manage(user);
  const rows = staff
    .filter((s) => s.active || s.expenses.length)
    .map((s) => {
      const advances = s.expenses.filter((e) => /advance/i.test(e.category.name)).reduce((t, e) => t + e.amount, 0);
      const paid = s.expenses.filter((e) => !/advance/i.test(e.category.name)).reduce((t, e) => t + e.amount, 0);
      return { ...s, advances, paid, left: Math.max(0, s.salary - advances - paid) };
    });
  const sum = (k: "salary" | "advances" | "paid" | "left") => rows.reduce((t, r) => t + r[k], 0);

  const PayForm = ({ s, kind, amount }: { s: (typeof rows)[number]; kind: "salary" | "advance"; amount: number }) => (
    <ActionForm action={payStaff.bind(null, s.id, kind, month)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (F)"><input name="amount" required inputMode="numeric" defaultValue={amount || ""} className={`${inputClass} num`} /></Field>
        <Field label="Date"><input name="spentOn" type="date" defaultValue={today()} max={today()} className={inputClass} /></Field>
      </div>
      <Field label="Paid from">
        <select name="accountId" className={inputClass}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      </Field>
      <Field label="Reference"><input name="reference" placeholder="MoMo transaction ID" className={inputClass} /></Field>
      <button className={buttonClass("primary", "w-full")}>{kind === "salary" ? "Pay salary" : "Give advance"}</button>
    </ActionForm>
  );

  return (
    <>
      <PageHeader
        title="Payroll"
        sub={
          <span className="flex items-center gap-3">
            <Link href={`/payroll?month=${shift(month, -1)}`} className="underline">←</Link>
            {monthLabel(month)} · <Amount value={sum("paid") + sum("advances")} /> F paid of <Amount value={sum("salary")} /> F
            <Link href={`/payroll?month=${shift(month, 1)}`} className="underline">→</Link>
          </span>
        }
        actions={
          admin && (
            <Dialog label="Add staff member" title="New staff member" tone="primary">
              <ActionForm action={saveStaff.bind(null, null)} className="space-y-4">
                <StaffFields />
                <button className={buttonClass("primary", "w-full")}>Save</button>
              </ActionForm>
            </Dialog>
          )
        }
      />
      <div className="overflow-x-auto rounded-box border border-line bg-panel">
        {rows.length === 0 ? (
          <Empty title="No staff yet">Add teachers and other staff with their monthly salary.</Empty>
        ) : (
          <table className="w-full min-w-[860px] text-[15px]">
            <thead>
              <tr>
                <th className={th}>Staff</th>
                <th className={`${th} text-right`}>Salary</th>
                <th className={`${th} text-right`}>Advances</th>
                <th className={`${th} text-right`}>Paid</th>
                <th className={`${th} text-right`}>Left to pay</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className={tr}>
                  <td className={td}>
                    <span className="font-bold">{s.name}</span> {!s.active && <Tag>Left</Tag>}
                    <div className="text-[14px] text-ink-2">{s.position}</div>
                  </td>
                  <td className={`${td} text-right`}><Amount value={s.salary} /></td>
                  <td className={`${td} text-right`}><Amount value={s.advances} muted={!s.advances} /></td>
                  <td className={`${td} text-right`}><Amount value={s.paid} muted={!s.paid} /></td>
                  <td className={`${td} text-right`}>{s.left ? <Amount value={s.left} /> : <Tag tone="paid">Paid</Tag>}</td>
                  <td className={`${td} text-right whitespace-nowrap`}>
                    {admin && (
                      <span className="inline-flex gap-2">
                        {s.left > 0 && (
                          <Dialog label="Pay" title={`Salary ${monthLabel(month)} · ${s.name}`} tone="primary" className={buttonClass("primary", "min-h-9 px-3 text-[14px]")}>
                            <p className="mb-3 text-ink-2">Salary {fmt(s.salary)} − advances {fmt(s.advances)} − already paid {fmt(s.paid)}.</p>
                            <PayForm s={s} kind="salary" amount={s.left} />
                          </Dialog>
                        )}
                        <Dialog label="Advance" title={`Advance to ${s.name}`} className={buttonClass("secondary", "min-h-9 px-3 text-[14px]")}>
                          <PayForm s={s} kind="advance" amount={0} />
                        </Dialog>
                        <Dialog label="Edit" title={`Edit ${s.name}`} className="px-2 text-[14px] text-ink-2 underline">
                          <ActionForm action={saveStaff.bind(null, s.id)} className="space-y-4">
                            <StaffFields s={s} />
                            <button className={buttonClass("primary", "w-full")}>Save</button>
                          </ActionForm>
                        </Dialog>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line-strong font-semibold">
                <td className={td}>Total</td>
                <td className={`${td} text-right`}><Amount value={sum("salary")} /></td>
                <td className={`${td} text-right`}><Amount value={sum("advances")} /></td>
                <td className={`${td} text-right`}><Amount value={sum("paid")} /></td>
                <td className={`${td} text-right`}><Amount value={sum("left")} /></td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      <p className="mt-3 text-[14px] text-ink-3">Every salary and advance is also an expense, so it shows in Expenses and in the cash accounts.</p>
    </>
  );
}
