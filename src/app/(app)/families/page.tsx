import Link from "next/link";
import { can, requireUser } from "@/lib/auth";
import { allFamilies } from "@/lib/queries";
import { db } from "@/lib/db";
import { phoneLabel } from "@/lib/format";
import { Amount, Avatar, Empty, FeeStrip, LinkButton, PageHeader, RowAction, RowActions, StateTag, buttonClass, inputClass, td, th, tr } from "@/components/ui";

export const metadata = { title: "Families" };

const match = (q: string, ...xs: (string | null | undefined)[]) => xs.some((x) => x?.toLowerCase().includes(q));

export default async function FamiliesPage({ searchParams }: { searchParams: Promise<{ q?: string; class?: string; show?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const classId = Number(sp.class) || null;
  const [families, classes] = await Promise.all([allFamilies(), db.class.findMany({ orderBy: { level: "asc" } })]);

  const rows = families
    .filter((f) => sp.show === "all" || f.pupils.some((p) => p.status === "ACTIVE") || f.balance > 0)
    .filter((f) => !classId || f.pupils.some((p) => p.classId === classId))
    .filter(
      (f) =>
        !q ||
        match(q, f.name, f.guardian, f.address) ||
        (digits.length >= 3 && (f.phone?.includes(digits) || f.phone2?.includes(digits))) ||
        f.pupils.some((p) => match(q, p.name, p.code, `${p.firstNames} ${p.lastName}`)),
    );
  const pupilCount = rows.reduce((s, f) => s + f.pupils.filter((p) => p.enrollmentId && !p.leftOn).length, 0);
  const collect = can.collect(user);

  const actions = (f: (typeof rows)[number]) => (
    <RowActions>
      {collect && <RowAction href={`/payments/new?family=${f.id}`}>Receive payment</RowAction>}
      <RowAction href={`/print/statement/${f.id}`}>Statement</RowAction>
      <RowAction href={`/families/${f.id}`}>Open family</RowAction>
    </RowActions>
  );

  const due = (f: (typeof rows)[number]) =>
    f.dueNow > 0 ? (
      <div className="flex flex-col items-end gap-1">
        <Amount value={f.dueNow} late={f.daysLate > 0} />
        {f.daysLate > 0 && <StateTag state="overdue">{f.daysLate} days late</StateTag>}
      </div>
    ) : (
      <span className="text-[14px] text-paid">Up to date</span>
    );

  return (
    <>
      <PageHeader
        title="Families"
        sub={`${rows.length} families · ${pupilCount} pupils this year`}
        actions={
          collect && (
            <>
              <LinkButton href="/settings/import">Import from Excel</LinkButton>
              <LinkButton href="/families/new" tone="primary">
                New family
              </LinkButton>
            </>
          )
        }
      />
      <form className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
        <input name="q" type="search" defaultValue={sp.q} placeholder="Search a pupil, parent, phone or admission no." className={inputClass} autoFocus={!sp.q} />
        <select name="class" defaultValue={sp.class ?? ""} className={inputClass}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className={buttonClass("secondary")}>Search</button>
      </form>

      <div className="rounded-box border border-line bg-panel shadow-card">
        {rows.length === 0 ? (
          <Empty title={q ? `Nothing matches “${sp.q}”` : "No families yet"}>
            {q ? "Check the spelling, or search by phone number." : "Add a family, or import your pupil list from Excel."}
          </Empty>
        ) : (
          <>
            {/* Phone: one card per family. */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((f) => (
                <li key={f.id} className="flex gap-3 px-4 py-3">
                  <Avatar name={f.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/families/${f.id}`} className="min-w-0">
                        <b className="block truncate">{f.name}</b>
                        {f.guardian && <span className="block truncate text-[14px] text-ink-2">{f.guardian}</span>}
                      </Link>
                      {due(f)}
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {f.pupils
                        .filter((p) => p.enrollmentId)
                        .map((p) => (
                          <div key={p.id} className="flex items-center justify-between gap-3 text-[14px]">
                            <span className="truncate">
                              {p.firstNames} <span className="text-ink-3">· {p.className}</span>
                            </span>
                            <FeeStrip segments={p.segments} size="sm" />
                          </div>
                        ))}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="num text-[14px] text-ink-3">{f.phone ? phoneLabel(f.phone) : "No phone"}</span>
                      {actions(f)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: Brightwheel's student table. */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[880px] text-[15px]">
                <thead>
                  <tr>
                    <th className={th}>Family</th>
                    <th className={th}>Pupils this year</th>
                    <th className={th}>Phone</th>
                    <th className={`${th} text-right`}>Due now</th>
                    <th className={`${th} text-right`}>Balance</th>
                    <th className={th}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => (
                    <tr key={f.id} className={tr}>
                      <td className={td}>
                        <Link href={`/families/${f.id}`} className="flex items-center gap-3 hover:underline">
                          <Avatar name={f.name} />
                          <span>
                            <b className="block">{f.name}</b>
                            {f.guardian && <span className="block text-[14px] text-ink-2">{f.guardian}</span>}
                          </span>
                        </Link>
                      </td>
                      <td className={td}>
                        <div className="space-y-1.5">
                          {f.pupils
                            .filter((p) => p.enrollmentId)
                            .map((p) => (
                              <div key={p.id} className="flex items-center gap-3">
                                <span className="w-44 truncate text-[14px]" title={p.name}>
                                  {p.firstNames} <span className="text-ink-3">· {p.className}</span>
                                </span>
                                <FeeStrip segments={p.segments} size="sm" />
                              </div>
                            ))}
                        </div>
                      </td>
                      <td className={`${td} num text-[14px] whitespace-nowrap text-ink-2`}>{f.phone ? phoneLabel(f.phone) : "—"}</td>
                      <td className={`${td} text-right`}>{due(f)}</td>
                      <td className={`${td} text-right`}>
                        <Amount value={f.balance} muted={f.balance === 0} />
                        {f.credit > 0 && <div className="text-[13px] text-paid">Credit {f.credit.toLocaleString("en-US")}</div>}
                      </td>
                      <td className={`${td} text-right`}>{actions(f)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {sp.show !== "all" && (
        <p className="mt-3 text-[14px] text-ink-3">
          Families with no pupil this year and nothing owed are hidden.{" "}
          <Link className="text-sun underline" href="/families?show=all">
            Show all
          </Link>
        </p>
      )}
    </>
  );
}
