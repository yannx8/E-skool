"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { applyCredit, recordPayment, syncCharges } from "@/lib/billing";
import { currentYear } from "@/lib/queries";
import { day, normalizePhone, today } from "@/lib/format";
import type { ActionResult } from "@/components/action-form";

export type ImportRow = { family: string; guardian?: string; phone?: string; firstNames: string; lastName?: string; className: string; sex?: string; birthDate?: string; paid?: number };

/**
 * Creates families (grouped by family name + phone), pupils, enrollments and
 * their bills, then records what each family already paid as an opening payment.
 * Re-importing the same sheet skips pupils that already exist (same name, same family).
 */
export async function importRows(rows: ImportRow[]): Promise<ActionResult> {
  try {
    const user = await requireUser("ADMIN");
    const year = await currentYear();
    if (!year) return { error: "Create the school year first." };
    const classes = await db.class.findMany();
    const cash = await db.account.findFirst({ where: { kind: "CASH" } });
    const byName = new Map(classes.map((c) => [c.name.toLowerCase().replace(/\s+/g, ""), c]));
    const prefix = year.name.slice(2, 4);
    let seq = Number((await db.pupil.findFirst({ where: { code: { startsWith: `${prefix}-` } }, orderBy: { code: "desc" } }))?.code.split("-")[1] ?? 0);
    let created = 0;
    let skipped = 0;
    const paidByFamily = new Map<number, number>();

    for (const r of rows) {
      const cls = byName.get(r.className.toLowerCase().replace(/\s+/g, ""));
      if (!cls) return { error: `Unknown class "${r.className}". Nothing after ${created} pupils was imported.` };
      const name = r.family.trim().toUpperCase();
      const phone = normalizePhone(r.phone);
      const family = (await db.family.findFirst({ where: { name, ...(phone ? { phone } : {}) } })) ?? (await db.family.create({ data: { name, guardian: r.guardian || null, phone } }));
      const lastName = (r.lastName || name).trim().toUpperCase();
      const exists = await db.pupil.findFirst({ where: { familyId: family.id, lastName, firstNames: { equals: r.firstNames.trim(), mode: "insensitive" } } });
      if (exists) {
        skipped++;
        continue;
      }
      const pupil = await db.pupil.create({
        data: { familyId: family.id, code: `${prefix}-${String(++seq).padStart(4, "0")}`, lastName, firstNames: r.firstNames.trim(), sex: r.sex === "F" || r.sex === "M" ? r.sex : null, birthDate: r.birthDate ? day(r.birthDate) : null },
      });
      await db.$transaction(async (tx) => {
        const e = await tx.enrollment.create({ data: { pupilId: pupil.id, yearId: year.id, classId: cls.id, joinedOn: year.startsOn } });
        await syncCharges(tx, e.id);
      });
      if (r.paid) paidByFamily.set(family.id, (paidByFamily.get(family.id) ?? 0) + r.paid);
      created++;
    }
    for (const [familyId, amount] of paidByFamily)
      await recordPayment({ familyId, amount, method: "OPENING", accountId: cash!.id, paidOn: today(), note: "Paid before E-skool (import)" }, user.id);
    for (const familyId of paidByFamily.keys()) await db.$transaction((tx) => applyCredit(tx, familyId));
    await db.auditLog.create({ data: { userId: user.id, action: "import", entity: "Pupil", detail: { created, skipped } } });
    return { ok: `${created} pupils imported${skipped ? `, ${skipped} already there` : ""}.`, go: "/families" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Import failed." };
  }
}
