import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { paidOf } from "./billing";
import { chargeState, daysBetween, type ChargeState } from "./money";
import { iso, today } from "./format";
import type { StripSegment } from "@/components/ui";

export const getSchool = cache(() => db.school.findUnique({ where: { id: 1 } }));
export const currentYear = cache(() => db.year.findFirst({ where: { isCurrent: true } }));

const familyInclude = {
  pupils: {
    orderBy: { birthDate: "asc" },
    include: {
      enrollments: {
        include: {
          class: true,
          charges: {
            where: { cancelledAt: null },
            orderBy: [{ dueOn: "asc" }, { id: "asc" }],
            include: { allocations: { select: { amount: true, payment: { select: { voidedAt: true } } } } },
          },
        },
      },
    },
  },
  payments: {
    where: { voidedAt: null },
    orderBy: { id: "desc" },
    select: { id: true, amount: true, paidOn: true, createdAt: true, allocations: { select: { amount: true } } },
  },
  promises: { where: { cancelledAt: null }, orderBy: { createdAt: "desc" }, take: 1 },
  reminders: { orderBy: { createdAt: "desc" }, take: 1 },
} satisfies Prisma.FamilyInclude;

type FamilyRow = Prisma.FamilyGetPayload<{ include: typeof familyInclude }>;

export type ChargeLine = {
  id: number;
  label: string;
  dueOn: string;
  amount: number;
  discount: number;
  discountReason: string | null;
  net: number;
  paid: number;
  balance: number;
  state: ChargeState;
  yearId: number;
  oneOff: boolean;
};

export type PromiseState = "open" | "kept" | "broken";

function summarize(f: FamilyRow, yearId: number | undefined, now: string) {
  const pupils = f.pupils.map((p) => {
    const current = p.enrollments.find((e) => e.yearId === yearId) ?? null;
    const lines: ChargeLine[] = p.enrollments.flatMap((e) =>
      e.charges.map((c) => {
        const net = c.amount - c.discount;
        const paid = paidOf(c.allocations);
        return {
          id: c.id,
          label: c.label,
          dueOn: iso(c.dueOn),
          amount: c.amount,
          discount: c.discount,
          discountReason: c.discountReason,
          net,
          paid,
          balance: net - paid,
          state: chargeState(net, paid, iso(c.dueOn), now),
          yearId: e.yearId,
          oneOff: c.feeItemId === null,
        };
      }),
    );
    const yearLines = lines.filter((l) => l.yearId === yearId);
    const segments: StripSegment[] = yearLines.filter((l) => !l.oneOff).map((l) => ({ label: l.label, net: l.net, paid: l.paid, state: l.state }));
    const sum = (ls: ChargeLine[], k: "net" | "paid" | "balance") => ls.reduce((s, l) => s + l[k], 0);
    return {
      id: p.id,
      code: p.code,
      name: `${p.lastName} ${p.firstNames}`,
      lastName: p.lastName,
      firstNames: p.firstNames,
      status: p.status,
      sex: p.sex,
      birthDate: p.birthDate ? iso(p.birthDate) : null,
      enrollmentId: current?.id ?? null,
      className: current?.class.name ?? null,
      classId: current?.classId ?? null,
      classLevel: current?.class.level ?? 999,
      leftOn: current?.leftOn ? iso(current.leftOn) : null,
      lines,
      segments,
      billed: sum(yearLines, "net"),
      paid: sum(yearLines, "paid"),
      balance: sum(lines, "balance"),
      arrears: sum(lines.filter((l) => l.yearId !== yearId), "balance"),
      dueNow: sum(lines.filter((l) => l.dueOn <= now), "balance"),
    };
  });

  const all = pupils.flatMap((p) => p.lines);
  const overdue = all.filter((l) => l.balance > 0 && l.dueOn < now);
  const oldest = overdue.reduce<string | null>((m, l) => (!m || l.dueOn < m ? l.dueOn : m), null);
  const credit = f.payments.reduce((s, p) => s + p.amount - p.allocations.reduce((t, a) => t + a.amount, 0), 0);

  const pr = f.promises[0];
  let promise: { id: number; amount: number; dueOn: string; note: string | null; state: PromiseState; paidSince: number } | null = null;
  if (pr) {
    const since = iso(pr.createdAt);
    const paidSince = f.payments.filter((p) => iso(p.paidOn) >= since).reduce((s, p) => s + p.amount, 0);
    const dueOn = iso(pr.dueOn);
    const state: PromiseState = paidSince >= pr.amount ? "kept" : dueOn < now ? "broken" : "open";
    promise = { id: pr.id, amount: pr.amount, dueOn, note: pr.note, state, paidSince };
  }

  return {
    id: f.id,
    name: f.name,
    guardian: f.guardian,
    phone: f.phone,
    phone2: f.phone2,
    address: f.address,
    notes: f.notes,
    pausedUntil: f.remindersPausedUntil ? iso(f.remindersPausedUntil) : null,
    pupils,
    dueNow: pupils.reduce((s, p) => s + p.dueNow, 0),
    balance: pupils.reduce((s, p) => s + p.balance, 0),
    billed: pupils.reduce((s, p) => s + p.billed, 0),
    paid: pupils.reduce((s, p) => s + p.paid, 0),
    credit,
    oldestDue: oldest,
    daysLate: oldest ? daysBetween(oldest, now) : 0,
    lastPaidOn: f.payments[0] ? iso(f.payments[0].paidOn) : null,
    lastReminder: f.reminders[0] ? { at: f.reminders[0].createdAt, channel: f.reminders[0].channel } : null,
    promise,
  };
}

