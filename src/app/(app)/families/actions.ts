"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { act, int, need, str } from "@/lib/act";
import { requireUser } from "@/lib/auth";
import { applyCredit, syncCharges } from "@/lib/billing";
import { currentYear } from "@/lib/queries";
import { day, normalizePhone, today } from "@/lib/format";
import type { Channel } from "@/generated/prisma/client";

const familyData = (fd: FormData) => {
  const phone = str(fd, "phone");
  if (phone && !normalizePhone(phone)) throw new Error(`"${phone}" is not a Cameroon phone number (9 digits).`);
  return {
    name: need(str(fd, "name"), "Family name").toUpperCase(),
    guardian: str(fd, "guardian"),
    phone: normalizePhone(phone),
    phone2: normalizePhone(str(fd, "phone2")),
    address: str(fd, "address"),
    notes: str(fd, "notes"),
  };
};

async function nextCode() {
  const year = await currentYear();
  const prefix = (year?.name ?? String(new Date().getFullYear())).slice(2, 4);
  const last = await db.pupil.findFirst({ where: { code: { startsWith: `${prefix}-` } }, orderBy: { code: "desc" } });
  const n = last ? Number(last.code.split("-")[1]) + 1 : 1;
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

/** Enroll a pupil in the current year and bill the fee table for the class. */
async function enroll(pupilId: number, classId: number, joinedOn: string) {
  const year = await currentYear();
  if (!year) throw new Error("Create a school year first (Settings).");
  await db.$transaction(async (tx) => {
    const e = await tx.enrollment.upsert({
      where: { pupilId_yearId: { pupilId, yearId: year.id } },
      create: { pupilId, yearId: year.id, classId, joinedOn: day(joinedOn) },
      update: { classId, leftOn: null },
    });
    await syncCharges(tx, e.id);
    const p = await tx.pupil.findUniqueOrThrow({ where: { id: pupilId } });
    await applyCredit(tx, p.familyId);
  });
}

export async function createFamily(fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN", "CASHIER");
    const family = await db.family.create({ data: familyData(fd) });
    const names = fd.getAll("firstNames");
    for (let i = 0; i < names.length; i++) {
      const firstNames = String(names[i]).trim();
      if (!firstNames) continue;
      const classId = Number(fd.getAll("classId")[i]);
      const pupil = await db.pupil.create({
        data: {
          familyId: family.id,
          code: await nextCode(),
          lastName: String(fd.getAll("lastName")[i] || family.name).trim().toUpperCase(),
          firstNames,
          sex: String(fd.getAll("sex")[i] || "") || null,
          birthDate: fd.getAll("birthDate")[i] ? day(String(fd.getAll("birthDate")[i])) : null,
        },
      });
      if (classId) await enroll(pupil.id, classId, today());
    }
    return { ok: `${family.name} family added.`, go: `/families/${family.id}` };
  });
}

export async function updateFamily(id: number, fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN", "CASHIER");
    await db.family.update({ where: { id }, data: familyData(fd) });
    return { ok: "Saved.", go: `/families/${id}` };
  });
}

export async function addPupil(familyId: number, fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN", "CASHIER");
    const family = await db.family.findUniqueOrThrow({ where: { id: familyId } });
    const pupil = await db.pupil.create({
      data: {
        familyId,
        code: await nextCode(),
        lastName: (str(fd, "lastName") ?? family.name).toUpperCase(),
        firstNames: need(str(fd, "firstNames"), "First names"),
        sex: str(fd, "sex"),
        birthDate: str(fd, "birthDate") ? day(str(fd, "birthDate")!) : null,
      },
    });
    await enroll(pupil.id, need(int(fd, "classId"), "Class"), str(fd, "joinedOn") ?? today());
    revalidatePath(`/families/${familyId}`);
    return { ok: `${pupil.firstNames} enrolled.` };
  });
}

export async function changeClass(pupilId: number, fd: FormData) {
  return act(async () => {
    await requireUser("ADMIN");
    await enroll(pupilId, need(int(fd, "classId"), "Class"), today());
    return { ok: "Class changed. Fees follow the new class." };
  });
}

export async function markLeft(pupilId: number, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN");
    const year = await currentYear();
    const leftOn = need(str(fd, "leftOn"), "Date");
    await db.$transaction(async (tx) => {
      const e = await tx.enrollment.update({
        where: { pupilId_yearId: { pupilId, yearId: year!.id } },
        data: { leftOn: day(leftOn) },
      });
      await tx.pupil.update({ where: { id: pupilId }, data: { status: "LEFT" } });
      await syncCharges(tx, e.id);
      await tx.auditLog.create({ data: { userId: user.id, action: "pupil.left", entity: "Pupil", entityId: pupilId, detail: { leftOn } } });
    });
    return { ok: "Marked as left. Installments due after that date are cancelled; earlier debt stays." };
  });
}

