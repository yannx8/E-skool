import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { allFamilies, currentYear, getSchool } from "@/lib/queries";
import { dateLabel, fmt, today } from "@/lib/format";
import { PrintBar } from "../../print-bar";

/** Clearance list a teacher keeps: who is up to date with the fees due so far. */
export default async function PrintClass({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [cls, families, school, year] = await Promise.all([db.class.findUnique({ where: { id } }), allFamilies(), getSchool(), currentYear()]);
  if (!cls || !school) notFound();
  const pupils = families.flatMap((f) => f.pupils.filter((p) => p.classId === id && !p.leftOn)).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <PrintBar back={`/collections?view=class&class=${id}`} size="A4" />
      <article className="mx-auto max-w-[190mm] p-8 text-[14px] text-black">
        <header className="mb-4 flex justify-between border-b-2 border-black pb-3">
          <div>
            <div className="text-[18px] font-bold">{school.name}</div>
            <div>
              {cls.name} · {year?.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12px] font-bold tracking-[0.12em]">FEES CLEARANCE</div>
            <div>As of {dateLabel(today())}</div>
          </div>
        </header>
        <table className="w-full">
          <thead>
            <tr className="border-y border-black text-left">
              <th className="py-1">#</th>
              <th>Pupil</th>
              <th className="text-right">Due now (F)</th>
              <th className="pl-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {pupils.map((p, i) => (
              <tr key={p.id} className="border-b border-[#ccc]">
                <td className="py-1.5">{i + 1}</td>
                <td>
                  <b>{p.lastName}</b> {p.firstNames}
                </td>
                <td className="num text-right">{p.dueNow ? fmt(p.dueNow) : "—"}</td>
                <td className="pl-4 font-bold">{p.dueNow ? "NOT CLEARED" : "Cleared"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4">
          {pupils.filter((p) => !p.dueNow).length} cleared, {pupils.filter((p) => p.dueNow).length} not cleared.
        </p>
      </article>
    </>
  );
}
