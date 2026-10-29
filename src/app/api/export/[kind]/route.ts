import Papa from "papaparse";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { allFamilies } from "@/lib/queries";
import { METHOD_LABEL, iso, receiptNo, today } from "@/lib/format";

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await currentUser())) return new Response("Sign in first", { status: 401 });
  const { kind } = await params;
  let rows: Record<string, unknown>[];

  if (kind === "families" || kind === "owing") {
    const families = await allFamilies();
    rows = families
      .filter((f) => kind === "families" || f.dueNow > 0)
      .flatMap((f) =>
        f.pupils.map((p) => ({
          family: f.name,
          guardian: f.guardian,
          phone: f.phone,
          pupil: p.name,
          admission_no: p.code,
          class: p.className,
          billed_this_year: p.billed,
          paid_this_year: p.paid,
          due_now: p.dueNow,
          balance: p.balance,
          family_days_late: f.daysLate,
        })),
      );
  } else if (kind === "payments") {
    const ps = await db.payment.findMany({ orderBy: { number: "asc" }, include: { family: true, createdBy: true, account: true } });
    rows = ps.map((p) => ({ receipt: receiptNo(p.number), date: iso(p.paidOn), family: p.family.name, amount: p.amount, method: METHOD_LABEL[p.method], reference: p.reference, account: p.account.name, cashier: p.createdBy.name, void: p.voidedAt ? "yes" : "", void_reason: p.voidReason }));
  } else if (kind === "expenses") {
    const es = await db.expense.findMany({ orderBy: { spentOn: "asc" }, include: { category: true, account: true, createdBy: true } });
    rows = es.map((e) => ({ date: iso(e.spentOn), description: e.description, category: e.category.name, amount: e.amount, account: e.account.name, payee: e.payee, reference: e.reference, entered_by: e.createdBy.name, void: e.voidedAt ? "yes" : "", void_reason: e.voidReason }));
  } else return new Response("Unknown export", { status: 404 });

  // BOM so Excel opens accents correctly.
  return new Response("﻿" + Papa.unparse(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="eskool-${kind}-${today()}.csv"` },
  });
}