export async function giveDiscount(chargeId: number, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN");
    const c = await db.charge.findUniqueOrThrow({ where: { id: chargeId }, include: { allocations: { include: { payment: true } } } });
    const paid = c.allocations.reduce((s, a) => (a.payment.voidedAt ? s : s + a.amount), 0);
    const pct = int(fd, "percent");
    const discount = pct !== null ? Math.round((c.amount * Math.min(pct, 100)) / 100) : (int(fd, "amount") ?? 0);
    if (discount > c.amount - paid) return { error: `At most ${c.amount - paid} can be discounted: the rest is already paid.` };
    const reason = need(str(fd, "reason"), "Reason");
    await db.charge.update({ where: { id: chargeId }, data: { discount, discountReason: discount ? reason : null } });
    await db.auditLog.create({ data: { userId: user.id, action: "charge.discount", entity: "Charge", entityId: chargeId, detail: { label: c.label, discount, reason } } });
    return { ok: discount ? "Discount saved." : "Discount removed." };
  });
}

export async function addCharge(pupilId: number, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN", "CASHIER");
    const year = await currentYear();
    const e = await db.enrollment.findUnique({ where: { pupilId_yearId: { pupilId, yearId: year!.id } }, include: { pupil: true } });
    if (!e) return { error: "This pupil is not enrolled this year." };
    const feeItemId = int(fd, "feeItemId");
    await db.$transaction(async (tx) => {
      if (feeItemId) {
        const item = await tx.feeItem.findUniqueOrThrow({ where: { id: feeItemId }, include: { amounts: { where: { classId: e.classId } } } });
        await tx.charge.upsert({
          where: { enrollmentId_feeItemId: { enrollmentId: e.id, feeItemId } },
          create: { enrollmentId: e.id, feeItemId, label: item.name, amount: item.amounts[0]?.amount ?? 0, dueOn: item.dueOn },
          update: { cancelledAt: null, cancelReason: null },
        });
      } else {
        await tx.charge.create({
          data: { enrollmentId: e.id, label: need(str(fd, "label"), "Description"), amount: need(int(fd, "amount"), "Amount"), dueOn: day(str(fd, "dueOn") ?? today()) },
        });
      }
      await tx.auditLog.create({ data: { userId: user.id, action: "charge.add", entity: "Pupil", entityId: pupilId, detail: { feeItemId, label: str(fd, "label") } } });
      await applyCredit(tx, e.pupil.familyId);
    });
    return { ok: "Fee added." };
  });
}

export async function cancelCharge(chargeId: number, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN");
    const c = await db.charge.findUniqueOrThrow({ where: { id: chargeId }, include: { allocations: { include: { payment: true } } } });
    if (c.allocations.some((a) => !a.payment.voidedAt)) return { error: "Money was already paid on this fee. Void that receipt first." };
    const reason = need(str(fd, "reason"), "Reason");
    await db.charge.update({ where: { id: chargeId }, data: { cancelledAt: new Date(), cancelReason: reason } });
    await db.auditLog.create({ data: { userId: user.id, action: "charge.cancel", entity: "Charge", entityId: chargeId, detail: { label: c.label, amount: c.amount, reason } } });
    return { ok: "Fee removed." };
  });
}

export async function makePromise(familyId: number, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN", "CASHIER");
    const dueOn = need(str(fd, "dueOn"), "Date");
    if (dueOn < today()) return { error: "The promised date is already past." };
    await db.$transaction([
      db.paymentPromise.updateMany({ where: { familyId, cancelledAt: null }, data: { cancelledAt: new Date() } }),
      db.paymentPromise.create({ data: { familyId, amount: need(int(fd, "amount"), "Amount"), dueOn: day(dueOn), note: str(fd, "note"), createdById: user.id } }),
      // Reminders wait while the family keeps its promise (FACTS hardship plans).
      db.family.update({ where: { id: familyId }, data: { remindersPausedUntil: day(dueOn) } }),
    ]);
    return { ok: "Promise recorded. Reminders pause until that date." };
  });
}

export async function logReminder(familyId: number, channel: Channel, amountDue: number) {
  const user = await requireUser("ADMIN", "CASHIER");
  await db.reminder.create({ data: { familyId, channel, amountDue, createdById: user.id } });
  revalidatePath("/collections");
  revalidatePath(`/families/${familyId}`);
}
