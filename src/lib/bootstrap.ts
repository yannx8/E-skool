import type { PrismaClient } from "@/generated/prisma/client";
import { day } from "./format";

export const DEFAULT_REMINDER =
  "Hello {guardian}, this is {school}. School fees of {amount} F are due for {pupils}. Please pay at the office or by Mobile Money. Thank you.";

export const STANDARD_CLASSES = ["Nursery 1", "Nursery 2", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"];

export const EXPENSE_CATEGORIES = ["Salaries", "Salary advances", "Teaching supplies", "Maintenance & repairs", "Electricity & water", "Rent", "Transport", "Food & canteen", "Office", "Other"];

/** First-run setup, shared by the setup screen and the demo seed. */
export async function bootstrapSchool(
  db: PrismaClient,
  input: { school: string; address?: string | null; phone?: string | null; adminName: string; username: string; passwordHash: string; yearName: string; startsOn: string; endsOn: string; classes: string[] },
) {
  return db.$transaction(async (tx) => {
    await tx.school.create({ data: { id: 1, name: input.school, address: input.address, phone: input.phone, reminderTemplate: DEFAULT_REMINDER } });
    const admin = await tx.user.create({ data: { name: input.adminName, username: input.username.toLowerCase(), passwordHash: input.passwordHash, role: "ADMIN" } });
    const year = await tx.year.create({ data: { name: input.yearName, startsOn: day(input.startsOn), endsOn: day(input.endsOn), isCurrent: true } });
    await tx.class.createMany({ data: input.classes.map((name, i) => ({ name, level: i + 1 })) });
    await tx.account.createMany({
      data: [
        { name: "Cash box", kind: "CASH" },
        { name: "MTN MoMo", kind: "MOBILE" },
        { name: "Orange Money", kind: "MOBILE" },
        { name: "Bank", kind: "BANK" },
      ],
    });
    await tx.expenseCategory.createMany({ data: EXPENSE_CATEGORIES.map((name) => ({ name })) });
    const y = Number(input.startsOn.slice(0, 4));
    const items = [
      ["Registration", `${y}-09-01`],
      ["Tuition, 1st installment", `${y}-09-15`],
      ["Tuition, 2nd installment", `${y}-12-01`],
      ["Tuition, 3rd installment", `${y + 1}-03-01`],
    ];
    await tx.feeItem.createMany({ data: items.map(([name, due], i) => ({ yearId: year.id, name, dueOn: day(due), position: i + 1 })) });
    return { admin, year };
  });
}
