import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentYear, getSchool } from "@/lib/queries";
import { dateLabel, fmt, phoneLabel } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Dialog } from "@/components/dialog";
import { Field, PageHeader, Panel, Tag, buttonClass, inputClass, td, th, tr } from "@/components/ui";
import { addAccount, addCategory, addClass, addUser, renameClass, saveSchool, setOpening, updateUser } from "./actions";

export const metadata = { title: "Settings" };

const ROLE = { ADMIN: "Administrator", CASHIER: "Cashier", OWNER: "Owner (view only)" } as const;

export default async function SettingsPage() {
  const me = await requireUser();
  const admin = me.role === "ADMIN";
  const [school, year, classes, accounts, categories, users] = await Promise.all([
    getSchool(),
    currentYear(),
    db.class.findMany({ orderBy: { level: "asc" }, include: { _count: { select: { enrollments: true } } } }),
    db.account.findMany({ orderBy: { id: "asc" } }),
    db.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({ orderBy: { id: "asc" } }),
  ]);
  if (!school) return null;

  return (
    <>
      <PageHeader title="Settings" sub={year && `School year ${year.name} · ${dateLabel(year.startsOn)} to ${dateLabel(year.endsOn)}`} />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/settings/fees" className={buttonClass("primary")}>Fee table</Link>
        <Link href="/settings/import" className={buttonClass()}>Import pupils from Excel</Link>
        <Link href="/settings/data" className={buttonClass()}>Backup & export</Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="School and receipts">
          <ActionForm action={saveSchool} className="space-y-4">
            <fieldset disabled={!admin} className="contents">
              <Field label="School name"><input name="name" defaultValue={school.name} className={inputClass} /></Field>
              <Field label="Motto"><input name="motto" defaultValue={school.motto ?? ""} className={inputClass} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Address"><input name="address" defaultValue={school.address ?? ""} className={inputClass} /></Field>
                <Field label="Phone"><input name="phone" defaultValue={school.phone ? phoneLabel(school.phone) : ""} className={inputClass} /></Field>
                <Field label="Email"><input name="email" defaultValue={school.email ?? ""} className={inputClass} /></Field>
                <Field label="Receipt paper">
                  <select name="receiptSize" defaultValue={school.receiptSize} className={inputClass}>
                    <option value="A5">A5 sheet</option>
                    <option value="THERMAL">80 mm ticket printer</option>
                  </select>
                </Field>
              </div>
              <Field label="Line at the bottom of receipts"><input name="receiptNote" defaultValue={school.receiptNote ?? ""} placeholder="Fees paid are not refundable." className={inputClass} /></Field>
              <Field label="WhatsApp reminder message" hint="{guardian}, {school}, {amount} and {pupils} are filled in for each family.">
                <textarea name="reminderTemplate" rows={4} defaultValue={school.reminderTemplate} className={`${inputClass} py-2`} />
              </Field>
              {admin && <button className={buttonClass("primary")}>Save</button>}
            </fieldset>
          </ActionForm>
        </Panel>

        <div className="space-y-6">
          <Panel title="Classes" flush>
            <table className="w-full text-[15px]">
              <thead><tr><th className={th}>Order</th><th className={th}>Name</th><th className={th}>Enrollments</th><th className={th} /></tr></thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className={tr}>
                    <td className={`${td} num`}>{c.level}</td>
                    <td className={td}>{c.name}</td>
                    <td className={`${td} num text-ink-2`}>{c._count.enrollments}</td>
                    <td className={`${td} text-right`}>
                      {admin && (
                        <Dialog label="Edit" title={`Edit ${c.name}`} className="text-[14px] text-ink-2 underline">
                          <ActionForm action={renameClass.bind(null, c.id)} className="space-y-4">
                            <Field label="Name"><input name="name" defaultValue={c.name} className={inputClass} /></Field>
                            <Field label="Order" hint="Used to sort lists and to promote pupils."><input name="level" inputMode="numeric" defaultValue={c.level} className={inputClass} /></Field>
                            <button className={buttonClass("primary", "w-full")}>Save</button>
                          </ActionForm>
                        </Dialog>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admin && (
              <ActionForm action={addClass} className="flex gap-2 border-t border-line p-4">
                <input name="name" required placeholder="New class" className={inputClass} />
                <button className={buttonClass()}>Add</button>
              </ActionForm>
            )}
          </Panel>

          <Panel title="Money accounts" flush>
            <table className="w-full text-[15px]">
              <thead><tr><th className={th}>Account</th><th className={th}>Kind</th><th className={`${th} text-right`}>Opening balance</th></tr></thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className={tr}>
                    <td className={td}>{a.name}</td>
                    <td className={`${td} text-ink-2`}>{a.kind === "CASH" ? "Cash" : a.kind === "MOBILE" ? "Mobile Money" : "Bank"}</td>
                    <td className={`${td} text-right`}>
                      {admin ? (
                        <Dialog label={<span className="num">{fmt(a.openingBalance)}</span>} title={`Opening balance of ${a.name}`} className="underline">
                          <ActionForm action={setOpening.bind(null, a.id)} className="space-y-4">
                            <Field label="Amount in the account when you started using E-skool (F)"><input name="openingBalance" inputMode="numeric" defaultValue={a.openingBalance} className={inputClass} /></Field>
                            <button className={buttonClass("primary", "w-full")}>Save</button>
                          </ActionForm>
                        </Dialog>
                      ) : (
                        <span className="num">{fmt(a.openingBalance)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admin && (
              <ActionForm action={addAccount} className="grid gap-2 border-t border-line p-4 sm:grid-cols-[1fr_auto_auto]">
                <input name="name" required placeholder="e.g. Afriland bank" className={inputClass} />
                <select name="kind" className={inputClass}>
                  <option value="BANK">Bank</option>
                  <option value="MOBILE">Mobile Money</option>
                  <option value="CASH">Cash</option>
                </select>
                <button className={buttonClass()}>Add</button>
              </ActionForm>
            )}
          </Panel>

          <Panel title="Expense categories">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => <Tag key={c.id}>{c.name}</Tag>)}
            </div>
            {admin && (
              <ActionForm action={addCategory} className="mt-4 flex gap-2">
                <input name="name" required placeholder="New category" className={inputClass} />
                <button className={buttonClass()}>Add</button>
              </ActionForm>
            )}
          </Panel>
        </div>

        <Panel title="People who can sign in" flush className="xl:col-span-2">
          <table className="w-full text-[15px]">
            <thead><tr><th className={th}>Name</th><th className={th}>Username</th><th className={th}>Role</th><th className={th}>Last sign-in</th><th className={th} /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={tr}>
                  <td className={td}>{u.name} {!u.active && <Tag tone="late">Switched off</Tag>}</td>
                  <td className={`${td} num text-ink-2`}>{u.username}</td>
                  <td className={td}>{ROLE[u.role]}</td>
                  <td className={`${td} text-ink-2`}>{u.lastLoginAt ? dateLabel(u.lastLoginAt) : "Never"}</td>
                  <td className={`${td} text-right`}>
                    {admin && (
                      <Dialog label="Edit" title={`Edit ${u.name}`} className="text-[14px] text-ink-2 underline">
                        <ActionForm action={updateUser.bind(null, u.id)} className="space-y-4">
                          <Field label="Role">
                            <select name="role" defaultValue={u.role} className={inputClass}>
                              {Object.entries(ROLE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                          </Field>
                          <Field label="New password" hint="Leave blank to keep the current one."><input name="password" type="password" minLength={8} className={inputClass} /></Field>
                          <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={u.active} className="size-5 accent-rail" /> Can sign in</label>
                          <button className={buttonClass("primary", "w-full")}>Save</button>
                        </ActionForm>
                      </Dialog>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {admin && (
            <ActionForm action={addUser} className="grid gap-2 border-t border-line p-4 sm:grid-cols-5">
              <input name="name" required placeholder="Full name" className={inputClass} />
              <input name="username" required placeholder="Username" autoCapitalize="none" className={inputClass} />
              <input name="password" type="password" required minLength={8} placeholder="Password" className={inputClass} />
              <select name="role" defaultValue="CASHIER" className={inputClass}>
                {Object.entries(ROLE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button className={buttonClass()}>Add person</button>
            </ActionForm>
          )}
          <p className="border-t border-line px-5 py-3 text-[14px] text-ink-2">
            Cashiers receive payments, print receipts, record expenses and count the cash. Only administrators void receipts, give discounts and change fees. Owners see everything and change nothing.
          </p>
        </Panel>
      </div>
    </>
  );
}
