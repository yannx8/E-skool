import Link from "next/link";
import { can, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { day, dateLabel, fmt, today } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Dialog } from "@/components/dialog";
import { Amount, Empty, Field, PageHeader, Panel, Tag, buttonClass, inputClass, td, th, tr } from "@/components/ui";
import { addExpense, voidExpense } from "./actions";

export const metadata = { title: "Expenses" };

const monthLabel = (m: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(day(`${m}-01`));
const shift = (m: string, by: number) => {
  const d = day(`${m}-01`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
};

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const month = (await searchParams).month ?? today().slice(0, 7);
  const [expenses, categories, accounts] = await Promise.all([
    db.expense.findMany({
      where: { spentOn: { gte: day(`${month}-01`), lt: day(`${shift(month, 1)}-01`) } },
      orderBy: [{ spentOn: "desc" }, { id: "desc" }],
      include: { category: true, account: true, createdBy: true, staff: true },
    }),
    db.expenseCategory.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.account.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
  ]);
  const live = expenses.filter((e) => !e.voidedAt);
  const total = live.reduce((s, e) => s + e.amount, 0);
  const byCat = Object.entries(live.reduce<Record<string, number>>((m, e) => ((m[e.category.name] = (m[e.category.name] ?? 0) + e.amount), m), {})).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader
        title="Expenses"
        sub={
          <span className="flex items-center gap-3">
            <Link href={`/expenses?month=${shift(month, -1)}`} className="underline">←</Link>
            {monthLabel(month)} · <Amount value={total} /> F spent
            {month < today().slice(0, 7) && <Link href={`/expenses?month=${shift(month, 1)}`} className="underline">→</Link>}
          </span>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-box border border-line bg-panel">
            {expenses.length === 0 ? (
              <Empty title="No expenses this month" />
            ) : (
              <table className="w-full min-w-[760px] text-[15px]">
                <thead>
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>What</th>
                    <th className={th}>Category</th>
                    <th className={th}>From</th>
                    <th className={`${th} text-right`}>Amount</th>
                    <th className={th} />
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className={`${tr} ${e.voidedAt ? "text-ink-3" : ""}`}>
                      <td className={`${td} whitespace-nowrap`}>{dateLabel(e.spentOn)}</td>
                      <td className={td}>
                        <span className={e.voidedAt ? "line-through" : ""}>{e.description}</span>
                        <div className="text-[13px] text-ink-3">
                          {[e.payee, e.staff?.name, e.reference, `by ${e.createdBy.name}`].filter(Boolean).join(" · ")}
                        </div>
                        {e.voidedAt && <div className="text-[13px] text-late">Void: {e.voidReason}</div>}
                      </td>
                      <td className={td}>{e.category.name}</td>
                      <td className={`${td} text-ink-2`}>{e.account.name}</td>
                      <td className={`${td} text-right`}>{e.voidedAt ? <Tag tone="late">Void</Tag> : <Amount value={e.amount} />}</td>
                      <td className={`${td} text-right`}>
                        {can.manage(user) && !e.voidedAt && (
                          <Dialog label="Void" title="Void this expense" className="text-[14px] text-late underline">
                            <ActionForm action={voidExpense.bind(null, e.id)} className="space-y-4">
                              <Field label="Reason"><input name="reason" required className={inputClass} /></Field>
                              <button className={buttonClass("danger", "w-full")}>Void expense</button>
                            </ActionForm>
                          </Dialog>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {byCat.length > 0 && (
            <Panel title="Where the money went">
              <ul className="space-y-2">
                {byCat.map(([name, amt]) => (
                  <li key={name} className="grid grid-cols-[160px_1fr_100px] items-center gap-3 text-[15px]">
                    <span className="truncate">{name}</span>
                    <span className="h-2.5 rounded-[3px] bg-rail/80" style={{ width: `${(amt / byCat[0][1]) * 100}%` }} />
                    <span className="num text-right">{fmt(amt)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {can.collect(user) && (
          <Panel title="Record an expense">
            <ActionForm action={addExpense} className="space-y-4">
              <Field label="What was bought or paid"><input name="description" required placeholder="Chalk and markers" className={inputClass} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (F)"><input name="amount" required inputMode="numeric" className={`${inputClass} num`} /></Field>
                <Field label="Date"><input name="spentOn" type="date" defaultValue={today()} max={today()} className={inputClass} /></Field>
              </div>
              <Field label="Category">
                <select name="categoryId" required className={inputClass}>
                  {categories.filter((c) => !/salar/i.test(c.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Paid from">
                <select name="accountId" className={inputClass}>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Paid to"><input name="payee" placeholder="Shop or person" className={inputClass} /></Field>
                <Field label="Invoice / ref."><input name="reference" className={inputClass} /></Field>
              </div>
              <button className={buttonClass("primary", "w-full")}>Save expense</button>
              <p className="text-[13px] text-ink-3">Salaries and advances go through Payroll.</p>
            </ActionForm>
          </Panel>
        )}
      </div>
    </>
  );
}
