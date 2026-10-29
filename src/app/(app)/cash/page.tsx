import Link from "next/link";
import { clsx } from "clsx";
import { can, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountBalances } from "@/lib/queries";
import { dateLabel, dayMonth, fmt, receiptNo, timeLabel, today } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Amount, Field, PageHeader, Panel, Tag, buttonClass, inputClass, td, th, tr } from "@/components/ui";
import { countCash, transfer } from "./actions";

export const metadata = { title: "Cash & bank" };

export default async function CashPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const user = await requireUser();
  const accounts = await accountBalances();
  const wanted = Number((await searchParams).account);
  const selected = accounts.find((a) => a.id === wanted) ?? accounts[0];
  if (!selected) return null;
  const id = selected.id;

  const [payments, voids, expenses, tIn, tOut, counts] = await Promise.all([
    db.payment.findMany({ where: { accountId: id, method: { not: "OPENING" } }, orderBy: { createdAt: "desc" }, take: 40, include: { family: true } }),
    db.payment.findMany({ where: { accountId: id, method: { not: "OPENING" }, voidedAt: { not: null } }, orderBy: { voidedAt: "desc" }, take: 10 }),
    db.expense.findMany({ where: { accountId: id }, orderBy: { createdAt: "desc" }, take: 40, include: { category: true } }),
    db.transfer.findMany({ where: { toAccountId: id }, orderBy: { createdAt: "desc" }, take: 10, include: { fromAccount: true } }),
    db.transfer.findMany({ where: { fromAccountId: id }, orderBy: { createdAt: "desc" }, take: 10, include: { toAccount: true } }),
    db.cashCount.findMany({ where: { accountId: id }, orderBy: { createdAt: "desc" }, take: 15, include: { createdBy: true } }),
  ]);

  type Move = { at: Date; what: React.ReactNode; inn?: number; out?: number };
  const moves: Move[] = [
    ...payments.map((p) => ({ at: p.createdAt, what: <Link href={`/payments/${p.id}`} className="hover:underline">Receipt {receiptNo(p.number)} · {p.family.name}</Link>, inn: p.amount })),
    ...voids.map((p) => ({ at: p.voidedAt!, what: <>Receipt {receiptNo(p.number)} voided</>, out: p.amount })),
    ...expenses.map((e) => ({ at: e.createdAt, what: <>{e.description} <span className="text-ink-3">· {e.category.name}</span>{e.voidedAt && <Tag tone="late">Void</Tag>}</>, out: e.amount })),
    ...expenses.filter((e) => e.voidedAt).map((e) => ({ at: e.voidedAt!, what: <>Expense voided: {e.description}</>, inn: e.amount })),
    ...tIn.map((t) => ({ at: t.createdAt, what: <>From {t.fromAccount.name}{t.reference && ` · ${t.reference}`}</>, inn: t.amount })),
    ...tOut.map((t) => ({ at: t.createdAt, what: <>To {t.toAccount.name}{t.reference && ` · ${t.reference}`}</>, out: t.amount })),
  ]
    .sort((a, b) => +b.at - +a.at)
    .slice(0, 40);
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <>
      <PageHeader title="Cash & bank" sub={<>All accounts together hold <Amount value={total} /> F according to the books.</>} />

      <div className="mb-6 overflow-x-auto rounded-box border border-line bg-panel">
        <table className="w-full min-w-[640px] text-[15px]">
          <thead>
            <tr><th className={th}>Account</th><th className={`${th} text-right`}>In the books</th><th className={th}>Last count</th></tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className={clsx(tr, a.id === id && "bg-sun-soft/60")}>
                <td className={td}><Link href={`/cash?account=${a.id}`} className="font-bold hover:underline">{a.name}</Link></td>
                <td className={`${td} text-right`}><Amount value={a.balance} className="text-[17px]" /></td>
                <td className={`${td} text-[14px] text-ink-2`}>
                  {a.lastCount ? (
                    <>
                      {dateLabel(a.lastCount.createdAt)} {timeLabel(a.lastCount.createdAt)}
                      {a.lastCount.counted !== a.lastCount.expected && <Tag tone="late">{fmt(Math.abs(a.lastCount.counted - a.lastCount.expected))} {a.lastCount.counted < a.lastCount.expected ? "short" : "over"}</Tag>}
                    </>
                  ) : a.kind === "CASH" ? <span className="text-late">Never counted</span> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title={`${selected.name}: money in and out`} flush>
          <table className="w-full text-[15px]">
            <thead><tr><th className={th}>When</th><th className={th}>What</th><th className={`${th} text-right`}>In</th><th className={`${th} text-right`}>Out</th></tr></thead>
            <tbody>
              {moves.map((m, i) => (
                <tr key={i} className={tr}>
                  <td className={`${td} text-[14px] whitespace-nowrap text-ink-2`}>{dayMonth(m.at)} {timeLabel(m.at)}</td>
                  <td className={td}>{m.what}</td>
                  <td className={`${td} text-right`}>{m.inn ? <Amount value={m.inn} className="text-paid" /> : ""}</td>
                  <td className={`${td} text-right`}>{m.out ? <Amount value={m.out} /> : ""}</td>
                </tr>
              ))}
              {!moves.length && <tr className={tr}><td className={`${td} text-ink-3`} colSpan={4}>No movement yet.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-6">
          {can.collect(user) && (
            <Panel title={`Count ${selected.name}`}>
              <p className="mb-4 text-[14px] text-ink-2">Count the notes and coins first, then type the total. E-skool compares it with the books only after you save.</p>
              <ActionForm action={countCash.bind(null, id)} className="space-y-3">
                <Field label="Amount counted (F)"><input name="counted" required inputMode="numeric" className={`${inputClass} num min-h-13 text-[22px]`} /></Field>
                <Field label="Note" hint="Required when the count does not match."><input name="note" className={inputClass} /></Field>
                <button className={buttonClass("primary", "w-full")}>Save count</button>
              </ActionForm>
            </Panel>
          )}
          {can.collect(user) && (
            <Panel title="Move money between accounts">
              <ActionForm action={transfer} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="From">
                    <select name="fromAccountId" defaultValue={id} className={inputClass}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                  </Field>
                  <Field label="To">
                    <select name="toAccountId" defaultValue={accounts.find((a) => a.kind === "BANK")?.id} className={inputClass}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                  </Field>
                  <Field label="Amount (F)"><input name="amount" required inputMode="numeric" className={`${inputClass} num`} /></Field>
                  <Field label="Date"><input name="movedOn" type="date" defaultValue={today()} className={inputClass} /></Field>
                </div>
                <Field label="Deposit slip / reference"><input name="reference" className={inputClass} /></Field>
                <button className={buttonClass("secondary", "w-full")}>Record transfer</button>
              </ActionForm>
            </Panel>
          )}
          <Panel title="Count history" flush>
            <ul className="divide-y divide-line text-[14px]">
              {counts.map((c) => (
                <li key={c.id} className="px-5 py-2.5">
                  <div className="flex justify-between">
                    <span>{dateLabel(c.createdAt)} {timeLabel(c.createdAt)} · {c.createdBy.name}</span>
                    <Amount value={c.counted} />
                  </div>
                  {c.counted !== c.expected && (
                    <div className="text-late">
                      Expected {fmt(c.expected)}: {fmt(Math.abs(c.counted - c.expected))} {c.counted < c.expected ? "short" : "over"}{c.note && ` · ${c.note}`}
                    </div>
                  )}
                </li>
              ))}
              {!counts.length && <li className="px-5 py-3 text-ink-3">No count yet.</li>}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
