import Link from "next/link";
import { clsx } from "clsx";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { allFamilies, currentYear } from "@/lib/queries";
import { dateLabel, fmt, timeLabel } from "@/lib/format";
import { Amount, PageHeader, Panel, td, th, tr } from "@/components/ui";

export const metadata = { title: "Reports" };

const ACTION: Record<string, string> = {
  "payment.void": "Voided a receipt",
  "expense.void": "Voided an expense",
  "charge.discount": "Gave a discount",
  "charge.cancel": "Removed a fee",
  "charge.add": "Added a fee",
  "fees.update": "Changed the fee table",
  "fees.remove": "Removed a fee-table row",
  "pupil.left": "Recorded a departure",
  "user.add": "Added a user",
  "user.update": "Changed a user",
  "account.opening": "Changed an opening balance",
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireUser();
  const view = (await searchParams).view ?? "money";
  const year = await currentYear();
  const tabs = [
    { v: "money", label: "Money in and out" },
    { v: "fees", label: "Fees by item" },
    { v: "controls", label: "Controls" },
    { v: "export", label: "Export" },
  ];
  return (
    <>
      <PageHeader title="Reports" sub={`School year ${year?.name ?? ""}`} />
      <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <Link key={t.v} href={`/reports?view=${t.v}`} aria-current={view === t.v ? "page" : undefined} className={clsx("-mb-px border-b-2 px-3 py-2.5 text-[15px] whitespace-nowrap", view === t.v ? "border-rail font-bold" : "border-transparent text-ink-2 hover:text-ink")}>
            {t.label}
          </Link>
        ))}
      </nav>
      {view === "money" && <MoneyReport startsOn={year?.startsOn} endsOn={year?.endsOn} />}
      {view === "fees" && <FeesReport yearId={year?.id} />}
      {view === "controls" && <Controls />}
      {view === "export" && <Exports />}
    </>
  );
}

