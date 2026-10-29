"use server";

import { db } from "@/lib/db";
import { act, int, need, str } from "@/lib/act";
import { requireUser } from "@/lib/auth";
import { spend } from "@/lib/spend";
import { day, normalizePhone, today } from "@/lib/format";

const category = async (name: string) =>
  (await db.expenseCategory.findUnique({ where: { name } })) ?? db.expenseCategory.create({ data: { name } });

export async function saveStaff(id: number | null, fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN");
    const data = {
      name: need(str(fd, "name"), "Name"),
      position: str(fd, "position"),
      phone: normalizePhone(str(fd, "phone")),
      salary: int(fd, "salary") ?? 0,
      startedOn: str(fd, "startedOn") ? day(str(fd, "startedOn")!) : null,
      active: id === null || fd.get("active") === "on",
    };
    if (id) await db.staff.update({ where: { id }, data });
    else await db.staff.create({ data });
    return { ok: "Saved." };
  });
}

/** Salary and advance are expenses tied to a staff member and a month: no separate payroll ledger. */
export async function payStaff(staffId: number, kind: "salary" | "advance", month: string, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN");
    const s = await db.staff.findUniqueOrThrow({ where: { id: staffId } });
    const cat = await category(kind === "salary" ? "Salaries" : "Salary advances");
    await spend(
      {
        spentOn: str(fd, "spentOn") ?? today(),
        categoryId: cat.id,
        description: `${kind === "salary" ? "Salary" : "Advance"} ${month} · ${s.name}`,
        amount: need(int(fd, "amount"), "Amount"),
        accountId: need(int(fd, "accountId"), "Paid from"),
        payee: s.name,
        reference: str(fd, "reference"),
        staffId,
        payMonth: month,
      },
      user.id,
    );
    return { ok: kind === "salary" ? `Salary paid to ${s.name}.` : `Advance given to ${s.name}. It comes off this month's salary.` };
  });
}
