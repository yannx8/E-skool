import { clsx } from "clsx";
import type { School } from "@/generated/prisma/client";
import type { ReceiptData } from "@/lib/receipt-data";
import { METHOD_LABEL, dateLabel, fmt, phoneLabel, receiptNo, timeLabel } from "@/lib/format";
import { amountInWords } from "@/lib/money";

/** The receipt the parent takes home. Same markup on screen and on paper. */
export function Receipt({ school, data, thermal }: { school: School; data: ReceiptData; thermal?: boolean }) {
  const { p, lines, credit, balanceNow } = data;
  return (
    <article className={clsx("relative bg-white text-black", thermal ? "w-[72mm] p-2 text-[12px]" : "mx-auto w-full max-w-[148mm] p-8 text-[14px]")}>
      {p.voidedAt && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="-rotate-12 rounded-lg border-4 border-late px-6 py-2 text-[44px] font-bold tracking-[0.1em] text-late opacity-80">VOID</div>
        </div>
      )}
      <header className={clsx("flex items-start justify-between gap-4 border-b-2 border-black pb-3", thermal && "flex-col gap-1 text-center")}>
        <div className={thermal ? "w-full" : ""}>
          <div className={clsx("font-bold leading-tight", thermal ? "text-[15px]" : "text-[19px]")}>{school.name}</div>
          {school.motto && <div className="italic">{school.motto}</div>}
          <div>
            {[school.address, school.phone && phoneLabel(school.phone), school.email].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div className={thermal ? "w-full" : "text-right"}>
          <div className="text-[12px] font-bold tracking-[0.12em]">RECEIPT</div>
          <div className="num text-[22px] leading-none font-semibold">No. {receiptNo(p.number)}</div>
          <div className="mt-1">
            {dateLabel(p.paidOn)} · {timeLabel(p.createdAt)}
          </div>
        </div>
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 py-3">
        <dt className="text-[#555]">Received from</dt>
        <dd className="font-bold">{p.payer || p.family.guardian || `${p.family.name} family`}</dd>
        <dt className="text-[#555]">Family</dt>
        <dd>{p.family.name}</dd>
      </dl>

      <table className="w-full">
        <thead>
          <tr className="border-y border-black text-left">
            <th className="py-1 font-bold">Pupil</th>
            <th className="py-1 font-bold">For</th>
            <th className="py-1 text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-[#ccc] align-top">
              <td className="py-1 pr-2">
                {l.pupil}
                <div className="text-[#555]">{l.className}</div>
              </td>
              <td className="py-1 pr-2">{l.label}</td>
              <td className="num py-1 text-right">{fmt(l.amount)}</td>
            </tr>
          ))}
          {credit > 0 && (
            <tr className="border-b border-[#ccc]">
              <td className="py-1" colSpan={2}>
                Advance kept for next fees
              </td>
              <td className="num py-1 text-right">{fmt(credit)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-2 font-bold" colSpan={2}>
              Total received
            </td>
            <td className="num pt-2 text-right text-[18px] font-semibold">{fmt(p.amount)} F</td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-1 italic">{amountInWords(p.amount)}</p>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
        <dt className="text-[#555]">Paid by</dt>
        <dd>
          {METHOD_LABEL[p.method]}
          {p.reference && <span className="num"> · {p.reference}</span>}
        </dd>
        <dt className="text-[#555]">Balance after</dt>
        <dd className="font-bold">{balanceNow > 0 ? `${fmt(balanceNow)} F still to pay this year` : "Fully paid"}</dd>
        <dt className="text-[#555]">Cashier</dt>
        <dd>{p.createdBy.name}</dd>
      </dl>

      {p.voidedAt && (
        <p className="mt-3 border border-late p-2 text-late">
          Voided on {dateLabel(p.voidedAt)} by {p.voidedBy?.name}: {p.voidReason}
        </p>
      )}

      <div className={clsx("mt-6 flex gap-6", thermal && "flex-col gap-3")}>
        <div className="flex-1 border-t border-black pt-1 text-[12px] text-[#555]">Signature</div>
        <div className="grid h-20 flex-1 place-items-center rounded border border-dashed border-[#999] text-[12px] text-[#777]">School stamp</div>
      </div>
      {school.receiptNote && <p className="mt-4 text-center text-[12px] text-[#555]">{school.receiptNote}</p>}
    </article>
  );
}
