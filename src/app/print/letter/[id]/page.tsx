import { notFound } from "next/navigation";
import { getSchool, oneFamily } from "@/lib/queries";
import { dateLabel, dayMonth, fmt, phoneLabel, today } from "@/lib/format";
import { PrintBar } from "../../print-bar";

/** The paper reminder (avertissement) a pupil carries home, for parents without WhatsApp. */
export default async function PrintLetter({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ by?: string }> }) {
  const id = Number((await params).id);
  const { by } = await searchParams;
  const [f, school] = await Promise.all([oneFamily(id), getSchool()]);
  if (!f || !school) notFound();
  const owing = f.pupils.filter((p) => p.dueNow > 0);
  return (
    <>
      <PrintBar back={`/families/${id}`} size="A5" />
      <article className="mx-auto max-w-[148mm] p-8 text-[14px] leading-relaxed text-black">
        <header className="border-b-2 border-black pb-3">
          <div className="text-[18px] font-bold">{school.name}</div>
          <div>{[school.address, school.phone && phoneLabel(school.phone)].filter(Boolean).join(" · ")}</div>
        </header>
        <p className="mt-4 text-right">Douala, {dateLabel(today())}</p>
        <p className="mt-4">
          To <b>{f.guardian ?? `the parents of the ${f.name} family`}</b>
        </p>
        <h1 className="mt-4 text-[16px] font-bold">Reminder: school fees due</h1>
        <p className="mt-3">Dear parent, our records show that the following school fees are due and unpaid:</p>
        <table className="my-3 w-full">
          <tbody>
            {owing.flatMap((p) =>
              p.lines
                .filter((l) => l.balance > 0 && l.dueOn <= today())
                .map((l) => (
                  <tr key={l.id} className="border-b border-[#ccc]">
                    <td className="py-1">{p.firstNames}</td>
                    <td>{l.label}</td>
                    <td>due {dayMonth(l.dueOn)}</td>
                    <td className="num text-right">{fmt(l.balance)}</td>
                  </tr>
                )),
            )}
            <tr>
              <td className="pt-2 font-bold" colSpan={3}>
                Total due
              </td>
              <td className="num pt-2 text-right font-bold">{fmt(f.dueNow)} F</td>
            </tr>
          </tbody>
        </table>
        <p>
          We kindly ask you to settle this amount {by ? <>before <b>{dateLabel(by)}</b></> : "as soon as possible"} at the school office or by Mobile Money. If you have already paid, please bring your receipt.
        </p>
        <div className="mt-10 flex justify-between gap-8">
          <div className="flex-1 border-t border-black pt-1 text-[12px]">The Bursar</div>
          <div className="grid h-20 flex-1 place-items-center rounded border border-dashed border-[#999] text-[12px] text-[#777]">School stamp</div>
        </div>
      </article>
    </>
  );
}
