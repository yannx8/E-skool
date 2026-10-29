import Link from "next/link";
import { HandCoins } from "lucide-react";
import { can, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountBalances, allFamilies, currentYear } from "@/lib/queries";
import { METHOD_LABEL, day, dayMonth, daysAgo, fmt, receiptNo, today } from "@/lib/format";
import { ActivityFeed, Amount, Avatar, LinkButton, PageHeader, Panel, RowAction, RowActions, SummaryCard, Tag, td, th, tr, type BarTone, type FeedItem } from "@/components/ui";

export const metadata = { title: "Overview" };

const METHOD_TONE: Record<string, BarTone> = { CASH: "paid3", MTN_MOMO: "paid2", ORANGE_MONEY: "paid1", BANK: "paid" };

export default async function OverviewPage() {
  const user = await requireUser();
  const now = today();
  const weekAgo = day(daysAgo(7));
  const [families, year, accounts, todays, spentToday, voids, shortCounts, byMethod, recent] = await Promise.all([
    allFamilies(),
    currentYear(),
    accountBalances(),
    db.payment.findMany({ where: { paidOn: day(now), voidedAt: null, method: { not: "OPENING" } } }),
    db.expense.aggregate({ _sum: { amount: true }, where: { spentOn: day(now), voidedAt: null } }),
    db.payment.findMany({ where: { voidedAt: { gte: weekAgo } }, include: { voidedBy: true, family: true }, orderBy: { voidedAt: "desc" } }),
    db.cashCount.findMany({ where: { createdAt: { gte: weekAgo } }, include: { account: true, createdBy: true }, orderBy: { createdAt: "desc" } }),
    db.payment.groupBy({ by: ["method"], _sum: { amount: true }, where: { voidedAt: null, method: { not: "OPENING" }, paidOn: { gt: day(daysAgo(35)) } } }),
    db.payment.findMany({ where: { voidedAt: null, method: { not: "OPENING" } }, include: { family: true }, orderBy: [{ paidOn: "desc" }, { number: "desc" }], take: 6 }),
  ]);

  const pupils = families.flatMap((f) => f.pupils.filter((p) => p.enrollmentId && !p.leftOn));
  const lines = pupils.flatMap((p) => p.lines.filter((l) => l.yearId === year?.id));
  const billed = lines.reduce((s, l) => s + l.net, 0);
  const paid = lines.reduce((s, l) => s + l.paid, 0);
  const overdue = lines.filter((l) => l.dueOn < now).reduce((s, l) => s + l.balance, 0);
  const later = billed - paid - overdue;
  const dueSoFar = lines.filter((l) => l.dueOn <= now).reduce((s, l) => s + l.net, 0);
  const rate = dueSoFar ? Math.round(((dueSoFar - lines.filter((l) => l.dueOn <= now).reduce((s, l) => s + l.balance, 0)) / dueSoFar) * 100) : 100;
  const arrears = families.flatMap((f) => f.pupils.flatMap((p) => p.lines.filter((l) => l.yearId !== year?.id))).reduce((s, l) => s + l.balance, 0);

  const collectedToday = todays.reduce((s, p) => s + p.amount, 0);
  const box = accounts.find((a) => a.kind === "CASH");
  const countedToday = box?.lastCount && box.lastCount.createdAt.toISOString().slice(0, 10) === now;

  const classes = Object.values(
    pupils.reduce<Record<string, { name: string; level: number; n: number; billed: number; paid: number; late: number }>>((m, p) => {
      const k = p.className ?? "—";
      m[k] ??= { name: k, level: p.classLevel, n: 0, billed: 0, paid: 0, late: 0 };
      m[k].n++;
      for (const l of p.lines.filter((x) => x.yearId === year?.id)) {
        m[k].billed += l.net;
        m[k].paid += l.paid;
        if (l.dueOn < now) m[k].late += l.balance;
      }
      return m;
    }, {}),
  ).sort((a, b) => a.level - b.level);

  const broken = families.filter((f) => f.promise?.state === "broken");
  const topLate = families.filter((f) => f.daysLate > 0).sort((a, b) => b.dueNow - a.dueNow).slice(0, 5);
  const diffs = shortCounts.filter((c) => c.counted !== c.expected);
  const received35 = byMethod.reduce((s, m) => s + (m._sum.amount ?? 0), 0);

  // Brightwheel's activity feed: money in, voids, cash differences, broken promises, newest first.
  const feed: (FeedItem & { at: string })[] = [
    ...recent.map((p) => ({ key: `p${p.id}`, at: p.paidOn.toISOString(), date: dayMonth(p.paidOn), strong: `${fmt(p.amount)} F`, text: `received from ${p.family.name}`, note: `${METHOD_LABEL[p.method]} · receipt ${receiptNo(p.number)}`, href: `/payments/${p.id}` })),
    ...voids.map((p) => ({ key: `v${p.id}`, at: p.voidedAt!.toISOString(), date: dayMonth(p.voidedAt!), strong: <Tag tone="late">Void</Tag>, text: `receipt ${receiptNo(p.number)} · ${fmt(p.amount)} F · ${p.family.name}`, note: `${p.voidedBy?.name}: ${p.voidReason}`, href: `/payments/${p.id}` })),
    ...diffs.map((c) => ({ key: `c${c.id}`, at: c.createdAt.toISOString(), date: dayMonth(c.createdAt), strong: <Tag tone="late">{c.counted < c.expected ? "Cash short" : "Cash over"}</Tag>, text: `${fmt(Math.abs(c.counted - c.expected))} F · ${c.account.name} · ${c.createdBy.name}`, note: c.note, href: `/cash?account=${c.accountId}` })),
    ...broken.map((f) => ({ key: `b${f.id}`, at: `${f.promise!.dueOn}T23:59`, date: dayMonth(f.promise!.dueOn), strong: <Tag tone="late">Broken promise</Tag>, text: `${f.name} · ${fmt(f.promise!.amount)} F`, href: `/families/${f.id}` })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <PageHeader
        title="Billing"
        sub={`${new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Douala" }).format(new Date())} · school year ${year?.name ?? ""}`}
        actions={
          can.collect(user) && (
            <LinkButton href="/payments/new" tone="primary">
              <HandCoins className="size-[18px]" strokeWidth={2.2} /> Receive payment
            </LinkButton>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
          <SummaryCard
            title="Open fees"
            sub={`As of today · ${rate}% of fees due so far is collected`}
            total={overdue + later + arrears}
            parts={[
              { label: "Past due", value: overdue, tone: "late", href: "/collections" },
              { label: "Not yet due", value: later, tone: "later" },
              ...(arrears > 0 ? [{ label: "Previous years", value: arrears, tone: "late" as const, href: "/collections" }] : []),
            ]}
          />
          <SummaryCard
            title="Payments"
            sub="Last 35 days"
            total={received35}
            parts={byMethod
              .filter((m) => (m._sum.amount ?? 0) > 0)
              .sort((a, b) => (b._sum.amount ?? 0) - (a._sum.amount ?? 0))
              .map((m) => ({ label: METHOD_LABEL[m.method], value: m._sum.amount ?? 0, tone: METHOD_TONE[m.method] ?? "paid" }))}
          />

          <section className="grid overflow-hidden rounded-box border border-line bg-panel shadow-card sm:grid-cols-3 sm:divide-x sm:divide-line">
            <div className="p-5">
              <div className="text-[14px] text-ink-2">Received today</div>
              <div className="num mt-1 text-[24px] font-semibold">{fmt(collectedToday)}</div>
              <div className="text-[14px] text-ink-3">{todays.length} receipts</div>
            </div>
            <div className="border-t border-line p-5 sm:border-t-0">
              <div className="text-[14px] text-ink-2">Spent today</div>
              <div className="num mt-1 text-[24px] font-semibold">{fmt(spentToday._sum.amount ?? 0)}</div>
              <Link href="/expenses" className="text-[14px] text-sun underline">Expenses</Link>
            </div>
            <div className="border-t border-line p-5 sm:border-t-0">
              <div className="text-[14px] text-ink-2">{box?.name ?? "Cash box"}, in the books</div>
              <div className="num mt-1 text-[24px] font-semibold">{fmt(box?.balance ?? 0)}</div>
              {countedToday ? <span className="text-[14px] text-paid">Counted today</span> : <Link href="/cash" className="text-[14px] text-late underline">Not counted today</Link>}
            </div>
          </section>

          <Panel title="Who owes most" sub="Past due, biggest first" actions={<Link href="/collections" className="text-[15px] font-bold text-sun hover:underline">All unpaid</Link>} flush>
            {topLate.length === 0 ? (
              <p className="px-5 py-4 text-ink-3">Nobody is late.</p>
            ) : (
              <ul className="divide-y divide-line">
                {topLate.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={f.name} />
                    <Link href={`/families/${f.id}`} className="min-w-0 flex-1 hover:underline">
                      <b className="block truncate">{f.name}</b>
                      <span className="text-[14px] text-ink-3">{f.daysLate} days late</span>
                    </Link>
                    <Amount value={f.dueNow} late />
                    <RowActions>
                      {can.collect(user) && <RowAction href={`/payments/new?family=${f.id}`}>Receive payment</RowAction>}
                      <RowAction href={`/print/statement/${f.id}`}>Statement</RowAction>
                      <RowAction href={`/families/${f.id}`}>Open family</RowAction>
                    </RowActions>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="By class" sub={`Fees for ${year?.name ?? "the year"}`} flush>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-[15px]">
                <thead>
                  <tr><th className={th}>Class</th><th className={`${th} text-right`}>Pupils</th><th className={`${th} text-right`}>Billed</th><th className={`${th} text-right`}>Collected</th><th className={`${th} text-right`}>Late</th><th className={th}>Collected</th></tr>
                </thead>
                <tbody>
                  {classes.map((c) => (
                    <tr key={c.name} className={tr}>
                      <td className={`${td} font-medium`}>{c.name}</td>
                      <td className={`${td} num text-right`}>{c.n}</td>
                      <td className={`${td} text-right`}><Amount value={c.billed} /></td>
                      <td className={`${td} text-right`}><Amount value={c.paid} /></td>
                      <td className={`${td} text-right`}><Amount value={c.late} late={c.late > 0} muted={!c.late} /></td>
                      <td className={`${td} w-40`}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-[3px] bg-later-soft"><div className="h-full bg-paid-3" style={{ width: `${c.billed ? (c.paid / c.billed) * 100 : 0}%` }} /></div>
                          <span className="num w-10 text-right text-[13px] text-ink-2">{c.billed ? Math.round((c.paid / c.billed) * 100) : 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <aside className="min-w-0 space-y-6">
          <ActivityFeed title="Billing activity" sub="Latest receipts and anything to check" items={feed} empty="Nothing yet." />

          <Panel title="Money position" sub="In the books, by account" flush>
            <ul className="divide-y divide-line">
              {accounts.map((a) => (
                <li key={a.id} className="flex min-h-11 items-center justify-between px-5 py-2.5">
                  <Link href={`/cash?account=${a.id}`} className="hover:text-sun hover:underline">{a.name}</Link>
                  <Amount value={a.balance} />
                </li>
              ))}
              <li className="flex justify-between bg-ground px-5 py-3 font-bold">
                <span>Total</span>
                <Amount value={accounts.reduce((s, a) => s + a.balance, 0)} />
              </li>
            </ul>
          </Panel>
        </aside>
      </div>
    </>
  );
}