async function MoneyReport({ startsOn, endsOn }: { startsOn?: Date; endsOn?: Date }) {
  if (!startsOn || !endsOn) return null;
  const where = { voidedAt: null, paidOn: { gte: startsOn, lte: endsOn } };
  const [payments, expenses] = await Promise.all([
    db.payment.findMany({ where, select: { paidOn: true, amount: true } }),
    db.expense.findMany({ where: { voidedAt: null, spentOn: { gte: startsOn, lte: endsOn } }, select: { spentOn: true, amount: true, category: { select: { name: true } } } }),
  ]);
  const months: string[] = [];
  for (const d = new Date(startsOn); d <= endsOn; d.setUTCMonth(d.getUTCMonth() + 1)) months.push(d.toISOString().slice(0, 7));
  const inn = (m: string) => payments.filter((p) => p.paidOn.toISOString().startsWith(m)).reduce((s, p) => s + p.amount, 0);
  const out = (m: string, cat?: RegExp) => expenses.filter((e) => e.spentOn.toISOString().startsWith(m) && (!cat || cat.test(e.category.name))).reduce((s, e) => s + e.amount, 0);
  const label = (m: string) => new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${m}-01`));
  const tot = { inn: months.reduce((s, m) => s + inn(m), 0), sal: months.reduce((s, m) => s + out(m, /salar/i), 0), out: months.reduce((s, m) => s + out(m), 0) };
  return (
    <Panel title="Fees received against money spent, month by month" flush>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[15px]">
          <thead>
            <tr><th className={th}>Month</th><th className={`${th} text-right`}>Fees received</th><th className={`${th} text-right`}>Salaries</th><th className={`${th} text-right`}>Other expenses</th><th className={`${th} text-right`}>Result</th></tr>
          </thead>
          <tbody>
            {months.map((m) => {
              const r = inn(m) - out(m);
              return (
                <tr key={m} className={tr}>
                  <td className={td}>{label(m)}</td>
                  <td className={`${td} text-right`}><Amount value={inn(m)} muted={!inn(m)} /></td>
                  <td className={`${td} text-right`}><Amount value={out(m, /salar/i)} muted={!out(m, /salar/i)} /></td>
                  <td className={`${td} text-right`}><Amount value={out(m) - out(m, /salar/i)} muted={!(out(m) - out(m, /salar/i))} /></td>
                  <td className={`${td} num text-right font-semibold ${r < 0 ? "text-late" : ""}`}>{r < 0 ? "−" : ""}{fmt(Math.abs(r))}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line-strong font-semibold">
              <td className={td}>Year</td>
              <td className={`${td} text-right`}><Amount value={tot.inn} /></td>
              <td className={`${td} text-right`}><Amount value={tot.sal} /></td>
              <td className={`${td} text-right`}><Amount value={tot.out - tot.sal} /></td>
              <td className={`${td} num text-right ${tot.inn - tot.out < 0 ? "text-late" : ""}`}>{tot.inn - tot.out < 0 ? "−" : ""}{fmt(Math.abs(tot.inn - tot.out))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}

async function FeesReport({ yearId }: { yearId?: number }) {
  const families = await allFamilies();
  const lines = families.flatMap((f) => f.pupils.flatMap((p) => p.lines.filter((l) => l.yearId === yearId)));
  const rows = Object.values(
    lines.reduce<Record<string, { label: string; due: string; n: number; amount: number; discount: number; paid: number; balance: number }>>((m, l) => {
      m[l.label] ??= { label: l.label, due: l.dueOn, n: 0, amount: 0, discount: 0, paid: 0, balance: 0 };
      const r = m[l.label];
      r.n++;
      r.amount += l.amount;
      r.discount += l.discount;
      r.paid += l.paid;
      r.balance += l.balance;
      return m;
    }, {}),
  ).sort((a, b) => a.due.localeCompare(b.due));
  return (
    <Panel title="Each fee: billed, discounted, collected, still owed" flush>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[15px]">
          <thead>
            <tr><th className={th}>Fee</th><th className={`${th} text-right`}>Pupils</th><th className={`${th} text-right`}>Billed</th><th className={`${th} text-right`}>Discounts</th><th className={`${th} text-right`}>Collected</th><th className={`${th} text-right`}>Still owed</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className={tr}>
                <td className={td}>{r.label}<div className="text-[13px] text-ink-3">due {dateLabel(r.due)}</div></td>
                <td className={`${td} num text-right`}>{r.n}</td>
                <td className={`${td} text-right`}><Amount value={r.amount} /></td>
                <td className={`${td} text-right`}><Amount value={r.discount} muted={!r.discount} /></td>
                <td className={`${td} text-right`}><Amount value={r.paid} /></td>
                <td className={`${td} text-right`}><Amount value={r.balance} late={r.balance > 0 && r.due < new Date().toISOString().slice(0, 10)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

async function Controls() {
  const logs = await db.auditLog.findMany({ orderBy: { at: "desc" }, take: 200, include: { user: true } });
  return (
    <Panel title="Every sensitive change, newest first" flush>
      <p className="border-b border-line px-5 py-3 text-[14px] text-ink-2">Voids, discounts, removed fees, fee-table changes and user changes. Nothing here can be edited or deleted.</p>
      <table className="w-full text-[15px]">
        <tbody>
          {logs.map((l) => {
            const d = (l.detail ?? {}) as Record<string, unknown>;
            return (
              <tr key={l.id} className={tr}>
                <td className={`${td} text-[14px] whitespace-nowrap text-ink-2`}>{dateLabel(l.at)} {timeLabel(l.at)}</td>
                <td className={td}><b>{l.user?.name ?? "System"}</b> {ACTION[l.action] ?? l.action}</td>
                <td className={`${td} text-[14px] text-ink-2`}>
                  {[d.number && `No. ${d.number}`, d.label, d.description, typeof d.amount === "number" && `${fmt(d.amount)} F`, typeof d.discount === "number" && `−${fmt(d.discount)} F`, d.reason].filter(Boolean).join(" · ")}
                </td>
              </tr>
            );
          })}
          {!logs.length && <tr><td className={`${td} text-ink-3`}>Nothing yet.</td></tr>}
        </tbody>
      </table>
    </Panel>
  );
}

function Exports() {
  const files = [
    ["families", "Families and pupils with balances"],
    ["payments", "All receipts"],
    ["expenses", "All expenses"],
    ["owing", "Who owes, with amounts due now"],
  ];
  return (
    <Panel title="Download for Excel">
      <ul className="space-y-2">
        {files.map(([k, l]) => (
          <li key={k}><a href={`/api/export/${k}`} className="underline">{l}</a> <span className="text-ink-3">(.csv)</span></li>
        ))}
      </ul>
    </Panel>
  );
}
