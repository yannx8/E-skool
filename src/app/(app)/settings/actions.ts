"use server";

import { db } from "@/lib/db";
import { act, int, need, str } from "@/lib/act";
import { hashPassword, requireUser } from "@/lib/auth";
import { syncYear } from "@/lib/billing";
import { currentYear } from "@/lib/queries";
import { day, normalizePhone } from "@/lib/format";
import type { AccountKind, ReceiptSize, Role } from "@/generated/prisma/client";

const LONG = { timeout: 120_000, maxWait: 10_000 };

export async function saveFeeTable(fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN");
    const year = await currentYear();
    if (!year) return { error: "No current school year." };
    const [items, classes] = await Promise.all([db.feeItem.findMany({ where: { yearId: year.id } }), db.class.findMany({ where: { active: true } })]);
    const n = await db.$transaction(async (tx) => {
      for (const i of items) {
        await tx.feeItem.update({
          where: { id: i.id },
          data: { name: str(fd, `name-${i.id}`) ?? i.name, dueOn: day(str(fd, `due-${i.id}`) ?? i.dueOn.toISOString().slice(0, 10)), optional: fd.get(`opt-${i.id}`) === "on" },
        });
        for (const c of classes) {
          const amount = int(fd, `amt-${i.id}-${c.id}`) ?? 0;
          await tx.feeAmount.upsert({ where: { feeItemId_classId: { feeItemId: i.id, classId: c.id } }, create: { feeItemId: i.id, classId: c.id, amount }, update: { amount } });
        }
      }
      await tx.auditLog.create({ data: { userId: user.id, action: "fees.update", entity: "Year", entityId: year.id } });
      return syncYear(tx, year.id);
    }, LONG);
    return { ok: `Fee table saved. ${n} pupils' bills checked.` };
  });
}

export async function addFeeItem(fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN");
    const year = await currentYear();
    const last = await db.feeItem.findFirst({ where: { yearId: year!.id }, orderBy: { position: "desc" } });
    await db.feeItem.create({ data: { yearId: year!.id, name: need(str(fd, "name"), "Name"), dueOn: day(need(str(fd, "dueOn"), "Due date")), optional: fd.get("optional") === "on", position: (last?.position ?? 0) + 1 } });
    return { ok: "Row added. Fill in the amounts and save." };
  });
}

export async function removeFeeItem(fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN");
    const id = need(int(fd, "id"), "Fee");
    const paid = await db.allocation.count({ where: { charge: { feeItemId: id }, payment: { voidedAt: null } } });
    if (paid) return { error: "Some parents already paid this fee. It cannot be removed; set its amounts to 0 instead." };
    await db.$transaction(async (tx) => {
      const charges = await tx.charge.findMany({ where: { feeItemId: id }, select: { id: true } });
      await tx.allocation.deleteMany({ where: { chargeId: { in: charges.map((c) => c.id) } } }); // only voided payments' leftovers
      await tx.charge.deleteMany({ where: { feeItemId: id } });
      const item = await tx.feeItem.delete({ where: { id } });
      await tx.auditLog.create({ data: { userId: user.id, action: "fees.remove", entity: "FeeItem", entityId: id, detail: { name: item.name } } });
    });
    return { ok: "Fee removed." };
  });
}

export async function saveSchool(fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN");
    await db.school.update({
      where: { id: 1 },
      data: {
        name: need(str(fd, "name"), "School name"),
        motto: str(fd, "motto"),
        address: str(fd, "address"),
        phone: normalizePhone(str(fd, "phone")),
        email: str(fd, "email"),
        receiptSize: (str(fd, "receiptSize") as ReceiptSize) ?? "A5",
        receiptNote: str(fd, "receiptNote"),
        reminderTemplate: need(str(fd, "reminderTemplate"), "Reminder message"),
      },
    });
    return { ok: "Saved." };
  });
}

export async function addClass(fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN");
    const last = await db.class.findFirst({ orderBy: { level: "desc" } });
    await db.class.create({ data: { name: need(str(fd, "name"), "Class name"), level: (last?.level ?? 0) + 1 } });
    return { ok: "Class added. Add its amounts in the fee table." };
  });
}

export async function renameClass(id: number, fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN");
    await db.class.update({ where: { id }, data: { name: need(str(fd, "name"), "Class name"), level: int(fd, "level") ?? undefined } });
    return { ok: "Saved." };
  });
}

export async function addAccount(fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN");
    await db.account.create({ data: { name: need(str(fd, "name"), "Name"), kind: (str(fd, "kind") as AccountKind) ?? "BANK", openingBalance: int(fd, "openingBalance") ?? 0 } });
    return { ok: "Account added." };
  });
}

export async function setOpening(id: number, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN");
    const openingBalance = int(fd, "openingBalance") ?? 0;
    await db.account.update({ where: { id }, data: { openingBalance } });
    await db.auditLog.create({ data: { userId: user.id, action: "account.opening", entity: "Account", entityId: id, detail: { openingBalance } } });
    return { ok: "Opening balance saved." };
  });
}

export async function addCategory(fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN");
    await db.expenseCategory.create({ data: { name: need(str(fd, "name"), "Name") } });
    return { ok: "Category added." };
  });
}

export async function addUser(fd: FormData) {
  return act(async () => {
    const admin = await requireUser("ADMIN");
    const password = need(str(fd, "password"), "Password");
    if (password.length < 8) return { error: "The password needs at least 8 characters." };
    const u = await db.user.create({
      data: { name: need(str(fd, "name"), "Name"), username: need(str(fd, "username"), "Username").toLowerCase(), role: (str(fd, "role") as Role) ?? "CASHIER", passwordHash: await hashPassword(password) },
    });
    await db.auditLog.create({ data: { userId: admin.id, action: "user.add", entity: "User", entityId: u.id, detail: { username: u.username, role: u.role } } });
    return { ok: `${u.name} can now sign in.` };
  });
}

export async function updateUser(id: number, fd: FormData) {
  return act(async () => {
    const admin = await requireUser("ADMIN");
    const password = str(fd, "password");
    if (password && password.length < 8) return { error: "The password needs at least 8 characters." };
    const active = fd.get("active") === "on";
    if (id === admin.id && !active) return { error: "You cannot switch off your own account." };
    await db.user.update({
      where: { id },
      data: { role: (str(fd, "role") as Role) ?? undefined, active, ...(password ? { passwordHash: await hashPassword(password) } : {}) },
    });
    if (!active || password) await db.session.deleteMany({ where: { userId: id } });
    await db.auditLog.create({ data: { userId: admin.id, action: "user.update", entity: "User", entityId: id, detail: { role: str(fd, "role"), active, passwordReset: !!password } } });
    return { ok: "Saved." };
  });
}
