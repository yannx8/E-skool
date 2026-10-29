"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { ActionForm, type ActionResult } from "@/components/action-form";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { allocate } from "@/lib/money";
import { fmt } from "@/lib/format";

type Open = { id: number; pupil: string; label: string; dueOn: string; dueLabel: string; balance: number; late: boolean };
type Account = { id: number; name: string; kind: string };

const METHODS = [
  { v: "CASH", label: "Cash" },
  { v: "MTN_MOMO", label: "MTN MoMo" },
  { v: "ORANGE_MONEY", label: "Orange Money" },
  { v: "BANK", label: "Bank" },
] as const;

function accountFor(method: string, accounts: Account[]) {
  const by = (f: (a: Account) => boolean) => accounts.find(f)?.id;
  if (method === "CASH") return by((a) => a.kind === "CASH");
  if (method === "MTN_MOMO") return by((a) => /mtn/i.test(a.name)) ?? by((a) => a.kind === "MOBILE");
  if (method === "ORANGE_MONEY") return by((a) => /orange/i.test(a.name)) ?? by((a) => a.kind === "MOBILE");
  return by((a) => a.kind === "BANK");
}

export function PaymentForm({ action, open, accounts, guardian, today, dueNow }: { action: (fd: FormData) => Promise<ActionResult>; open: Open[]; accounts: Account[]; guardian: string; today: string; dueNow: number }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("CASH");
  const [accountId, setAccountId] = useState<number | undefined>(accountFor("CASH", accounts));
  const [manual, setManual] = useState<Record<number, string> | null>(null);
  const received = Number(amount.replace(/\D/g, "")) || 0;
  const total = open.reduce((s, o) => s + o.balance, 0);

  // Default split: oldest due first. The cashier can switch to typing their own.
  const auto = useMemo(() => allocate(open.map((o) => ({ id: o.id, dueOn: o.dueOn, balance: o.balance })), received), [open, received]);
  const split = (id: number) => (manual ? Number((manual[id] ?? "").replace(/\D/g, "")) || 0 : (auto.splits.find((s) => s.chargeId === id)?.amount ?? 0));
  const applied = open.reduce((s, o) => s + split(o.id), 0);
  const credit = received - applied;
  const overSplit = manual !== null && applied > received;

  return (
    <ActionForm action={action} className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-5 rounded-box border border-line bg-panel p-5">
        <Field label="Amount received (F)">
          <input
            name="amount"
            required
            autoFocus
            inputMode="numeric"
            value={amount ? fmt(received) : ""}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={`${inputClass} num min-h-16 text-[32px] font-semibold`}
          />
        </Field>
        <div className="flex flex-wrap gap-2 text-[14px]">
          {dueNow > 0 && (
            <button type="button" className="rounded-md bg-sun-soft px-2.5 py-1.5 font-medium hover:bg-sun" onClick={() => setAmount(String(dueNow))}>
              Due now · {fmt(dueNow)}
            </button>
          )}
          {total > dueNow && (
            <button type="button" className="rounded-md bg-later-soft px-2.5 py-1.5 font-medium hover:bg-line" onClick={() => setAmount(String(total))}>
              Whole year · {fmt(total)}
            </button>
          )}
        </div>
        <fieldset>
          <legend className="mb-1.5 text-[14px] font-medium text-ink-2">Paid by</legend>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <label key={m.v} className={clsx("flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-[15px] font-medium", method === m.v ? "border-rail bg-rail text-white" : "border-line-strong bg-panel hover:border-ink-3")}>
                <input
                  type="radio"
                  name="method"
                  value={m.v}
                  checked={method === m.v}
                  onChange={() => {
                    setMethod(m.v);
                    setAccountId(accountFor(m.v, accounts));
                  }}
                  className="sr-only"
                />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>
        {method !== "CASH" && (
          <Field label="Transaction ID" hint="From the MoMo SMS or the bank slip.">
            <input name="reference" required className={`${inputClass} num`} />
          </Field>
        )}
        <Field label="Money goes into">
          <select name="accountId" value={accountId ?? ""} onChange={(e) => setAccountId(Number(e.target.value))} className={inputClass}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brought by">
            <input name="payer" defaultValue={guardian} className={inputClass} />
          </Field>
          <Field label="Date">
            <input name="paidOn" type="date" defaultValue={today} max={today} className={inputClass} />
          </Field>
        </div>
        <Field label="Note">
          <input name="note" className={inputClass} />
        </Field>
      </div>

      <div className="rounded-box border border-line bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <h2 className="text-[17px] font-bold">What this payment covers</h2>
          <button type="button" className="text-[14px] text-ink-2 underline" onClick={() => setManual(manual ? null : Object.fromEntries(open.map((o) => [o.id, String(split(o.id) || "")])))}>
            {manual ? "Back to automatic" : "Split it myself"}
          </button>
        </div>
        <p className="px-5 pt-3 text-[14px] text-ink-2">{manual ? "Type the amount for each fee." : "Oldest fees are paid first, across all the children."}</p>
        <table className="w-full text-[15px]">
          <tbody>
            {open.map((o) => {
              const s = split(o.id);
              return (
                <tr key={o.id} className="border-t border-line first:border-t-0">
                  <td className="px-5 py-3">
                    <div className="font-medium">{o.pupil}</div>
                    <div className="text-[14px] text-ink-2">
                      {o.label} · <span className={o.late ? "text-late" : ""}>due {o.dueLabel}</span>
                    </div>
                  </td>
                  <td className="num px-3 text-right text-ink-3">{fmt(o.balance)}</td>
                  <td className="w-36 px-5 py-2 text-right">
                    {manual ? (
                      <input aria-label={`Amount for ${o.label}`} inputMode="numeric" value={manual[o.id] ?? ""} onChange={(e) => setManual({ ...manual, [o.id]: e.target.value })} className={`${inputClass} num min-h-10 text-right`} />
                    ) : (
                      <span className={clsx("num font-semibold", s ? (s === o.balance ? "text-paid" : "text-part") : "text-ink-3")}>{s ? fmt(s) : "—"}</span>
                    )}
                    {s > 0 && <input type="hidden" name="split" value={`${o.id}:${Math.min(s, o.balance)}`} />}
                  </td>
                </tr>
              );
            })}
            {!open.length && (
              <tr>
                <td className="px-5 py-6 text-ink-2">Nothing is owed. The whole amount will be kept as credit for the next fees.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="space-y-1 border-t border-line bg-ground/50 px-5 py-4">
          <div className="flex justify-between">
            <span>Applied to fees</span>
            <span className="num font-semibold">{fmt(applied)}</span>
          </div>
          {credit > 0 && (
            <div className="flex justify-between text-paid">
              <span>Kept as credit</span>
              <span className="num font-semibold">{fmt(credit)}</span>
            </div>
          )}
          {overSplit && <p className="text-late">The split is {fmt(applied - received)} F more than the amount received.</p>}
          <button disabled={!received || overSplit} className={buttonClass("primary", "mt-3 w-full min-h-13 text-[17px]")}>
            Save and print receipt{received ? ` · ${fmt(received)} F` : ""}
          </button>
        </div>
      </div>
    </ActionForm>
  );
}
