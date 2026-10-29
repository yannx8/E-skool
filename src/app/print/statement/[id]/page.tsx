import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSchool, oneFamily } from "@/lib/queries";
import { METHOD_LABEL, dateLabel, dayMonth, fmt, phoneLabel, receiptNo, today } from "@/lib/format";
import { PrintBar } from "../../print-bar";

/** Balance-forward statement per child, the QuickBooks layout schools hand to parents. */
export default async function PrintStatement({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [f, school, payments] = await Promise.all([
    oneFamily(id),
    getSchool(),
    db.payment.findMany({ where: { familyId: id, voidedAt: null }, orderBy: { paidOn: "asc" } }),
  ]);
  if (!f || !school) notFound();
  return (
    <>
      <PrintBar back={`/families/${id}`} auto={false} size="A4" />
      <article className="mx-auto max-w-[190mm] p-8 text-[14px] text-black">
        <header className="flex justify-between border-b-2 border-black pb-3">
          <div>
            <div className="text-[19px] font-bold">{school.name}</div>
            <div>{[school.address, school.phone && phoneLabel(school.phone)].filter(Boolean).join(" · ")}</div>
          </div>
          <div className="text-right">
            <div className="text-[12px] font-bold tracking-[0.12em]">STATEMENT OF ACCOUNT</div>
            <div>{dateLabel(today())}</div>
          </div>
        </header>
        <p className="py-3">
          <b>{f.guardian ?? `${f.name} family`}</b>
          {f.phone && <span className="num"> · {phoneLabel(f.phone)}</span>}
        </p>
        {f.pupils
          .filter((p) => p.lines.length)
          .map((p) => (
            <section key={p.id} className="mb-5">
              <h2 className="mb-1 font-bold">
                {p.firstNames} {p.lastName} <span className="font-normal">· {p.className ?? "—"}</span>
              </h2>
              <table className="w-full">
                <thead>
                  <tr className="border-y border-black text-left">
                    <th className="py-1">Fee</th>
                    <th>Due</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Paid</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {p.lines.map((l) => (
                    <tr key={l.id} className="border-b border-[#ccc]">
                      <td className="py-1">
                        {l.label}
                        {l.discount > 0 && <span className="text-[12px]"> (discount {fmt(l.discount)})</span>}
                      </td>
                      <td>{dayMonth(l.dueOn)}</td>
                      <td className="num text-right">{fmt(l.net)}</td>
                      <td className="num text-right">{fmt(l.paid)}</td>
                      <td className="num text-right font-semibold">{fmt(l.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        <h2 className="mb-1 font-bold">Payments received</h2>
        <table className="mb-5 w-full">
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-[#ccc]">
                <td className="num py-1">No. {receiptNo(p.number)}</td>
                <td>{dateLabel(p.paidOn)}</td>
                <td>{METHOD_LABEL[p.method]}</td>
                <td className="num text-right">{fmt(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto w-72 border-t-2 border-black pt-2">
          <div className="flex justify-between">
            <span>Due now</span>
            <b className="num">{fmt(f.dueNow)} F</b>
          </div>
          <div className="flex justify-between">
            <span>Total still to pay</span>
            <b className="num">{fmt(f.balance)} F</b>
          </div>
          {f.credit > 0 && (
            <div className="flex justify-between">
              <span>Credit</span>
              <b className="num">{fmt(f.credit)} F</b>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
