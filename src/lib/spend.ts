import "server-only";
import { db } from "./db";
import { accountPosition } from "./queries";
import { day, fmt, today } from "./format";

/** Money out, shared by expenses and payroll. Cash out never exceeds what the account holds (Toast payout rule). */
export async function spend(
  input: { spentOn: string; categoryId: number; description: string; amount: number; accountId: number; payee?: string | null; reference?: string | null; staffId?: number | null; payMonth?: string | null },
  userId: number,
) {
  if (input.amount <= 0) throw new Error("Enter the amount spent.");
  if (input.spentOn > today()) throw new Error("The date cannot be in the future.");
  const account = await db.account.findUniqueOrThrow({ where: { id: input.accountId } });
  const { balance } = await accountPosition(account.id, account.openingBalance);
  if (input.amount > balance) throw new Error(`${account.name} only holds ${fmt(balance)} F. Record the money coming in first, or pay from another account.`);
  return db.expense.create({ data: { ...input, spentOn: day(input.spentOn), createdById: userId } });
}
