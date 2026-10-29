import "server-only";
import { db } from "./db";
import { oneFamily } from "./queries";

export async function receiptData(id: number) {
  const p = await db.payment.findUnique({
    where: { id },
    include: {
      family: true,
      account: true,
      createdBy: true,
      voidedBy: true,
      allocations: { include: { charge: { include: { enrollment: { include: { pupil: true, class: true } } } } }, orderBy: { id: "asc" } },
    },
  });
  if (!p) return null;
  const family = await oneFamily(p.familyId);
  const lines = p.allocations.map((a) => ({
    pupil: `${a.charge.enrollment.pupil.firstNames} ${a.charge.enrollment.pupil.lastName}`,
    className: a.charge.enrollment.class.name,
    label: a.charge.label,
    amount: a.amount,
  }));
  const credit = p.amount - lines.reduce((s, l) => s + l.amount, 0);
  return { p, lines, credit, balanceNow: family?.balance ?? 0, dueNow: family?.dueNow ?? 0 };
}

export type ReceiptData = NonNullable<Awaited<ReturnType<typeof receiptData>>>;
