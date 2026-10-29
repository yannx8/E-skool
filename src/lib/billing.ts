import "server-only";
import type { Method } from "@/generated/prisma/client";
import { db, type Tx } from "./db";
import { allocate, type OpenCharge, type Split } from "./money";
import { day, iso } from "./format";

type AllocRow = { amount: number; payment: { voidedAt: Date | null } };
export const paidOf = (allocations: AllocRow[]) =>
  allocations.reduce((s, a) => (a.payment.voidedAt ? s : s + a.amount), 0);

const withAllocs = { allocations: { select: { amount: true, payment: { select: { voidedAt: true } } } } } as const;

/**
 * Keep an enrollment's charges equal to the fee table for its class.
 * Runs on enrollment, class change, departure and every fee-table edit.
 * A charge never drops below what was already paid on it.
 */
export async function syncCharges(tx: Tx, enrollmentId: number) {
  const e = await tx.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: { charges: { include: withAllocs } },
  });
  const items = await tx.feeItem.findMany({
    where: { yearId: e.yearId },
    include: { amounts: { where: { classId: e.classId } } },
  });

  for (const item of items) {
    const existing = e.charges.find((c) => c.feeItemId === item.id);
    if (item.optional && !existing) continue; // optional items are added per pupil
    const leaving = e.leftOn !== null && item.dueOn > e.leftOn;
    const target = leaving ? 0 : (item.amounts[0]?.amount ?? 0);

    if (!existing) {
      if (target > 0)
        await tx.charge.create({
          data: { enrollmentId, feeItemId: item.id, label: item.name, amount: target, dueOn: item.dueOn },
        });
      continue;
    }

    const paid = paidOf(existing.allocations);
    if (target === 0) {
      if (paid === 0 && !existing.cancelledAt)
        await tx.charge.update({
          where: { id: existing.id },
          data: { cancelledAt: new Date(), cancelReason: leaving ? "Pupil left" : "Not billed to this class" },
        });
      else if (paid > 0 && existing.amount !== paid)
        await tx.charge.update({ where: { id: existing.id }, data: { amount: paid, discount: 0 } });
      continue;
    }

    const amount = Math.max(target, paid + existing.discount);
    if (existing.cancelledAt || existing.amount !== amount || existing.label !== item.name || +existing.dueOn !== +item.dueOn)
      await tx.charge.update({
        where: { id: existing.id },
        data: { amount, label: item.name, dueOn: item.dueOn, cancelledAt: null, cancelReason: null },
      });
  }

  // One-off charges falling after a departure are dropped if unpaid.
  if (e.leftOn)
    for (const c of e.charges)
      if (!c.feeItemId && !c.cancelledAt && c.dueOn > e.leftOn && paidOf(c.allocations) === 0)
        await tx.charge.update({ where: { id: c.id }, data: { cancelledAt: new Date(), cancelReason: "Pupil left" } });
}

/** Open charges of every pupil in the family, across years. */
export async function openCharges(tx: Tx, familyId: number) {
  const charges = await tx.charge.findMany({
    where: { cancelledAt: null, enrollment: { pupil: { familyId } } },
    include: { ...withAllocs, enrollment: { include: { pupil: true, class: true } } },
    orderBy: [{ dueOn: "asc" }, { id: "asc" }],
  });
  return charges
    .map((c) => ({ ...c, balance: c.amount - c.discount - paidOf(c.allocations) }))
    .filter((c) => c.balance > 0);
}

const toOpen = (c: { id: number; dueOn: Date; balance: number }): OpenCharge => ({
  id: c.id,
  dueOn: iso(c.dueOn),
  balance: c.balance,
});

/** Unallocated money from earlier payments pays new charges automatically. */
export async function applyCredit(tx: Tx, familyId: number) {
  const payments = await tx.payment.findMany({
    where: { familyId, voidedAt: null },
    include: { allocations: { select: { amount: true } } },
    orderBy: { id: "asc" },
  });
  for (const p of payments) {
    const left = p.amount - p.allocations.reduce((s, a) => s + a.amount, 0);
    if (left <= 0) continue;
    const open = await openCharges(tx, familyId);
    if (!open.length) return;
    const { splits } = allocate(open.map(toOpen), left);
    for (const s of splits) await tx.allocation.create({ data: { paymentId: p.id, chargeId: s.chargeId, amount: s.amount } });
  }
}

export async function familyCredit(tx: Tx, familyId: number) {
  const payments = await tx.payment.findMany({
    where: { familyId, voidedAt: null },
    include: { allocations: { select: { amount: true } } },
  });
  return payments.reduce((s, p) => s + p.amount - p.allocations.reduce((t, a) => t + a.amount, 0), 0);
}

export type PaymentInput = {
  familyId: number;
  amount: number;
  method: Method;
  accountId: number;
  paidOn: string;
  reference?: string | null;
  payer?: string | null;
  note?: string | null;
  /** Cashier's own split; omitted = oldest due first. */
  splits?: Split[];
};

export async function recordPayment(input: PaymentInput, userId: number) {
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new Error("Enter the amount received.");
  return db.$transaction(async (tx) => {
    const open = await openCharges(tx, input.familyId);
    let splits = input.splits?.filter((s) => s.amount > 0);
    if (splits?.length) {
      let total = 0;
      for (const s of splits) {
        const c = open.find((o) => o.id === s.chargeId);
        if (!c) throw new Error("A selected fee is already paid or belongs to another family.");
        if (!Number.isInteger(s.amount) || s.amount > c.balance) throw new Error(`${c.label}: at most ${c.balance} is due.`);
        total += s.amount;
      }
      if (total > input.amount) throw new Error("The split is larger than the amount received.");
    } else {
      splits = allocate(open.map(toOpen), input.amount).splits;
    }

    const school = await tx.school.update({ where: { id: 1 }, data: { lastReceiptNo: { increment: 1 } } });
    const payment = await tx.payment.create({
      data: {
        number: school.lastReceiptNo,
        familyId: input.familyId,
        amount: input.amount,
        method: input.method,
        accountId: input.accountId,
        paidOn: day(input.paidOn),
        reference: input.reference || null,
        payer: input.payer || null,
        note: input.note || null,
        createdById: userId,
        allocations: { create: splits.map((s) => ({ chargeId: s.chargeId, amount: s.amount })) },
      },
    });
    return payment;
  });
}

export async function voidPayment(id: number, reason: string, userId: number) {
  if (reason.trim().length < 4) throw new Error("Give the reason for voiding this receipt.");
  await db.$transaction(async (tx) => {
    const p = await tx.payment.findUniqueOrThrow({ where: { id } });
    if (p.voidedAt) throw new Error("This receipt is already void.");
    await tx.payment.update({ where: { id }, data: { voidedAt: new Date(), voidedById: userId, voidReason: reason.trim() } });
    await tx.auditLog.create({
      data: { userId, action: "payment.void", entity: "Payment", entityId: id, detail: { number: p.number, amount: p.amount, reason } },
    });
    // The family's other unallocated money may now cover the reopened charges.
    await applyCredit(tx, p.familyId);
  });
}

/** Re-sync every enrollment of a year, e.g. after the fee table changed. */
export async function syncYear(tx: Tx, yearId: number) {
  const enrollments = await tx.enrollment.findMany({ where: { yearId }, select: { id: true, pupil: { select: { familyId: true } } } });
  for (const e of enrollments) await syncCharges(tx, e.id);
  for (const familyId of new Set(enrollments.map((e) => e.pupil.familyId))) await applyCredit(tx, familyId);
  return enrollments.length;
}
