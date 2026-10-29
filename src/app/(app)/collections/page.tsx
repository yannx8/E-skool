import Link from "next/link";
import { clsx } from "clsx";
import { can, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { allFamilies, getSchool } from "@/lib/queries";
import { BUCKETS, bucketOf, daysBetween, type Bucket } from "@/lib/money";
import { dateLabel, dayMonth, today } from "@/lib/format";
import { reminderText } from "@/lib/reminder";
import { ReminderButton } from "@/components/reminder-button";
import { Amount, Avatar, Empty, FeeStrip, LinkButton, PageHeader, SummaryCard, Tabs, Tag, buttonClass, inputClass, td, th, tr, type BarTone } from "@/components/ui";

export const metadata = { title: "Unpaid balances" };

const BUCKET_TONE: Record<Bucket, BarTone> = { "1-30": "late1", "31-60": "late2", "61-90": "late3", "90+": "late4" };

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ class?: string; bucket?: string; view?: string; stale?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [families, school, classes] = await Promise.all([allFamilies(), getSchool(), db.class.findMany({ where: { active: true }, orderBy: { level: "asc" } })]);
  const now = today();
  const classId = Number(sp.class) || null;
  const view = sp.view === "class" ? "class" : sp.view === "promises" ? "promises" : "owing";

  const owing = families.filter((f) => f.dueNow > 0);
  const total = owing.reduce((s, f) => s + f.dueNow, 0);
  const byBucket = Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Record<Bucket, number>;
  let dueToday = 0;
  for (const f of owing)
    for (const p of f.pupils)
      for (const l of p.lines)
        if (l.balance > 0 && l.dueOn <= now) {
          if (l.dueOn === now) dueToday += l.balance;
          else byBucket[bucketOf(daysBetween(l.dueOn, now))] += l.balance;
        }

  const tabs = [
    { v: "owing", label: `Who owes (${owing.length})` },
    { v: "promises", label: "Promises" },
    { v: "class", label: "Clearance by class" },
  ];

  return (
    <>
      <PageHeader title="Unpaid balances" sub={<>Fees due today or earlier and not paid, across {owing.length} families.</>} />

      {total > 0 && (
        <SummaryCard
          className="mb-6"
          title="Unpaid fees"
          sub="As of today, by how late they are"
          total={total}
          parts={[
            ...(dueToday > 0 ? [{ label: "Due today", value: dueToday, tone: "action" as const }] : []),
            ...BUCKETS.map((b) => ({ label: `${b} days late`, value: byBucket[b], tone: BUCKET_TONE[b], href: `/collections?bucket=${b}` })),
          ]}
        />
      )}

      <Tabs items={tabs.map((t) => ({ href: `/collections?view=${t.v}`, label: t.label, on: view === t.v }))} />

      {view === "owing" && <OwingTable />}
      {view === "promises" && <Promises />}
      {view === "class" && <ByClass />}
    </>
  );

  function OwingTable() {
    const rows = owing
      .filter((f) => !classId || f.pupils.some((p) => p.classId === classId))
      .filter((f) => !sp.bucket || (f.daysLate > 0 && bucketOf(f.daysLate) === sp.bucket))
      .filter((f) => !sp.stale || !f.lastReminder || daysBetween(f.lastReminder.at.toISOString().slice(0, 10), now) >= 7)
      .sort((a, b) => b.daysLate - a.daysLate || b.dueNow - a.dueNow);
    return (
      <>
        <form className="mb-3 grid gap-2 sm:grid-cols-[200px_200px_auto_auto] sm:justify-start">
          <input type="hidden" name="view" value="owing" />
          <select name="class" defaultValue={sp.class ?? ""} className={inputClass}>
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="bucket" defaultValue={sp.bucket ?? ""} className={inputClass}>
            <option value="">Any lateness</option>
            {BUCKETS.map((b) => <option key={b} value={b}>{b} days late</option>)}
          </select>
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-line-strong bg-panel px-3 text-[15px]">
            <input type="checkbox" name="stale" value="1" defaultChecked={!!sp.stale} className="size-4 accent-sun" />
            Not reminded this week
          </label>
          <button className={buttonClass("secondary")}>Filter</button>
        </form>
        <div className="overflow-x-auto rounded-box border border-line bg-panel shadow-card">
          {rows.length === 0 ? (
            <Empty title="Nobody owes anything here">Every fee due so far is paid for this selection.</Empty>
          ) : (
            <table className="w-full min-w-[960px] text-[15px]">
              <thead>
                <tr>
                  <th className={th}>Family</th>
                  <th className={th}>Pupils</th>
                  <th className={`${th} text-right`}>Due now</th>
                  <th className={th}>Late since</th>
                  <th className={th}>Last paid</th>
                  <th className={th}>Follow-up</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const paused = f.pausedUntil && f.pausedUntil >= now;
                  return (
                    <tr key={f.id} className={tr}>
                      <td className={td}>
                        <Link href={`/families/${f.id}`} className="flex items-center gap-3 hover:underline">
                          <Avatar name={f.name} />
                          <span>
                            <b className="block">{f.name}</b>
                            <span className="block text-[14px] text-ink-2">{f.guardian}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={td}>
                        {f.pupils.filter((p) => p.dueNow > 0).map((p) => (
                          <div key={p.id} className="flex items-center gap-2 text-[14px]">
                            <span className="w-32 truncate">{p.firstNames.split(" ")[0]} · {p.className ?? "old"}</span>
                            <FeeStrip segments={p.segments} size="sm" />
                          </div>
                        ))}
                      </td>
                      <td className={`${td} text-right`}><Amount value={f.dueNow} late={f.daysLate > 0} /></td>
                      <td className={`${td} whitespace-nowrap`}>
                        {f.daysLate > 0 ? <><span className="text-late">{f.daysLate} days</span><div className="text-[13px] text-ink-3">{dayMonth(f.oldestDue!)}</div></> : <Tag tone="sun">Due today</Tag>}
                      </td>
                      <td className={`${td} text-[14px] whitespace-nowrap text-ink-2`}>{f.lastPaidOn ? dateLabel(f.lastPaidOn) : "Never"}</td>
                      <td className={`${td} text-[14px]`}>
                        {f.promise?.state === "broken" && <Tag tone="late">Broke promise</Tag>}
                        {f.promise?.state === "open" && <Tag tone="sun">Promised {dayMonth(f.promise.dueOn)}</Tag>}
                        {!f.promise || f.promise.state === "kept" ? (
                          <span className="text-ink-3">{f.lastReminder ? `Reminded ${dayMonth(f.lastReminder.at)}` : "Never reminded"}</span>
                        ) : null}
                      </td>
                      <td className={`${td} text-right whitespace-nowrap`}>
                        {can.collect(user) && !paused && school && (
                          <span className="inline-flex gap-2">
                            <ReminderButton compact familyId={f.id} phone={f.phone} amountDue={f.dueNow} text={reminderText(school.reminderTemplate, school.name, f)} />
                            <LinkButton href={`/print/letter/${f.id}`} tone="quiet" className="px-3 text-[14px]">Letter</LinkButton>
                          </span>
                        )}
                        {paused && <span className="text-[13px] text-ink-3">Paused until {dayMonth(f.pausedUntil!)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  }

  function Promises() {
    const rows = families.filter((f) => f.promise).sort((a, b) => a.promise!.dueOn.localeCompare(b.promise!.dueOn));
    const label = { open: "Waiting", kept: "Kept", broken: "Broken" } as const;
    return (
      <div className="overflow-x-auto rounded-box border border-line bg-panel shadow-card">
        {rows.length === 0 ? (
          <Empty title="No promises yet">Record one from a family page when a parent asks for more time.</Empty>
        ) : (
          <table className="w-full min-w-[720px] text-[15px]">
            <thead>
              <tr>
                <th className={th}>Family</th>
                <th className={`${th} text-right`}>Promised</th>
                <th className={th}>By</th>
                <th className={`${th} text-right`}>Paid since</th>
                <th className={th}>Status</th>
                <th className={th}>Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className={tr}>
                  <td className={td}><Link href={`/families/${f.id}`} className="font-bold hover:underline">{f.name}</Link></td>
                  <td className={`${td} text-right`}><Amount value={f.promise!.amount} /></td>
                  <td className={td}>{dateLabel(f.promise!.dueOn)}</td>
                  <td className={`${td} text-right`}><Amount value={f.promise!.paidSince} muted={!f.promise!.paidSince} /></td>
                  <td className={td}><Tag tone={f.promise!.state === "broken" ? "late" : f.promise!.state === "kept" ? "paid" : "sun"}>{label[f.promise!.state]}</Tag></td>
                  <td className={`${td} text-[14px] text-ink-2`}>{f.promise!.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  function ByClass() {
    const cls = classes.find((c) => c.id === classId) ?? classes[0];
    const pupils = families
      .flatMap((f) => f.pupils.filter((p) => p.classId === cls?.id && !p.leftOn).map((p) => ({ ...p, family: f })))
      .sort((a, b) => a.name.localeCompare(b.name));
    const cleared = pupils.filter((p) => p.dueNow === 0).length;
    return (
      <>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {classes.map((c) => (
            <Link key={c.id} href={`/collections?view=class&class=${c.id}`} className={clsx("flex min-h-11 items-center rounded-lg border px-3 text-[14px]", c.id === cls?.id ? "border-sun bg-sun font-bold text-white" : "border-line-strong bg-panel hover:border-sun")}>
              {c.name}
            </Link>
          ))}
          {cls && <LinkButton href={`/print/class/${cls.id}`} className="ml-auto">Print list for the teacher</LinkButton>}
        </div>
        <p className="mb-3 text-ink-2">{cleared} of {pupils.length} pupils are up to date with every fee due so far.</p>
        <div className="overflow-x-auto rounded-box border border-line bg-panel shadow-card">
          <table className="w-full min-w-[640px] text-[15px]">
            <thead>
              <tr>
                <th className={th}>Pupil</th>
                <th className={th}>Installments</th>
                <th className={`${th} text-right`}>Due now</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pupils.map((p) => (
                <tr key={p.id} className={tr}>
                  <td className={td}><Link href={`/families/${p.family.id}`} className="hover:underline"><b>{p.lastName}</b> {p.firstNames}</Link></td>
                  <td className={td}><FeeStrip segments={p.segments} /></td>
                  <td className={`${td} text-right`}><Amount value={p.dueNow} late={p.dueNow > 0} muted={!p.dueNow} /></td>
                  <td className={td}>{p.dueNow === 0 ? <Tag tone="paid">Cleared</Tag> : <Tag tone="late">Not cleared</Tag>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
}
