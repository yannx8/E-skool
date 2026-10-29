"use server";

import { act, int, need, str } from "@/lib/act";
import { requireUser } from "@/lib/auth";
import { recordPayment, voidPayment } from "@/lib/billing";
import { today } from "@/lib/format";
import type { Method } from "@/generated/prisma/client";

const METHODS: Method[] = ["CASH", "MTN_MOMO", "ORANGE_MONEY", "BANK"];

export async function receivePayment(familyId: number, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN", "CASHIER");
    const method = str(fd, "method") as Method;
    if (!METHODS.includes(method)) return { error: "Choose how the parent paid." };
    const reference = str(fd, "reference");
    if (method !== "CASH" && !reference) return { error: "Enter the transaction ID from the MoMo or bank message." };
    const paidOn = str(fd, "paidOn") ?? today();
    if (paidOn > today()) return { error: "The payment date cannot be in the future." };
    const splits = fd
      .getAll("split")
      .map((v) => String(v).split(":").map(Number))
      .map(([chargeId, amount]) => ({ chargeId, amount }));
    const p = await recordPayment(
      {
        familyId,
        amount: need(int(fd, "amount"), "Amount received"),
        method,
        accountId: need(int(fd, "accountId"), "Account"),
        paidOn,
        reference,
        payer: str(fd, "payer"),
        note: str(fd, "note"),
        splits: splits.length ? splits : undefined,
      },
      user.id,
    );
    return { ok: `Receipt ${p.number} saved.`, go: `/payments/${p.id}` };
  });
}

export async function voidReceipt(id: number, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN");
    await voidPayment(id, str(fd, "reason") ?? "", user.id);
    return { ok: "Receipt voided. The fees it paid are open again." };
  });
}
