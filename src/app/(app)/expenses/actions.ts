"use server";

import { db } from "@/lib/db";
import { act, int, need, str } from "@/lib/act";
import { requireUser } from "@/lib/auth";
import { spend } from "@/lib/spend";
import { today } from "@/lib/format";

export async function addExpense(fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN", "CASHIER");
    await spend(
      {
        spentOn: str(fd, "spentOn") ?? today(),
        categoryId: need(int(fd, "categoryId"), "Category"),
        description: need(str(fd, "description"), "What was bought"),
        amount: need(int(fd, "amount"), "Amount"),
        accountId: need(int(fd, "accountId"), "Paid from"),
        payee: str(fd, "payee"),
        reference: str(fd, "reference"),
      },
      user.id,
    );
    return { ok: "Expense recorded." };
  });
}

export async function voidExpense(id: number, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN");
    const reason = need(str(fd, "reason"), "Reason");
    const e = await db.expense.update({ where: { id, voidedAt: null }, data: { voidedAt: new Date(), voidedById: user.id, voidReason: reason } });
    await db.auditLog.create({ data: { userId: user.id, action: "expense.void", entity: "Expense", entityId: id, detail: { amount: e.amount, description: e.description, reason } } });
    return { ok: "Expense voided. The money is back in its account." };
  });
}