export type FamilySummary = ReturnType<typeof summarize>;

/** Every family with balances. ponytail: loads the whole school in memory; fine up to a few thousand pupils. */
export const allFamilies = cache(async () => {
  const [year, rows] = await Promise.all([currentYear(), db.family.findMany({ include: familyInclude, orderBy: { name: "asc" } })]);
  const now = today();
  return rows.map((f) => summarize(f, year?.id, now));
});

export async function oneFamily(id: number) {
  const [year, f] = await Promise.all([currentYear(), db.family.findUnique({ where: { id }, include: familyInclude })]);
  return f ? summarize(f, year?.id, today()) : null;
}

/** Book balance of an account: opening + money in - money out, reset by each count. */
export async function accountBalances() {
  const accounts = await db.account.findMany({ where: { active: true }, orderBy: { id: "asc" } });
  return Promise.all(accounts.map(async (a) => ({ ...a, ...(await accountPosition(a.id, a.openingBalance)) })));
}

export async function accountPosition(accountId: number, openingBalance: number) {
  const last = await db.cashCount.findFirst({ where: { accountId }, orderBy: { createdAt: "desc" } });
  const since = last?.createdAt;
  const after = since ? { gt: since } : undefined;
  const [pin, pvoid, eout, evoid, tin, tout] = await Promise.all([
    db.payment.aggregate({ _sum: { amount: true }, where: { accountId, method: { not: "OPENING" }, createdAt: after } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { accountId, method: { not: "OPENING" }, voidedAt: after ?? { not: null } } }),
    db.expense.aggregate({ _sum: { amount: true }, where: { accountId, createdAt: after } }),
    db.expense.aggregate({ _sum: { amount: true }, where: { accountId, voidedAt: after ?? { not: null } } }),
    db.transfer.aggregate({ _sum: { amount: true }, where: { toAccountId: accountId, createdAt: after } }),
    db.transfer.aggregate({ _sum: { amount: true }, where: { fromAccountId: accountId, createdAt: after } }),
  ]);
  const s = (x: { _sum: { amount: number | null } }) => x._sum.amount ?? 0;
  // A void is an event: money leaves (payment) or comes back (expense) when it is voided.
  const moves = s(pin) - s(pvoid) - s(eout) + s(evoid) + s(tin) - s(tout);
  const base = last ? last.counted : openingBalance;
  return { balance: base + moves, lastCount: last, sinceIn: s(pin) + s(tin) + s(evoid), sinceOut: s(pvoid) + s(eout) + s(tout), base };
}
