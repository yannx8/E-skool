import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { METHOD_LABEL, dateLabel, day, fmt, receiptNo, timeLabel, today } from "@/lib/format";
import { Amount, Empty, PageHeader, Tag, inputClass, td, th, tr } from "@/components/ui";

export const metadata = { title: "Receipts" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; q?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const from = sp.from ?? today();
  const to = sp.to ?? from;
  const q = sp.q?.trim().replace(/^0+/, "");
  const payments = await db.payment.findMany({
    where: q && /^\d+$/.test(q) ? { number: Number(q) } : { paidOn: { gte: day(from), lte: day(to) } },
    orderBy: { number: "desc" },
    include: { family: true, createdBy: true, account: true },
  });
  const live = payments.filter((p) => !p.voidedAt);
  const byMethod = Object.entries(live.reduce<Record<string, number>>((m, p) => ((m[METHOD_LABEL[p.method]] = (m[METHOD_LABEL[p.method]] ?? 0) + p.amount), m), {}));
  const byCashier = Object.entries(live.reduce<Record<string, number>>((m, p) => ((m[p.createdBy.name] = (m[p.createdBy.name] ?? 0) + p.amount), m), {}));

  return (
    <>
      <PageHeader
        title="Receipts"
        sub={
          <>
            {from === to ? dateLabel(from) : `${dateLabel(from)} to ${dateLabel(to)}`}: <Amount value={live.reduce((s, p) => s + p.amount, 0)} /> F on {live.length} receipts
            {payments.length > live.length && <span className="text-late"> · {payments.length - live.length} void</span>}
          </>
        }
      />
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-[14px] text-ink-2">From<input type="date" name="from" defaultValue={from} className={`${inputClass} mt-1`} /></label>
        <label className="text-[14px] text-ink-2">To<input type="date" name="to" defaultValue={to} className={`${inputClass} mt-1`} /></label>
        <label className="text-[14px] text-ink-2">Receipt no.<input name="q" defaultValue={sp.q} inputMode="numeric" className={`${inputClass} num mt-1 w-36`} /></label>
        <button className="min-h-11 rounded-lg border border-line-strong bg-panel px-4 font-medium">Show</button>
      </form>

      {live.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-10 gap-y-3 rounded-box border border-line bg-panel px-5 py-4 text-[15px]">
          <div>
            <div className="mb-1 text-[13px] text-ink-3">By method</div>
            {byMethod.map(([m, v]) => <div key={m} className="flex justify-between gap-6"><span>{m}</span><Amount value={v} /></div>)}
          </div>
          <div>
            <div className="mb-1 text-[13px] text-ink-3">By cashier</div>
            {byCashier.map(([m, v]) => <div key={m} className="flex justify-between gap-6"><span>{m}</span><Amount value={v} /></div>)}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-box border border-line bg-panel">
        {payments.length === 0 ? (
          <Empty title="No receipt for this period" />
        ) : (
          <table className="w-full min-w-[760px] text-[15px]">
            <thead>
              <tr><th className={th}>No.</th><th className={th}>Date</th><th className={th}>Family</th><th className={th}>Method</th><th className={th}>Cashier</th><th className={`${th} text-right`}>Amount</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className={`${tr} ${p.voidedAt ? "text-ink-3" : ""}`}>
                  <td className={td}><Link href={`/payments/${p.id}`} className="num font-semibold hover:underline">{receiptNo(p.number)}</Link></td>
                  <td className={`${td} whitespace-nowrap`}>{dateLabel(p.paidOn)} <span className="text-ink-3">{timeLabel(p.createdAt)}</span></td>
                  <td className={td}><Link href={`/families/${p.familyId}`} className="hover:underline">{p.family.name}</Link></td>
                  <td className={td}>{METHOD_LABEL[p.method]}{p.reference && <span className="num text-[13px] text-ink-3"> · {p.reference}</span>}</td>
                  <td className={`${td} text-ink-2`}>{p.createdBy.name}</td>
                  <td className={`${td} text-right`}>{p.voidedAt ? <Tag tone="late">Void · {fmt(p.amount)}</Tag> : <Amount value={p.amount} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
