"use server";

import { db } from "@/lib/db";
import { act, int, need, str } from "@/lib/act";
import { requireUser } from "@/lib/auth";
import { accountPosition } from "@/lib/queries";
import { day, fmt, today } from "@/lib/format";

/**
 * Blind count (Loyverse, Toast): the cashier types what is in the box before
 * seeing what the books expect. A difference must be explained, then it stays on record.
 */
export async function countCash(accountId: number, fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN", "CASHIER");
    const counted = need(int(fd, "counted"), "Amount counted");
    const note = str(fd, "note");
    const account = await db.account.findUniqueOrThrow({ where: { id: accountId } });
    const { balance: expected } = await accountPosition(accountId, account.openingBalance);
    const diff = counted - expected;
    if (diff !== 0 && !note)
      return { error: `Counted ${fmt(counted)} F, the books expect ${fmt(expected)} F: ${fmt(Math.abs(diff))} F ${diff < 0 ? "short" : "over"}. Count again, or write what happened in the note and save again.` };
    await db.cashCount.create({ data: { accountId, counted, expected, note, createdById: user.id } });
    return { ok: diff === 0 ? "Count matches the books." : `Count saved with ${fmt(Math.abs(diff))} F ${diff < 0 ? "short" : "over"}. The owner will see it.` };
  });
}

export async function transfer(fd: FormData) {
  return act(async () => {
    const user = await requireUser("ADMIN", "CASHIER");
    const fromAccountId = need(int(fd, "fromAccountId"), "From");
    const toAccountId = need(int(fd, "toAccountId"), "To");
    if (fromAccountId === toAccountId) return { error: "Choose two different accounts." };
    const amount = need(int(fd, "amount"), "Amount");
    const from = await db.account.findUniqueOrThrow({ where: { id: fromAccountId } });
    const { balance } = await accountPosition(from.id, from.openingBalance);
    if (amount > balance) return { error: `${from.name} only holds ${fmt(balance)} F.` };
    const movedOn = str(fd, "movedOn") ?? today();
    await db.transfer.create({ data: { fromAccountId, toAccountId, amount, movedOn: day(movedOn), reference: str(fd, "reference"), note: str(fd, "note"), createdById: user.id } });
    return { ok: "Transfer recorded." };
  });
}
