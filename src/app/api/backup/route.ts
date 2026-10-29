import { gzipSync } from "node:zlib";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { today } from "@/lib/format";

/** Every table as JSON, gzipped. Keep a copy on a USB key or Google Drive. */
export async function GET() {
  const user = await currentUser();
  if (!user || user.role === "CASHIER") return new Response("Administrators and owners only", { status: 403 });
  const dump = {
    exportedAt: new Date().toISOString(),
    school: await db.school.findMany(),
    users: await db.user.findMany({ omit: { passwordHash: true } }),
    years: await db.year.findMany(),
    classes: await db.class.findMany(),
    feeItems: await db.feeItem.findMany(),
    feeAmounts: await db.feeAmount.findMany(),
    families: await db.family.findMany(),
    pupils: await db.pupil.findMany(),
    enrollments: await db.enrollment.findMany(),
    charges: await db.charge.findMany(),
    accounts: await db.account.findMany(),
    payments: await db.payment.findMany(),
    allocations: await db.allocation.findMany(),
    promises: await db.paymentPromise.findMany(),
    reminders: await db.reminder.findMany(),
    expenseCategories: await db.expenseCategory.findMany(),
    staff: await db.staff.findMany(),
    expenses: await db.expense.findMany(),
    transfers: await db.transfer.findMany(),
    cashCounts: await db.cashCount.findMany(),
    auditLog: await db.auditLog.findMany(),
  };
  return new Response(gzipSync(JSON.stringify(dump)), {
    headers: { "Content-Type": "application/gzip", "Content-Disposition": `attachment; filename="eskool-backup-${today()}.json.gz"` },
  });
}
